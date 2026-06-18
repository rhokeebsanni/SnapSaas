import { randomUUID } from 'node:crypto';
import { Worker, type Job as BullJob, type RedisOptions } from 'bullmq';
import { eq } from 'drizzle-orm';

import { env } from '../env';
import { getDb, schema } from '../db';
import { captureScreenshot } from '../capture/browser';
import { composeAsset } from '../compositing/compose';
import { uploadAsset, isR2Configured } from '../storage/r2';
import {
  CAPTURE_QUEUE_NAME,
  OUTPUT_FORMATS,
  fileExtension,
  type CaptureJobData,
  type CaptureSettings,
} from '../types';

async function processCapture(bullJob: BullJob<CaptureJobData>): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('DATABASE_URL is not configured');
  if (!isR2Configured()) throw new Error('R2 storage is not configured');

  const { jobId } = bullJob.data;
  const rows = await db.select().from(schema.job).where(eq(schema.job.id, jobId)).limit(1);
  const row = rows[0];
  if (!row) throw new Error(`Job ${jobId} not found`);

  await db
    .update(schema.job)
    .set({ status: 'processing', updatedAt: new Date() })
    .where(eq(schema.job.id, jobId));

  const settings = row.settings as CaptureSettings;

  // Capture once, then encode every output format from the same composite.
  const shot = await captureScreenshot(settings);

  for (const format of OUTPUT_FORMATS) {
    const output = await composeAsset(shot, { ...settings, format });
    const key = `captures/${row.userId}/${jobId}/${format}.${fileExtension(format)}`;
    const url = await uploadAsset(key, output.buffer, format);
    await db.insert(schema.asset).values({
      id: randomUUID(),
      jobId,
      userId: row.userId,
      r2Key: key,
      url,
      format,
      width: output.width,
      height: output.height,
      hasWatermark: settings.watermark,
    });
  }

  await db
    .update(schema.job)
    .set({ status: 'done', error: null, updatedAt: new Date() })
    .where(eq(schema.job.id, jobId));
}

function redisConnection(url: string): RedisOptions {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: Number(u.port || 6379),
    username: u.username || undefined,
    password: u.password || undefined,
    tls: u.protocol === 'rediss:' ? {} : undefined,
    maxRetriesPerRequest: null,
  };
}

export function startCaptureWorker(): Worker<CaptureJobData> | null {
  if (!env.REDIS_URL) {
    console.warn('[queue] REDIS_URL not set — capture worker disabled.');
    return null;
  }
  if (!getDb()) {
    console.warn('[queue] DATABASE_URL not set — capture worker disabled.');
    return null;
  }

  const worker = new Worker<CaptureJobData>(CAPTURE_QUEUE_NAME, processCapture, {
    connection: redisConnection(env.REDIS_URL),
    concurrency: 2,
  });

  worker.on('completed', (job) => console.log(`[queue] job ${job.data.jobId} done`));
  worker.on('failed', async (job, err) => {
    console.error(`[queue] job ${job?.data.jobId} failed:`, err.message);
    // Persist the failure so the web client stops polling.
    const db = getDb();
    if (db && job) {
      await db
        .update(schema.job)
        .set({ status: 'failed', error: err.message.slice(0, 500), updatedAt: new Date() })
        .where(eq(schema.job.id, job.data.jobId))
        .catch(() => undefined);
    }
  });

  console.log('🎯 Capture queue worker started');
  return worker;
}
