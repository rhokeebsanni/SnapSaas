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
  /** Multiplier applied to the base USD price to estimate the local figure. */
  rate: number;
  /** Whether the charge actually happens in this currency. */
  charged: boolean;
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
  const value = Math.round(usd * meta.rate);
  if (meta.currency === 'NGN') {
    // Whole naira, grouped: ₦19,200
    return `${meta.symbol}${value.toLocaleString('en-NG')}`;
  }
  return `${meta.symbol}${value}`;
}
