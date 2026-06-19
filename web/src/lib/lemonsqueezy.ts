import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';

import type { PlanId } from '@/lib/plans';

const LS_API = 'https://api.lemonsqueezy.com/v1';

export type BillingCycle = 'monthly' | 'yearly';

export function isLemonConfigured(): boolean {
  return Boolean(process.env.LEMONSQUEEZY_API_KEY && process.env.LEMONSQUEEZY_STORE_ID);
}

function variantEnv(): Record<string, string | undefined> {
  return {
    'pro:monthly': process.env.LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID,
    'pro:yearly': process.env.LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID,
    'team:monthly': process.env.LEMONSQUEEZY_TEAM_MONTHLY_VARIANT_ID,
    'team:yearly': process.env.LEMONSQUEEZY_TEAM_YEARLY_VARIANT_ID,
  };
}

export function variantFor(plan: PlanId, cycle: BillingCycle): string | null {
  return variantEnv()[`${plan}:${cycle}`] ?? null;
}

/** Reverse-map a Lemon Squeezy variant id back to our internal plan id. */
export function planForVariant(variantId: string): PlanId | null {
  for (const [key, id] of Object.entries(variantEnv())) {
    if (id && id === variantId) return key.split(':')[0] as PlanId;
  }
  return null;
}

export async function createCheckoutUrl(params: {
  variantId: string;
  email: string;
  userId: string;
  redirectUrl: string;
}): Promise<string> {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY!;
  const storeId = process.env.LEMONSQUEEZY_STORE_ID!;

  const body = {
    data: {
      type: 'checkouts',
      attributes: {
        checkout_data: {
          email: params.email,
          custom: { user_id: params.userId },
        },
        product_options: { redirect_url: params.redirectUrl },
      },
      relationships: {
        store: { data: { type: 'stores', id: String(storeId) } },
        variant: { data: { type: 'variants', id: String(params.variantId) } },
      },
    },
  };

  const res = await fetch(`${LS_API}/checkouts`, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Lemon Squeezy checkout failed (${res.status})`);
  }
  const json = (await res.json()) as { data: { attributes: { url: string } } };
  return json.data.attributes.url;
}

/** Verify the `X-Signature` HMAC sent with every Lemon Squeezy webhook. */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const digest = createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(digest);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
