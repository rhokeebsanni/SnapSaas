import 'server-only';

import { desc, eq } from 'drizzle-orm';

import { db } from '@/db';
import { subscription, user } from '@/db/schema';
import { PLANS, type Plan, type PlanId } from '@/lib/plans';

export interface Account {
  plan: Plan;
  credits: number;
  /** True while a new user's 30-day Pro trial is still active. */
  onTrial: boolean;
  /** When the trial ends (null if none / already converted to paid). */
  trialEndsAt: Date | null;
  /** Whole days left in the trial (0 when not on trial). */
  trialDaysLeft: number;
}

/**
 * Fetch the product-level account state (plan + credits) for a user.
 *
 * Trial handling: a new user keeps `plan = 'free'` in the DB but is presented as
 * Pro while `now < trialEndsAt`. Once the trial lapses they fall back to their
 * stored plan (Free, unless they've since upgraded to a paid plan).
 */
export async function getAccount(userId: string): Promise<Account> {
  try {
    const rows = await db
      .select({ plan: user.plan, credits: user.credits, trialEndsAt: user.trialEndsAt })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    const row = rows[0];
    const storedPlanId = (row?.plan ?? 'free') as PlanId;
    const trialEndsAt = row?.trialEndsAt ?? null;

    // A trial only elevates a Free user — paid plans always win.
    const trialActive =
      storedPlanId === 'free' && trialEndsAt !== null && trialEndsAt.getTime() > Date.now();

    const effectivePlanId: PlanId = trialActive ? 'pro' : storedPlanId;
    const trialDaysLeft = trialActive
      ? Math.max(0, Math.ceil((trialEndsAt!.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
      : 0;

    return {
      plan: PLANS[effectivePlanId] ?? PLANS.free,
      credits: row?.credits ?? 0,
      onTrial: trialActive,
      trialEndsAt,
      trialDaysLeft,
    };
  } catch (err) {
    // Never crash a page over account lookup — fall back to the free plan.
    console.error('[account] getAccount failed:', err);
    return { plan: PLANS.free, credits: 0, onTrial: false, trialEndsAt: null, trialDaysLeft: 0 };
  }
}

/** The user's latest subscription row (for the billing portal + status). */
export async function getSubscription(userId: string) {
  const rows = await db
    .select()
    .from(subscription)
    .where(eq(subscription.userId, userId))
    .orderBy(desc(subscription.createdAt))
    .limit(1);
  return rows[0] ?? null;
}
