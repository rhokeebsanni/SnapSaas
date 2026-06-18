import type { FrameId } from '@/lib/capture';

export interface FrameOption {
  id: FrameId;
  name: string;
  description: string;
}

export const FRAMES: FrameOption[] = [
  { id: 'browser', name: 'Browser', description: 'Classic browser window' },
  { id: 'macbook', name: 'MacBook', description: 'Laptop bezel' },
  { id: 'iphone', name: 'iPhone', description: 'Phone with notch' },
];

export type Tier = 'free' | 'pro';

export interface BackgroundOption {
  id: string;
  name: string;
  tier: Tier;
  /** CSS background used for swatches + the live style preview. */
  css: string;
}

/**
 * Mirrors the worker's background presets (same ids). `css` is only an
 * approximation for the in-app preview; the final render is produced by Sharp.
 */
export const BACKGROUNDS: BackgroundOption[] = [
  {
    id: 'violet-dream',
    name: 'Violet Dream',
    tier: 'free',
    css: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
  },
  { id: 'sunset', name: 'Sunset', tier: 'free', css: 'linear-gradient(135deg,#ff7e5f,#feb47b)' },
  { id: 'graphite', name: 'Graphite', tier: 'free', css: '#1f2430' },
  { id: 'snow', name: 'Snow', tier: 'free', css: '#f4f4f5' },
  { id: 'ocean', name: 'Ocean', tier: 'pro', css: 'linear-gradient(160deg,#2193b0,#6dd5ed)' },
  { id: 'forest', name: 'Forest', tier: 'pro', css: 'linear-gradient(135deg,#11998e,#38ef7d)' },
  {
    id: 'aurora',
    name: 'Aurora',
    tier: 'pro',
    css: 'radial-gradient(at 20% 25%, #7c3aedcc, transparent 55%), radial-gradient(at 85% 20%, #0ea5e9cc, transparent 50%), radial-gradient(at 60% 95%, #14b8a6cc, transparent 55%), #0f172a',
  },
  {
    id: 'candy',
    name: 'Candy',
    tier: 'pro',
    css: 'radial-gradient(at 15% 20%, #f9a8d4cc, transparent 50%), radial-gradient(at 85% 30%, #c4b5fdcc, transparent 45%), radial-gradient(at 50% 95%, #a5b4fccc, transparent 55%), #fdf2f8',
  },
];

export function getBackground(id: string): BackgroundOption {
  return BACKGROUNDS.find((b) => b.id === id) ?? BACKGROUNDS[0];
}

export const PADDING_PRESETS = [
  { id: 'sm', label: 'S', value: 48 },
  { id: 'md', label: 'M', value: 80 },
  { id: 'lg', label: 'L', value: 120 },
  { id: 'xl', label: 'XL', value: 180 },
] as const;
