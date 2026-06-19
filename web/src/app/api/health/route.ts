import { NextResponse } from 'next/server';

import { getServerSession } from '@/lib/session';
import { isQueueConfigured } from '@/lib/queue';

export const dynamic = 'force-dynamic';

function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET &&
    process.env.R2_PUBLIC_URL,
  );
}

/** Ping the worker's /health with a short timeout so a down worker doesn't hang. */
async function probeWorker(): Promise<{ reachable: boolean; consumerRunning: boolean }> {
  const base = process.env.WORKER_URL ?? 'http://localhost:4000';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const res = await fetch(`${base}/health`, { signal: controller.signal, cache: 'no-store' });
    if (!res.ok) return { reachable: false, consumerRunning: false };
    const data = (await res.json().catch(() => null)) as {
      config?: { consumerRunning?: boolean };
    } | null;
    return { reachable: true, consumerRunning: Boolean(data?.config?.consumerRunning) };
  } catch {
    return { reachable: false, consumerRunning: false };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Preflight status for the editor: which services are configured on the web
 * side, plus whether the worker is reachable and its consumer is running.
 * Auth-gated since it reveals environment configuration.
 */
export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const database = Boolean(process.env.DATABASE_URL);
  const queue = isQueueConfigured();
  const storage = isR2Configured();
  const worker = await probeWorker();

  // Captures can actually run only when all of these line up.
  const ready = database && queue && storage && worker.reachable && worker.consumerRunning;

  return NextResponse.json({
    ready,
    checks: {
      database,
      queue,
      storage,
      workerReachable: worker.reachable,
      workerConsumer: worker.consumerRunning,
    },
  });
}
