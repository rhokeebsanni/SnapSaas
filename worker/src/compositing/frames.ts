import sharp from 'sharp';

import type { FrameId, WindowStyle } from '../types';

export interface FramedDevice {
  buffer: Buffer;
  width: number;
  height: number;
  /** Approximate outer corner radius, used to shape the drop shadow. */
  cornerRadius: number;
}

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (c) =>
    c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '&' ? '&amp;' : c === "'" ? '&apos;' : '&quot;',
  );
}

/** Clip an image to a rounded rectangle (transparent outside the radius). */
async function roundCorners(
  input: Buffer,
  width: number,
  height: number,
  radius: number,
): Promise<Buffer> {
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${radius}" ry="${radius}" fill="#fff"/></svg>`,
  );
  return sharp(input)
    .ensureAlpha()
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();
}

async function dimensions(buf: Buffer): Promise<{ width: number; height: number }> {
  const meta = await sharp(buf).metadata();
  return { width: meta.width ?? 0, height: meta.height ?? 0 };
}

/** Visual config per browser window style. */
function windowStyleConfig(style: WindowStyle) {
  const dark = style === 'dark' || style === 'glass-dark' || style === 'inset-dark';
  const glass = style === 'glass' || style === 'glass-dark';
  const inset = style === 'inset' || style === 'inset-dark';
  return {
    dark,
    glass,
    inset,
    // Toolbar / card fill. Glass fills are translucent so the background shows
    // through; opaque otherwise.
    chrome: glass
      ? dark
        ? 'rgba(20,21,24,0.55)'
        : 'rgba(255,255,255,0.45)'
      : dark
        ? '#2b2d31'
        : '#edeef1',
    pill: glass
      ? dark
        ? 'rgba(255,255,255,0.10)'
        : 'rgba(255,255,255,0.55)'
      : dark
        ? '#1c1d20'
        : '#ffffff',
    pillText: dark ? '#9ca3af' : '#6b7280',
    // Body fill behind the screenshot. Glass = transparent (bg bleeds through).
    baseBg: glass ? '#00000000' : dark ? '#1c1d20' : '#ffffff',
    // Inset matte color (the band around the screenshot for inset styles).
    matte: dark ? '#16171b' : '#ffffff',
  };
}

