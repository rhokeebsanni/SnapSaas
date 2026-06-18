import 'server-only';

import { desc, eq } from 'drizzle-orm';

import { db } from '@/db';
import { subscription, user } from '@/db/schema';
import { PLANS, type Plan, type PlanId } from '@/lib/plans';

export interface Account {
  plan: Plan;
  credits: number;
}

/** Fetch the product-level account state (plan + credits) for a user. */
export async function getAccount(userId: string): Promise<Account> {
  const rows = await db
    .select({ plan: user.plan, credits: user.credits })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  const row = rows[0];
  const planId = (row?.plan ?? 'free') as PlanId;
  return {
    plan: PLANS[planId] ?? PLANS.free,
    credits: row?.credits ?? 0,
  };
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
