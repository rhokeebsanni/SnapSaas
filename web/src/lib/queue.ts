import 'server-only';

import { Queue, type RedisOptions } from 'bullmq';

import { CAPTURE_QUEUE_NAME, type CaptureJobData } from '@/lib/capture';

/**
 * Parse REDIS_URL into BullMQ connection options. We hand BullMQ options rather
 * than a shared ioredis instance so it manages its own (correctly-typed)
 * connection — avoiding cross-package ioredis type/version clashes.
 */
export function redisConnection(): RedisOptions | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;
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

let queue: Queue<CaptureJobData> | null = null;

export function getCaptureQueue(): Queue<CaptureJobData> | null {
  if (queue) return queue;
  const connection = redisConnection();
  if (!connection) return null;
  queue = new Queue<CaptureJobData>(CAPTURE_QUEUE_NAME, { connection });
  return queue;
}

export const isQueueConfigured = () => Boolean(process.env.REDIS_URL);

export async function enqueueCapture(jobId: string): Promise<void> {
  const q = getCaptureQueue();
  if (!q) throw new Error('Queue is not configured (REDIS_URL missing)');
  await q.add(
    'capture',
    { jobId },
    {
      attempts: 2,
      backoff: { type: 'exponential', delay: 3000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    },
  );
}
