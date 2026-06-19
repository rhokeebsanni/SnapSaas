/**
 * Single source of truth for plans. The marketing pricing section renders from
 * this, and Phase 6 plan-gating enforces the same `limits` server-side.
 */

export type PlanId = 'free' | 'pro' | 'team';

export interface PlanLimits {
  /** Captures allowed per billing month. `-1` means effectively unlimited. */
  capturesPerMonth: number;
  /** Highest export scale factor available. */
  maxScale: 1 | 2 | 3;
  /** Whether outputs carry the "Made with SnapSaas" watermark. */
  watermark: boolean;
  /** Access to the full frame + background catalog (vs. the starter set). */
  allTemplates: boolean;
  /** Batch (multi-URL) captures. */
  batch: boolean;
  /** Programmatic API access. */
  apiAccess: boolean;
  /** Number of seats included. */
  seats: number;
}

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  limits: PlanLimits;
  cta: string;
  highlighted?: boolean;
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    tagline: 'For trying it out and the occasional screenshot.',
    priceMonthly: 0,
    priceYearly: 0,
    features: [
      '10 captures / month',
      '3 device frames, 4 backgrounds',
      '1× resolution export',
      'PNG / JPG / WebP',
      '“Made with SnapSaas” watermark',
    ],
    limits: {
      capturesPerMonth: 10,
      maxScale: 1,
      watermark: true,
      allTemplates: false,
      batch: false,
      apiAccess: false,
      seats: 1,
    },
    cta: 'Start for free',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    tagline: 'For founders & indie hackers shipping launches.',
    priceMonthly: 12,
    priceYearly: 108,
    features: [
      '500 captures / month',
      'All frames + all backgrounds',
      'Up to 3× retina export',
      'No watermark',
      'Batch mode & priority queue',
    ],
    limits: {
      capturesPerMonth: 500,
      maxScale: 3,
      watermark: false,
      allTemplates: true,
      batch: true,
      apiAccess: false,
      seats: 1,
    },
    cta: 'Go Pro',
    highlighted: true,
  },
  team: {
    id: 'team',
    name: 'Team',
    tagline: 'For teams and developers automating mockups.',
    priceMonthly: 29,
    priceYearly: 290,
    features: [
      'Everything in Pro',
      '3 seats included',
      'Shared brand presets',
      'Programmatic API access',
      'Priority support',
    ],
    limits: {
      capturesPerMonth: -1,
      maxScale: 3,
      watermark: false,
      allTemplates: true,
      batch: true,
      apiAccess: true,
      seats: 3,
    },
    cta: 'Start Team trial',
  },
};

export const PLAN_LIST: Plan[] = [PLANS.free, PLANS.pro, PLANS.team];

/** Length of the automatic Pro trial granted to every new signup. */
export const TRIAL_DAYS = 30;

/** Annual discount vs. paying monthly, as a whole-number percentage. */
export function yearlyDiscountPercent(plan: Plan): number {
  if (plan.priceMonthly === 0) return 0;
  const fullYear = plan.priceMonthly * 12;
  return Math.round(((fullYear - plan.priceYearly) / fullYear) * 100);
}
