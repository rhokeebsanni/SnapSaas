/**
 * Regional price presentation. We support two starter regions: the US (USD) and
 * Nigeria (NGN). Lemon Squeezy (our Merchant of Record) settles in the store's
 * currency — USD — so NGN figures are an approximate, display-only convenience
 * and the actual charge is always in USD. The UI says so explicitly.
 */

export type Region = 'US' | 'NG';

export interface RegionMeta {
  id: Region;
  label: string;
  flag: string;
  currency: 'USD' | 'NGN';
  symbol: string;
  /**
   * Multiplier applied to the base USD price to estimate the local figure
   * (kept for any region without explicit price points).
   */
  rate: number;
  /** Whether the charge actually happens in this currency. */
  charged: boolean;
  /**
   * Explicit local price points, keyed by the base USD price. Used for
   * purchasing-power-adjusted regional pricing (e.g. Nigeria) so we don't
   * just FX-convert into an unaffordable number.
   */
  priceMap?: Record<number, number>;
}

export const REGIONS: Record<Region, RegionMeta> = {
  US: {
    id: 'US',
    label: 'United States',
    flag: '🇺🇸',
    currency: 'USD',
    symbol: '$',
    rate: 1,
    charged: true,
  },
  NG: {
    id: 'NG',
    label: 'Nigeria',
    flag: '🇳🇬',
    // Display-only estimate; the card is still charged in USD by Lemon Squeezy.
    currency: 'NGN',
    symbol: '₦',
    rate: 1600,
    charged: false,
    // Purchasing-power-adjusted naira prices (≈ a local-friendly tier, not a
    // raw FX conversion) so it's affordable for Nigerian devs. Keyed by the
    // plan's base USD price.
    priceMap: {
      0: 0,
      12: 3000, // Pro monthly
      108: 30000, // Pro yearly (~10 months, matching the 20% annual discount)
      29: 7500, // Team monthly
      290: 75000, // Team yearly
    },
  },
};

export const REGION_LIST: RegionMeta[] = [REGIONS.US, REGIONS.NG];

export const DEFAULT_REGION: Region = 'US';

/** Best-effort region guess from the browser's locale/timezone. */
export function detectRegion(): Region {
  if (typeof Intl === 'undefined') return DEFAULT_REGION;
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
    if (tz === 'Africa/Lagos') return 'NG';
    const locale = (navigator?.language ?? '').toLowerCase();
    if (locale.endsWith('-ng')) return 'NG';
  } catch {
    /* fall through */
  }
  return DEFAULT_REGION;
}

/** Format a base USD price into the chosen region's currency. */
export function formatPrice(usd: number, region: Region): string {
  const meta = REGIONS[region];
  // Prefer an explicit, purchasing-power-adjusted price point when we have one.
  const mapped = meta.priceMap?.[usd];
  const value = mapped ?? Math.round(usd * meta.rate);
  if (meta.currency === 'NGN') {
    return `${meta.symbol}${value.toLocaleString('en-NG')}`;
  }
  return `${meta.symbol}${value}`;
}
