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

  const pillW = Math.min(w * 0.5, px(420));
  const pillX = (w - pillW) / 2;
  const cy = toolbar / 2;
  const icon = cfg.pillText;
  // Depth: a subtle top highlight + a 1px separator line under the toolbar.
  const sheen = cfg.glass
    ? `<rect width="${w}" height="${toolbar}" fill="url(#sheen)"/>`
    : `<rect width="${w}" height="${Math.round(toolbar * 0.5)}" fill="${cfg.dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.5)'}"/>`;
  const sep = `<rect x="0" y="${toolbar - px(1)}" width="${w}" height="${px(1)}" fill="${cfg.dark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.08)'}"/>`;
  // Traffic lights with a faint inner highlight for a glossy, real-button feel.
  const light = (cx: number, color: string) =>
    `<circle cx="${cx}" cy="${cy}" r="${px(6)}" fill="${color}"/><circle cx="${cx}" cy="${cy - px(1.4)}" r="${px(2.4)}" fill="rgba(255,255,255,0.35)"/>`;
  // Back / forward chevrons (muted) so it reads as a real browser.
  const navX = px(92);
  const chev = (cx: number, dir: 1 | -1) =>
    `<path d="M ${cx + dir * px(3)} ${cy - px(4)} L ${cx - dir * px(3)} ${cy} L ${cx + dir * px(3)} ${cy + px(4)}" fill="none" stroke="${icon}" stroke-width="${px(1.6)}" stroke-linecap="round" stroke-linejoin="round" opacity="0.55"/>`;
  // A small lock glyph before the URL.
  const lockX = pillX + px(16);
  const lock = `<g opacity="0.6"><rect x="${lockX - px(3.5)}" y="${cy - px(0.5)}" width="${px(7)}" height="${px(6)}" rx="${px(1.4)}" fill="${icon}"/><path d="M ${lockX - px(2)} ${cy - px(0.5)} v ${-px(2)} a ${px(2)} ${px(2)} 0 0 1 ${px(4)} 0 v ${px(2)}" fill="none" stroke="${icon}" stroke-width="${px(1.3)}"/></g>`;

  const toolbarSvg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${toolbar}">
      <defs><linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(255,255,255,0.35)"/><stop offset="100%" stop-color="rgba(255,255,255,0)"/></linearGradient></defs>
      <rect width="${w}" height="${toolbar}" fill="${cfg.chrome}"/>
      ${sheen}
      ${light(px(22), '#ff5f57')}${light(px(42), '#febc2e')}${light(px(62), '#28c840')}
      ${chev(navX, 1)}${chev(navX + px(20), -1)}
      <rect x="${pillX}" y="${toolbar * 0.24}" width="${pillW}" height="${toolbar * 0.52}" rx="${px(8)}" fill="${cfg.pill}" stroke="${cfg.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}" stroke-width="${px(1)}"/>
      ${lock}
      <text x="${pillX + px(28)}" y="${cy}" font-family="-apple-system, Segoe UI, Roboto, sans-serif" font-size="${px(13)}" fill="${cfg.pillText}" dominant-baseline="central">${escapeXml(url)}</text>
      ${sep}
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
