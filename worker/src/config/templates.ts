import type { FrameId } from '../types';

export interface FrameMeta {
  id: FrameId;
  name: string;
}

export const FRAMES: FrameMeta[] = [
  { id: 'browser', name: 'Browser' },
  { id: 'macbook', name: 'MacBook' },
  { id: 'iphone', name: 'iPhone' },
];

type GradientStop = [offset: number, color: string];

interface GradientBackground {
  id: string;
  name: string;
  type: 'gradient';
  angle: number;
  stops: GradientStop[];
}

interface SolidBackground {
  id: string;
  name: string;
  type: 'solid';
  color: string;
}

interface Blob {
  cx: number; // 0..1 of width
  cy: number; // 0..1 of height
  r: number; // 0..1 of max(width,height)
  color: string;
}

interface MeshBackground {
  id: string;
  name: string;
  type: 'mesh';
  base: string;
  blobs: Blob[];
}

export type BackgroundPreset = GradientBackground | SolidBackground | MeshBackground;

export const BACKGROUNDS: BackgroundPreset[] = [
  {
    id: 'violet-dream',
    name: 'Violet Dream',
    type: 'gradient',
    angle: 135,
    stops: [
      [0, '#7c3aed'],
      [1, '#06b6d4'],
    ],
  },
  {
    id: 'sunset',
    name: 'Sunset',
    type: 'gradient',
    angle: 135,
    stops: [
      [0, '#ff7e5f'],
      [1, '#feb47b'],
    ],
  },
  {
    id: 'ocean',
    name: 'Ocean',
    type: 'gradient',
    angle: 160,
    stops: [
      [0, '#2193b0'],
      [1, '#6dd5ed'],
    ],
  },
  {
    id: 'forest',
    name: 'Forest',
    type: 'gradient',
    angle: 135,
    stops: [
      [0, '#11998e'],
      [1, '#38ef7d'],
    ],
  },
  { id: 'graphite', name: 'Graphite', type: 'solid', color: '#1f2430' },
  { id: 'snow', name: 'Snow', type: 'solid', color: '#f4f4f5' },
  {
    id: 'aurora',
    name: 'Aurora',
    type: 'mesh',
    base: '#0f172a',
    blobs: [
      { cx: 0.2, cy: 0.25, r: 0.5, color: '#7c3aed' },
      { cx: 0.85, cy: 0.2, r: 0.45, color: '#0ea5e9' },
      { cx: 0.6, cy: 0.9, r: 0.55, color: '#14b8a6' },
    ],
  },
  {
    id: 'candy',
    name: 'Candy',
    type: 'mesh',
    base: '#fdf2f8',
    blobs: [
      { cx: 0.15, cy: 0.2, r: 0.45, color: '#f9a8d4' },
      { cx: 0.85, cy: 0.3, r: 0.4, color: '#c4b5fd' },
      { cx: 0.5, cy: 0.95, r: 0.5, color: '#a5b4fc' },
    ],
  },

  // --- Expanded catalog ---------------------------------------------------

  // Cosmic / space (on-brand with the app's starry theme).
  {
    id: 'midnight',
    name: 'Midnight',
    type: 'mesh',
    base: '#05060a',
    blobs: [
      { cx: 0.18, cy: 0.2, r: 0.5, color: '#312e81' },
      { cx: 0.85, cy: 0.15, r: 0.42, color: '#1e3a8a' },
      { cx: 0.55, cy: 0.95, r: 0.55, color: '#4c1d95' },
    ],
  },
  {
    id: 'nebula',
    name: 'Nebula',
    type: 'mesh',
    base: '#0a0118',
    blobs: [
      { cx: 0.25, cy: 0.3, r: 0.5, color: '#db2777' },
      { cx: 0.8, cy: 0.25, r: 0.45, color: '#7c3aed' },
      { cx: 0.6, cy: 0.9, r: 0.55, color: '#2563eb' },
    ],
  },
  {
    id: 'cosmos',
    name: 'Cosmos',
    type: 'gradient',
    angle: 160,
    stops: [
      [0, '#0f0c29'],
      [0.5, '#302b63'],
      [1, '#24243e'],
    ],
  },

  // Duotone gradients.
  {
    id: 'twilight',
    name: 'Twilight',
    type: 'gradient',
    angle: 135,
    stops: [
      [0, '#6a11cb'],
      [1, '#2575fc'],
    ],
  },
  {
    id: 'flamingo',
    name: 'Flamingo',
    type: 'gradient',
    angle: 135,
    stops: [
      [0, '#f857a6'],
      [1, '#ff5858'],
    ],
  },
  {
    id: 'lagoon',
    name: 'Lagoon',
    type: 'gradient',
    angle: 160,
    stops: [
      [0, '#43cea2'],
      [1, '#185a9d'],
    ],
  },
  {
    id: 'peach',
    name: 'Peach',
    type: 'gradient',
    angle: 135,
    stops: [
      [0, '#ffecd2'],
      [1, '#fcb69f'],
    ],
  },
  {
    id: 'mango',
    name: 'Mango',
    type: 'gradient',
    angle: 135,
    stops: [
      [0, '#ff9a9e'],
      [1, '#fad0c4'],
    ],
  },

  // Mesh blends.
  {
    id: 'iris',
    name: 'Iris',
    type: 'mesh',
    base: '#1e1b4b',
    blobs: [
      { cx: 0.2, cy: 0.25, r: 0.5, color: '#8b5cf6' },
      { cx: 0.85, cy: 0.3, r: 0.45, color: '#ec4899' },
      { cx: 0.5, cy: 0.95, r: 0.5, color: '#3b82f6' },
    ],
  },
  {
    id: 'mint',
    name: 'Mint',
    type: 'mesh',
    base: '#ecfdf5',
    blobs: [
      { cx: 0.2, cy: 0.2, r: 0.45, color: '#6ee7b7' },
      { cx: 0.85, cy: 0.3, r: 0.4, color: '#7dd3fc' },
      { cx: 0.5, cy: 0.95, r: 0.5, color: '#a7f3d0' },
    ],
  },

  // Solids (clean, neutral, brand).
  { id: 'pure-white', name: 'Pure White', type: 'solid', color: '#ffffff' },
  { id: 'slate', name: 'Slate', type: 'solid', color: '#334155' },
  { id: 'ink', name: 'Ink', type: 'solid', color: '#0b0b0f' },
  { id: 'sand', name: 'Sand', type: 'solid', color: '#e7e2d9' },
  { id: 'brand-violet', name: 'Brand Violet', type: 'solid', color: '#6d28d9' },

  // — Pass A: more variety —
  // Cosmic / mystic mesh backdrops.
  {
    id: 'mystic',
    name: 'Mystic',
    type: 'mesh',
    base: '#0c0a1d',
    blobs: [
      { cx: 0.2, cy: 0.25, r: 0.55, color: '#6d28d9' },
      { cx: 0.82, cy: 0.3, r: 0.45, color: '#0ea5e9' },
      { cx: 0.5, cy: 0.92, r: 0.5, color: '#db2777' },
    ],
  },
  {
    id: 'galaxy',
    name: 'Galaxy',
    type: 'mesh',
    base: '#03040f',
    blobs: [
      { cx: 0.3, cy: 0.2, r: 0.45, color: '#4338ca' },
      { cx: 0.75, cy: 0.35, r: 0.4, color: '#9333ea' },
      { cx: 0.5, cy: 0.85, r: 0.5, color: '#0891b2' },
    ],
  },
  {
    id: 'ember',
    name: 'Ember',
    type: 'mesh',
    base: '#1a0a04',
    blobs: [
      { cx: 0.25, cy: 0.3, r: 0.5, color: '#ea580c' },
      { cx: 0.8, cy: 0.25, r: 0.42, color: '#dc2626' },
      { cx: 0.55, cy: 0.9, r: 0.5, color: '#f59e0b' },
    ],
  },
  {
    id: 'emerald-haze',
    name: 'Emerald Haze',
    type: 'mesh',
    base: '#04140e',
    blobs: [
      { cx: 0.22, cy: 0.28, r: 0.5, color: '#059669' },
      { cx: 0.82, cy: 0.3, r: 0.42, color: '#10b981' },
      { cx: 0.5, cy: 0.9, r: 0.5, color: '#0d9488' },
    ],
  },
  // Vivid duotone gradients.
  {
    id: 'grape',
    name: 'Grape',
    type: 'gradient',
    angle: 135,
    stops: [
      [0, '#41295a'],
      [1, '#2f0743'],
    ],
  },
  {
    id: 'citrus',
    name: 'Citrus',
    type: 'gradient',
    angle: 120,
    stops: [
      [0, '#fdc830'],
      [1, '#f37335'],
    ],
  },
  {
    id: 'sky',
    name: 'Sky',
    type: 'gradient',
    angle: 160,
    stops: [
      [0, '#2980b9'],
      [1, '#6dd5fa'],
    ],
  },
  {
    id: 'rose-gold',
    name: 'Rose Gold',
    type: 'gradient',
    angle: 135,
    stops: [
      [0, '#b76e79'],
      [1, '#eacda3'],
    ],
  },
  {
    id: 'steel',
    name: 'Steel',
    type: 'gradient',
    angle: 145,
    stops: [
      [0, '#bdc3c7'],
      [1, '#2c3e50'],
    ],
  },
  {
    id: 'mint-fresh',
    name: 'Mint Fresh',
    type: 'gradient',
    angle: 135,
    stops: [
      [0, '#00b09b'],
      [1, '#96c93d'],
    ],
  },
];

