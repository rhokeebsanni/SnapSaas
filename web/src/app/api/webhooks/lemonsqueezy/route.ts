import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { subscription, user } from '@/db/schema';
import { planForVariant, verifyWebhookSignature } from '@/lib/lemonsqueezy';
import { PLANS, type PlanId } from '@/lib/plans';

const ACTIVE_STATUSES = new Set(['active', 'on_trial', 'past_due']);

export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get('x-signature');

  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: LemonWebhook;
  try {
    payload = JSON.parse(raw) as LemonWebhook;
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const data = payload.data;
  if (data?.type !== 'subscriptions') {
    // We only act on subscription events for now (orders/license keys ignored).
    return NextResponse.json({ ok: true });
  }

  const attrs = data.attributes;
  const lsId = String(data.id);
  const variantId = String(attrs.variant_id ?? '');
  const plan = planForVariant(variantId) ?? 'pro';
  const status = String(attrs.status ?? 'cancelled');
  const portal = attrs.urls?.customer_portal ?? null;
  const renewsAt = attrs.renews_at ? new Date(attrs.renews_at) : null;
  const endsAt = attrs.ends_at ? new Date(attrs.ends_at) : null;

  // Prefer the user_id we attached at checkout; fall back to an existing row.
  let userId = payload.meta?.custom_data?.user_id;
  if (!userId) {
    const existing = await db
      .select({ userId: subscription.userId })
      .from(subscription)
      .where(eq(subscription.lemonSqueezyId, lsId))
      .limit(1);
    userId = existing[0]?.userId;
  }
  if (!userId) {
    // Can't map to a user — acknowledge so Lemon Squeezy stops retrying.
    return NextResponse.json({ ok: true });
  }

  await db
    .insert(subscription)
    .values({
      id: randomUUID(),
      userId,
      lemonSqueezyId: lsId,
      customerId: attrs.customer_id ? String(attrs.customer_id) : null,
      status,
      plan,
      variantId,
      customerPortalUrl: portal,
      renewsAt,
      endsAt,
    })
    .onConflictDoUpdate({
      target: subscription.lemonSqueezyId,
      set: {
        status,
        plan,
        variantId,
        customerPortalUrl: portal,
        renewsAt,
        endsAt,
        updatedAt: new Date(),
      },
    });

  const effectivePlan: PlanId = ACTIVE_STATUSES.has(status) ? plan : 'free';
  const limit = PLANS[effectivePlan].limits.capturesPerMonth;
  const credits = limit < 0 ? 999_999 : limit;

  await db
    .update(user)
    .set({ plan: effectivePlan, credits, updatedAt: new Date() })
    .where(eq(user.id, userId));

  return NextResponse.json({ ok: true });
}

interface LemonWebhook {
  meta?: { event_name?: string; custom_data?: { user_id?: string } };
  data?: {
    type?: string;
    id?: string | number;
    attributes: {
      status?: string;
      variant_id?: string | number;
      customer_id?: string | number;
      renews_at?: string | null;
      ends_at?: string | null;
      urls?: { customer_portal?: string };
    };
  };
}
