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
];

export function getBackground(id: string): BackgroundPreset {
  return BACKGROUNDS.find((b) => b.id === id) ?? BACKGROUNDS[0]!;
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
