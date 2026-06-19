import { randomUUID } from 'node:crypto';
import { Worker, type Job as BullJob, type RedisOptions } from 'bullmq';
import { and, eq, sql } from 'drizzle-orm';

import { env } from '../env';
import { getDb, schema } from '../db';
import { captureScreenshot } from '../capture/browser';
import { composeAsset } from '../compositing/compose';
import { uploadAsset, isR2Configured } from '../storage/r2';
import { sendAssetsReadyEmail } from '../email';
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

  // Notify the user (best-effort, env-gated).
  const owner = await db
    .select({ email: schema.user.email, name: schema.user.name })
    .from(schema.user)
    .where(eq(schema.user.id, row.userId))
    .limit(1);
  if (owner[0]) {
    await sendAssetsReadyEmail(owner[0].email, owner[0].name).catch(() => undefined);
  }
}

/**
 * Mark a job failed and, if it spent a finite credit, refund exactly one credit
 * to its owner. The conditional `creditRefunded` flip makes the refund safe
 * against retries / duplicate `failed` events: only the update that actually
 * flips the flag (returns a row) performs the credit bump.
 */
async function refundOnFailure(
  db: NonNullable<ReturnType<typeof getDb>>,
  jobId: string,
  message: string,
): Promise<void> {
  await db
    .update(schema.job)
    .set({ status: 'failed', error: message.slice(0, 500), updatedAt: new Date() })
    .where(eq(schema.job.id, jobId));

  const refunded = await db
    .update(schema.job)
    .set({ creditRefunded: true, updatedAt: new Date() })
    .where(
      and(
        eq(schema.job.id, jobId),
        eq(schema.job.creditSpent, true),
        eq(schema.job.creditRefunded, false),
      ),
    )
    .returning({ userId: schema.job.userId });

  const userId = refunded[0]?.userId;
  if (userId) {
    await db
      .update(schema.user)
      .set({ credits: sql`${schema.user.credits} + 1` })
      .where(eq(schema.user.id, userId));
    console.log(`[queue] refunded 1 credit to ${userId} for failed job ${jobId}`);
  }
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
    const db = getDb();
    if (!db || !job) return;
    await refundOnFailure(db, job.data.jobId, err.message).catch((e) =>
      console.error('[queue] refund/mark-failed error:', e),
    );
  });

  console.log('🎯 Capture queue worker started');
  return worker;
}