export function getBackground(id: string): BackgroundPreset {
  return BACKGROUNDS.find((b) => b.id === id) ?? BACKGROUNDS[0]!;
}

/** A representative accent color for a background, used to tint the optional glow. */
export function glowColorFor(bg: BackgroundPreset): string {
  if (bg.type === 'solid') return bg.color;
  if (bg.type === 'gradient') return bg.stops[0]?.[1] ?? '#7c3aed';
  return bg.blobs[0]?.color ?? '#7c3aed';
}

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (c) =>
    c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '&' ? '&amp;' : c === "'" ? '&apos;' : '&quot;',
  );
}

/** Produce a full-size SVG (as a string) painting the given background. */
export function renderBackgroundSvg(bg: BackgroundPreset, width: number, height: number): string {
  if (bg.type === 'solid') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="${escapeXml(bg.color)}"/></svg>`;
  }

  if (bg.type === 'gradient') {
    // Convert angle (deg) to gradient vector endpoints.
    const rad = (bg.angle * Math.PI) / 180;
    const x1 = 50 - Math.cos(rad) * 50;
    const y1 = 50 - Math.sin(rad) * 50;
    const x2 = 50 + Math.cos(rad) * 50;
    const y2 = 50 + Math.sin(rad) * 50;
    const stops = bg.stops
      .map(
        ([offset, color]) => `<stop offset="${offset * 100}%" stop-color="${escapeXml(color)}"/>`,
      )
      .join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs><linearGradient id="g" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">${stops}</linearGradient></defs><rect width="${width}" height="${height}" fill="url(#g)"/></svg>`;
  }

  // Mesh: base color + soft radial blobs.
  const maxDim = Math.max(width, height);
  const defs = bg.blobs
    .map(
      (b, i) =>
        `<radialGradient id="b${i}" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="${escapeXml(
          b.color,
        )}" stop-opacity="0.9"/><stop offset="100%" stop-color="${escapeXml(b.color)}" stop-opacity="0"/></radialGradient>`,
    )
    .join('');
  const circles = bg.blobs
    .map(
      (b, i) =>
        `<circle cx="${b.cx * width}" cy="${b.cy * height}" r="${b.r * maxDim}" fill="url(#b${i})"/>`,
    )
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs>${defs}</defs><rect width="${width}" height="${height}" fill="${escapeXml(bg.base)}"/>${circles}</svg>`;
}
