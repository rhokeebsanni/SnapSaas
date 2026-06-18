import sharp from 'sharp';

import type { CaptureSettings, RenderOutput } from '../types';
import { getBackground, renderBackgroundSvg } from '../config/templates';
import { frameScreenshot } from './frames';

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (c) =>
    c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '&' ? '&amp;' : c === "'" ? '&apos;' : '&quot;',
  );
}

function watermarkSvg(width: number, height: number, scale: number): Buffer {
  const px = (v: number) => Math.round(v * scale);
  const text = 'Made with SnapSaas';
  const padX = px(14);
  const padY = px(10);
  const fontSize = px(13);
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <text x="${width - padX}" y="${height - padY}" text-anchor="end"
        font-family="-apple-system, Segoe UI, Roboto, sans-serif" font-size="${fontSize}"
        font-weight="600" fill="#ffffff" fill-opacity="0.85"
        style="paint-order:stroke" stroke="#000000" stroke-opacity="0.25" stroke-width="${px(0.6)}">
        ${escapeXml(text)}
      </text>
    </svg>`,
  );
}

/**
 * Compose the final asset: capture → frame → background + shadow + padding →
 * (optional) watermark → encode to the requested format.
 */
export async function composeAsset(shot: Buffer, settings: CaptureSettings): Promise<RenderOutput> {
  const scale = settings.scale;
  const px = (v: number) => Math.round(v * scale);

  const device = await frameScreenshot(shot, settings.frame, scale, hostFromUrl(settings.url));
  const pad = px(settings.padding);

  const canvasW = device.width + pad * 2;
  const canvasH = device.height + pad * 2;

  // Background layer.
  const background = Buffer.from(
    renderBackgroundSvg(getBackground(settings.background), canvasW, canvasH),
  );

  // Drop shadow: a blurred dark silhouette of the device, offset downward.
  const shadowOffset = px(22);
  const shadowSigma = Math.max(8, px(26));
  const silhouette = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${device.width}" height="${device.height}"><rect width="${device.width}" height="${device.height}" rx="${device.cornerRadius}" ry="${device.cornerRadius}" fill="#000000" fill-opacity="0.38"/></svg>`,
  );
  const shadow = await sharp({
    create: { width: canvasW, height: canvasH, channels: 4, background: '#00000000' },
  })
    .composite([{ input: silhouette, top: pad + shadowOffset, left: pad }])
    .blur(shadowSigma)
    .png()
    .toBuffer();

  const layers: sharp.OverlayOptions[] = [
    { input: shadow, top: 0, left: 0 },
    { input: device.buffer, top: pad, left: pad },
  ];

  if (settings.watermark) {
    layers.push({ input: watermarkSvg(canvasW, canvasH, scale), top: 0, left: 0 });
  }

  const pipeline = sharp(background).composite(layers);

  let buffer: Buffer;
  switch (settings.format) {
    case 'jpeg':
      buffer = await pipeline
        .flatten({ background: '#ffffff' })
        .jpeg({ quality: 90, mozjpeg: true })
        .toBuffer();
      break;
    case 'webp':
      buffer = await pipeline.webp({ quality: 90 }).toBuffer();
      break;
    case 'png':
    default:
      buffer = await pipeline.png({ compressionLevel: 9 }).toBuffer();
      break;
  }

  return { format: settings.format, width: canvasW, height: canvasH, buffer };
}

function hostFromUrl(raw: string): string {
  try {
    return new URL(raw).host;
  } catch {
    return raw;
  }
}