async function browserFrame(
  shot: Buffer,
  scale: number,
  url: string,
  windowStyle: WindowStyle,
): Promise<FramedDevice> {
  const px = (v: number) => Math.round(v * scale);
  const { width: w, height: h } = await dimensions(shot);
  const radius = px(12);
  const cfg = windowStyleConfig(windowStyle);

  // Inset styles: no browser toolbar — the screenshot is matted inside a solid
  // colored card with rounded inner corners (a framed-photo look).
  if (cfg.inset) {
    const margin = px(14);
    const innerRadius = px(8);
    const cardW = w + margin * 2;
    const cardH = h + margin * 2;
    const roundedShot = await roundCorners(shot, w, h, innerRadius);
    const card = await sharp({
      create: { width: cardW, height: cardH, channels: 4, background: cfg.matte },
    })
      .composite([{ input: roundedShot, top: margin, left: margin }])
      .png()
      .toBuffer();
    const buffer = await roundCorners(card, cardW, cardH, radius);
    return { buffer, width: cardW, height: cardH, cornerRadius: radius };
  }

  const toolbar = px(38);
  const deviceH = toolbar + h;

  const dot = (cx: number, color: string) =>
    `<circle cx="${cx}" cy="${toolbar / 2}" r="${px(6)}" fill="${color}"/>`;
  const pillW = Math.min(w * 0.5, px(420));
  const pillX = (w - pillW) / 2;
  // A faint top highlight sells the glass look.
  const glassEdge = cfg.glass
    ? `<rect width="${w}" height="${toolbar}" fill="url(#sheen)"/><defs><linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(255,255,255,0.35)"/><stop offset="100%" stop-color="rgba(255,255,255,0)"/></linearGradient></defs>`
    : '';
  const toolbarSvg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${toolbar}">
      <rect width="${w}" height="${toolbar}" fill="${cfg.chrome}"/>
      ${glassEdge}
      ${dot(px(22), '#ff5f57')}${dot(px(42), '#febc2e')}${dot(px(62), '#28c840')}
      <rect x="${pillX}" y="${toolbar * 0.26}" width="${pillW}" height="${toolbar * 0.48}" rx="${px(7)}" fill="${cfg.pill}"/>
      <text x="${w / 2}" y="${toolbar / 2}" font-family="-apple-system, Segoe UI, Roboto, sans-serif" font-size="${px(13)}" fill="${cfg.pillText}" text-anchor="middle" dominant-baseline="central">${escapeXml(url)}</text>
    </svg>`,
  );

  const composed = await sharp({
    create: { width: w, height: deviceH, channels: 4, background: cfg.baseBg },
  })
    .composite([
      { input: toolbarSvg, top: 0, left: 0 },
      { input: shot, top: toolbar, left: 0 },
    ])
    .png()
    .toBuffer();

  const buffer = await roundCorners(composed, w, deviceH, radius);
  return { buffer, width: w, height: deviceH, cornerRadius: radius };
}

async function macbookFrame(shot: Buffer, scale: number): Promise<FramedDevice> {
  const px = (v: number) => Math.round(v * scale);
  const { width: w, height: h } = await dimensions(shot);
  const pad = px(10);
  const bezelRadius = px(18);
  const bezelW = w + pad * 2;
  const bezelH = h + pad * 2;

  const bezel = await sharp({
    create: { width: bezelW, height: bezelH, channels: 4, background: '#0a0a0c' },
  })
    .composite([{ input: shot, top: pad, left: pad }])
    .png()
    .toBuffer();
  const roundedBezel = await roundCorners(bezel, bezelW, bezelH, bezelRadius);

  const baseH = px(16);
  const baseW = Math.round(bezelW * 1.12);
  const notchW = px(90);
  const baseSvg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${baseW}" height="${baseH}">
      <defs><linearGradient id="b" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#d4d6dc"/><stop offset="100%" stop-color="#9a9ca6"/>
      </linearGradient></defs>
      <rect x="0" y="0" width="${baseW}" height="${baseH}" rx="${px(5)}" fill="url(#b)"/>
      <rect x="${(baseW - notchW) / 2}" y="0" width="${notchW}" height="${px(6)}" rx="${px(3)}" fill="#7c7e88"/>
    </svg>`,
  );

  const totalW = baseW;
  const totalH = bezelH + baseH;
  const buffer = await sharp({
    create: { width: totalW, height: totalH, channels: 4, background: '#00000000' },
  })
    .composite([
      { input: roundedBezel, top: 0, left: Math.round((totalW - bezelW) / 2) },
      { input: baseSvg, top: bezelH, left: 0 },
    ])
    .png()
    .toBuffer();

  return { buffer, width: totalW, height: totalH, cornerRadius: bezelRadius };
}

async function iphoneFrame(shot: Buffer, scale: number): Promise<FramedDevice> {
  const px = (v: number) => Math.round(v * scale);
  const { width: w, height: h } = await dimensions(shot);
  const pad = px(9);
  const bezelRadius = px(46);
  const screenRadius = px(38);
  const bezelW = w + pad * 2;
  const bezelH = h + pad * 2;

  const roundedShot = await roundCorners(shot, w, h, screenRadius);
  const notchW = px(120);
  const notchH = px(24);
  const notch = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${notchW}" height="${notchH}"><rect width="${notchW}" height="${notchH}" rx="${notchH / 2}" fill="#0a0a0c"/></svg>`,
  );

  const bezel = await sharp({
    create: { width: bezelW, height: bezelH, channels: 4, background: '#0a0a0c' },
  })
    .composite([
      { input: roundedShot, top: pad, left: pad },
      { input: notch, top: pad + px(6), left: Math.round((bezelW - notchW) / 2) },
    ])
    .png()
    .toBuffer();

  const buffer = await roundCorners(bezel, bezelW, bezelH, bezelRadius);
  return { buffer, width: bezelW, height: bezelH, cornerRadius: bezelRadius };
}

/** Hide-mockup: the bare screenshot with softly rounded corners, no chrome. */
export async function bareScreenshot(shot: Buffer, scale: number): Promise<FramedDevice> {
  const { width: w, height: h } = await dimensions(shot);
  const radius = Math.round(10 * scale);
  const buffer = await roundCorners(shot, w, h, radius);
  return { buffer, width: w, height: h, cornerRadius: radius };
}

export function frameScreenshot(
  shot: Buffer,
  frame: FrameId,
  scale: number,
  url: string,
  windowStyle: WindowStyle = 'light',
): Promise<FramedDevice> {
  switch (frame) {
    case 'macbook':
      return macbookFrame(shot, scale);
    case 'iphone':
      return iphoneFrame(shot, scale);
    case 'browser':
    default:
      return browserFrame(shot, scale, url, windowStyle);
  }
}
