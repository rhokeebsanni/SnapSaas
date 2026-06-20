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

  // --- Expanded catalog (mirrors worker/src/config/templates.ts) ----------

  // Cosmic / space.
  {
    id: 'midnight',
    name: 'Midnight',
    tier: 'pro',
    css: 'radial-gradient(at 18% 20%, #312e81dd, transparent 55%), radial-gradient(at 85% 15%, #1e3a8add, transparent 50%), radial-gradient(at 55% 95%, #4c1d95dd, transparent 55%), #05060a',
  },
  {
    id: 'nebula',
    name: 'Nebula',
    tier: 'pro',
    css: 'radial-gradient(at 25% 30%, #db2777dd, transparent 50%), radial-gradient(at 80% 25%, #7c3aeddd, transparent 50%), radial-gradient(at 60% 90%, #2563ebdd, transparent 55%), #0a0118',
  },
  {
    id: 'cosmos',
    name: 'Cosmos',
    tier: 'free',
    css: 'linear-gradient(160deg,#0f0c29,#302b63 50%,#24243e)',
  },

  // Duotone gradients.
  { id: 'twilight', name: 'Twilight', tier: 'pro', css: 'linear-gradient(135deg,#6a11cb,#2575fc)' },
  { id: 'flamingo', name: 'Flamingo', tier: 'pro', css: 'linear-gradient(135deg,#f857a6,#ff5858)' },
  { id: 'lagoon', name: 'Lagoon', tier: 'pro', css: 'linear-gradient(160deg,#43cea2,#185a9d)' },
  { id: 'peach', name: 'Peach', tier: 'pro', css: 'linear-gradient(135deg,#ffecd2,#fcb69f)' },
  { id: 'mango', name: 'Mango', tier: 'pro', css: 'linear-gradient(135deg,#ff9a9e,#fad0c4)' },

  // Mesh blends.
  {
    id: 'iris',
    name: 'Iris',
    tier: 'pro',
    css: 'radial-gradient(at 20% 25%, #8b5cf6dd, transparent 50%), radial-gradient(at 85% 30%, #ec4899dd, transparent 45%), radial-gradient(at 50% 95%, #3b82f6dd, transparent 50%), #1e1b4b',
  },
  {
    id: 'mint',
    name: 'Mint',
    tier: 'pro',
    css: 'radial-gradient(at 20% 20%, #6ee7b7cc, transparent 45%), radial-gradient(at 85% 30%, #7dd3fccc, transparent 40%), radial-gradient(at 50% 95%, #a7f3d0cc, transparent 50%), #ecfdf5',
  },

  // Solids.
  { id: 'pure-white', name: 'Pure White', tier: 'pro', css: '#ffffff' },
  { id: 'slate', name: 'Slate', tier: 'pro', css: '#334155' },
  { id: 'ink', name: 'Ink', tier: 'pro', css: '#0b0b0f' },
  { id: 'sand', name: 'Sand', tier: 'pro', css: '#e7e2d9' },
  { id: 'brand-violet', name: 'Brand Violet', tier: 'pro', css: '#6d28d9' },

  // --- Pass A: more variety (mirrors worker) ---
  {
    id: 'mystic',
    name: 'Mystic',
    tier: 'pro',
    css: 'radial-gradient(at 20% 25%, #6d28d9dd, transparent 55%), radial-gradient(at 82% 30%, #0ea5e9dd, transparent 50%), radial-gradient(at 50% 92%, #db2777dd, transparent 55%), #0c0a1d',
  },
  {
    id: 'galaxy',
    name: 'Galaxy',
    tier: 'pro',
    css: 'radial-gradient(at 30% 20%, #4338cadd, transparent 50%), radial-gradient(at 75% 35%, #9333eadd, transparent 50%), radial-gradient(at 50% 85%, #0891b2dd, transparent 55%), #03040f',
  },
  {
    id: 'ember',
    name: 'Ember',
    tier: 'pro',
    css: 'radial-gradient(at 25% 30%, #ea580cdd, transparent 50%), radial-gradient(at 80% 25%, #dc2626dd, transparent 50%), radial-gradient(at 55% 90%, #f59e0bdd, transparent 55%), #1a0a04',
  },
  {
    id: 'emerald-haze',
    name: 'Emerald Haze',
    tier: 'pro',
    css: 'radial-gradient(at 22% 28%, #059669dd, transparent 50%), radial-gradient(at 82% 30%, #10b981dd, transparent 50%), radial-gradient(at 50% 90%, #0d9488dd, transparent 55%), #04140e',
  },
  { id: 'grape', name: 'Grape', tier: 'pro', css: 'linear-gradient(135deg,#41295a,#2f0743)' },
  { id: 'citrus', name: 'Citrus', tier: 'free', css: 'linear-gradient(120deg,#fdc830,#f37335)' },
  { id: 'sky', name: 'Sky', tier: 'free', css: 'linear-gradient(160deg,#2980b9,#6dd5fa)' },
  {
    id: 'rose-gold',
    name: 'Rose Gold',
    tier: 'pro',
    css: 'linear-gradient(135deg,#b76e79,#eacda3)',
  },
  { id: 'steel', name: 'Steel', tier: 'free', css: 'linear-gradient(145deg,#bdc3c7,#2c3e50)' },
  {
    id: 'mint-fresh',
    name: 'Mint Fresh',
    tier: 'pro',
    css: 'linear-gradient(135deg,#00b09b,#96c93d)',
  },
];

export function getBackground(id: string): BackgroundOption {
  return BACKGROUNDS.find((b) => b.id === id) ?? BACKGROUNDS[0];
}

/**
 * A representative accent color for a background, used to tint the preview glow.
 * Pulls the first hex color out of the background's `css` string, falling back
 * to the brand violet.
 */
export function glowColorForCss(id: string): string {
  const css = getBackground(id).css;
  const match = css.match(/#[0-9a-fA-F]{3,8}/);
  return match?.[0] ?? '#7c3aed';
}

export const PADDING_PRESETS = [
  { id: 'sm', label: 'S', value: 48 },
  { id: 'md', label: 'M', value: 80 },
  { id: 'lg', label: 'L', value: 120 },
  { id: 'xl', label: 'XL', value: 180 },
] as const;
