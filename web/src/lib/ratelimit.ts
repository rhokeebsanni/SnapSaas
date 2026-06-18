import 'server-only';

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let resolved = false;
let limiter: Ratelimit | null = null;

function getLimiter(): Ratelimit | null {
  if (resolved) return limiter;
  resolved = true;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  limiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(10, '60 s'),
    prefix: 'snapsaas:rl:capture',
    analytics: false,
  });
  return limiter;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

/** Sliding-window limit on captures. No-op (always allows) when unconfigured. */
export async function checkCaptureRateLimit(identifier: string): Promise<RateLimitResult> {
  const l = getLimiter();
  if (!l) return { success: true, remaining: 999, reset: 0 };
  const { success, remaining, reset } = await l.limit(identifier);
  return { success, remaining, reset };
}
