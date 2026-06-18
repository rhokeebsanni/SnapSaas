import 'server-only';

import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { user } from '@/db/schema';
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
