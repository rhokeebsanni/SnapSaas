import sharp from 'sharp';

import { SHADOW_PRESETS, TILT_DEGREES, type CaptureSettings, type RenderOutput } from '../types';
import {
  getBackground,
  glowColorFor,
  renderBackgroundSvg,
  type BackgroundPreset,
} from '../config/templates';
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

/** Apply a fake-perspective tilt to the framed device via a horizontal shear. */
async function applyTilt(
  buffer: Buffer,
  width: number,
  height: number,
  degrees: number,
): Promise<{ buffer: Buffer; width: number; height: number }> {
  if (!degrees) return { buffer, width, height };
  // Shear horizontally proportional to the tilt; a positive angle leans right.
  const shear = Math.tan((degrees * Math.PI) / 180) * 0.5;
  const out = await sharp(buffer)
    .ensureAlpha()
    // affine matrix [a b c d]: b is the horizontal shear term.
    .affine([1, shear, 0, 1], { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const meta = await sharp(out).metadata();
  return { buffer: out, width: meta.width ?? width, height: meta.height ?? height };
}

/**
 * Compose the final asset: capture → frame → (tilt) → background + glow + shadow
 * + padding → (optional) watermark → encode to the requested format.
 */
export async function composeAsset(shot: Buffer, settings: CaptureSettings): Promise<RenderOutput> {
  const scale = settings.scale;
  const px = (v: number) => Math.round(v * scale);

  const framed = await frameScreenshot(
    shot,
    settings.frame,
    scale,
    hostFromUrl(settings.url),
    settings.windowStyle ?? 'light',
  );

  // Optional 3D tilt (Shots-style). Recompute device box from the result.
  const tiltDeg = TILT_DEGREES[settings.tilt ?? 'none'] ?? 0;
  const tilted = await applyTilt(framed.buffer, framed.width, framed.height, tiltDeg);
  const device = {
    buffer: tilted.buffer,
    width: tilted.width,
    height: tilted.height,
    cornerRadius: framed.cornerRadius,
  };

  const pad = px(settings.padding);
  const canvasW = device.width + pad * 2;
  const canvasH = device.height + pad * 2;

  // A user-built custom gradient overrides the preset catalog.
  const bg =
    settings.background === 'custom' && settings.customGradient
      ? ({
          id: 'custom',
          name: 'Custom',
          type: 'gradient' as const,
          angle: settings.customGradient.angle,
          stops: settings.customGradient.colors.map(
            (c, i, arr) => [arr.length === 1 ? 0 : i / (arr.length - 1), c] as [number, string],
          ),
        } satisfies BackgroundPreset)
      : getBackground(settings.background);

  // Background layer.
  const background = Buffer.from(renderBackgroundSvg(bg, canvasW, canvasH));

  const layers: sharp.OverlayOptions[] = [];

  // Optional colored glow: a large, blurred, bg-tinted halo behind the device.
  if (settings.glow) {
    const color = glowColorFor(bg);
    const glowPad = px(40);
    const halo = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${device.width + glowPad * 2}" height="${device.height + glowPad * 2}"><rect x="${glowPad}" y="${glowPad}" width="${device.width}" height="${device.height}" rx="${device.cornerRadius}" ry="${device.cornerRadius}" fill="${color}" fill-opacity="0.85"/></svg>`,
    );
    const glow = await sharp({
      create: { width: canvasW, height: canvasH, channels: 4, background: '#00000000' },
    })
      .composite([{ input: halo, top: pad - glowPad, left: pad - glowPad }])
      .blur(Math.max(12, px(48)))
      .png()
      .toBuffer();
    layers.push({ input: glow, top: 0, left: 0 });
  }

  // Drop shadow: a blurred dark silhouette of the device, offset downward.
  const [shOffset, shBlur, shOpacity] = SHADOW_PRESETS[settings.shadow ?? 'medium'];
  if (shOpacity > 0) {
    const shadowOffset = px(shOffset);
    const shadowSigma = Math.max(8, px(shBlur));
    const silhouette = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${device.width}" height="${device.height}"><rect width="${device.width}" height="${device.height}" rx="${device.cornerRadius}" ry="${device.cornerRadius}" fill="#000000" fill-opacity="${shOpacity}"/></svg>`,
    );
    const shadow = await sharp({
      create: { width: canvasW, height: canvasH, channels: 4, background: '#00000000' },
    })
      .composite([{ input: silhouette, top: pad + shadowOffset, left: pad }])
      .blur(shadowSigma)
      .png()
      .toBuffer();
    layers.push({ input: shadow, top: 0, left: 0 });
  }

  layers.push({ input: device.buffer, top: pad, left: pad });

  // Compose the framed device on its background at the derived canvas size.
  let composed = await sharp(background).composite(layers).png().toBuffer();
  let outW = canvasW;
  let outH = canvasH;

  // Optional exact output dimensions: fit the composition into the requested
  // canvas without distortion, letter-boxing with the background's base color.
  if (settings.outputWidth || settings.outputHeight) {
    outW = Math.round((settings.outputWidth ?? settings.outputHeight!) * scale);
    outH = Math.round((settings.outputHeight ?? settings.outputWidth!) * scale);
    composed = await sharp(composed)
      .resize(outW, outH, {
        fit: 'contain',
        background:
          bg.type === 'solid'
            ? bg.color
            : bg.type === 'mesh'
              ? bg.base
              : (bg.stops[0]?.[1] ?? '#000000'),
      })
      .png()
      .toBuffer();
  }

  // Watermark goes on after any resize so it stays crisp and corner-anchored.
  let pipeline = sharp(composed);
  if (settings.watermark) {
    pipeline = sharp(composed).composite([
      { input: watermarkSvg(outW, outH, scale), top: 0, left: 0 },
    ]);
  }

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

  return { format: settings.format, width: outW, height: outH, buffer };
}

function hostFromUrl(raw: string): string {
  try {
    return new URL(raw).host;
  } catch {
    return raw;
  }
}
