import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';

import { db } from '@/db';
import { job, project, user } from '@/db/schema';
import { getServerSession } from '@/lib/session';
import { getAccount } from '@/lib/account';
import { captureSettingsSchema, type CaptureSettings, type OutputScale } from '@/lib/capture';
import { assertPublicUrl } from '@/lib/url-safety';
import { enqueueCapture, isQueueConfigured } from '@/lib/queue';
import { BACKGROUNDS } from '@/lib/templates';
import { checkCaptureRateLimit } from '@/lib/ratelimit';

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rl = await checkCaptureRateLimit(`user:${session.user.id}`);
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many captures right now — give it a moment and try again.' },
      { status: 429 },
    );
  }

  if (!isQueueConfigured()) {
    return NextResponse.json(
      {
        error:
          'Capturing isn’t switched on yet — the server is missing its REDIS_URL / R2 storage keys.',
      },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = captureSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid capture settings', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // SSRF protection: only ever capture public http(s) hosts.
  let targetUrl: URL;
  try {
    targetUrl = await assertPublicUrl(parsed.data.url);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'URL not allowed' },
      { status: 400 },
    );
  }

  // Validate the background and gate Pro-only templates. "custom" is a
  // user-built gradient (not in the preset catalog) and is available to all
  // plans, but it must carry a valid customGradient payload.
  const isCustom = parsed.data.background === 'custom';
  const bgOption = isCustom ? null : BACKGROUNDS.find((b) => b.id === parsed.data.background);
  if (!isCustom && !bgOption) {
    return NextResponse.json({ error: 'Unknown background' }, { status: 400 });
  }
  if (isCustom && !parsed.data.customGradient) {
    return NextResponse.json({ error: 'Custom background needs a gradient.' }, { status: 400 });
  }

  // Plan + credit gating.
  const account = await getAccount(session.user.id);
  if (bgOption?.tier === 'pro' && !account.plan.limits.allTemplates) {
    return NextResponse.json({ error: 'That background is a Pro feature.' }, { status: 403 });
  }
  const finiteCredits = account.plan.limits.capturesPerMonth >= 0;
  if (finiteCredits && account.credits <= 0) {
    return NextResponse.json(
      { error: 'You are out of captures for this month. Upgrade to keep going.' },
      { status: 402 },
    );
  }

  // Clamp privileged fields to the plan.
  const scale = Math.min(parsed.data.scale, account.plan.limits.maxScale) as OutputScale;
  const settings: CaptureSettings = {
    ...parsed.data,
    scale,
    watermark: account.plan.limits.watermark,
  };

  const projectId = randomUUID();
  const jobId = randomUUID();
  const userId = session.user.id;

  try {
    await db.transaction(async (tx) => {
      await tx.insert(project).values({
        id: projectId,
        userId,
        name: targetUrl.host,
        sourceUrl: settings.url,
      });
      await tx.insert(job).values({
        id: jobId,
        projectId,
        userId,
        status: 'queued',
        settings,
        creditSpent: finiteCredits,
      });
      if (finiteCredits) {
        await tx
          .update(user)
          .set({ credits: sql`GREATEST(${user.credits} - 1, 0)`, updatedAt: new Date() })
          .where(eq(user.id, userId));
      }
    });

    await enqueueCapture(jobId);
  } catch (err) {
    console.error('[capture] failed to enqueue:', err);
    // We never even reached the worker — fail the job AND refund the credit we
    // just spent, in one transaction, so the user isn't charged for nothing.
    await db
      .transaction(async (tx) => {
        await tx
          .update(job)
          .set({
            status: 'failed',
            error: 'Could not start the capture.',
            creditRefunded: finiteCredits,
            updatedAt: new Date(),
          })
          .where(eq(job.id, jobId));
        if (finiteCredits) {
          await tx
            .update(user)
            .set({ credits: sql`${user.credits} + 1`, updatedAt: new Date() })
            .where(eq(user.id, userId));
        }
      })
      .catch(() => undefined);
    return NextResponse.json({ error: 'Could not start the capture.' }, { status: 502 });
  }

  return NextResponse.json({ jobId, projectId }, { status: 202 });
}
