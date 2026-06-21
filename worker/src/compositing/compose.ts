import sharp from 'sharp';

import { SHADOW_PRESETS, type CaptureSettings, type RenderOutput } from '../types';
import {
  getBackground,
  glowColorFor,
  renderBackgroundSvg,
  type BackgroundPreset,
} from '../config/templates';
import { frameScreenshot, bareScreenshot } from './frames';

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (c) =>
    c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '&' ? '&amp;' : c === "'" ? '&apos;' : '&quot;',
  );
}

/**
 * Bake premium texture into a background: gaussian film grain (overlay blend,
 * kills banding + adds richness) and an edge vignette. Both are tasteful and
 * subtle by default; applied to the background only so the screenshot stays
 * crisp. Returns a rasterized PNG buffer.
 */
async function enhanceBackground(
  bgSvg: Buffer,
  width: number,
  height: number,
  noise: number,
  vignette: number,
): Promise<Buffer> {
  if (noise <= 0 && vignette <= 0) return bgSvg;
  const overlays: sharp.OverlayOptions[] = [];

  if (noise > 0) {
    // sigma 0..26 → subtle to strong grain. Default (8) lands around sigma 7.
    const sigma = Math.max(1, (noise / 100) * 26);
    const grain = await sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 128, g: 128, b: 128 },
        noise: { type: 'gaussian', mean: 128, sigma },
      },
    })
      .png()
      .toBuffer();
    overlays.push({ input: grain, blend: 'overlay' });
  }

  if (vignette > 0) {
    const strength = (vignette / 100) * 0.7;
    const vig = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs><radialGradient id="v" cx="50%" cy="50%" r="72%"><stop offset="50%" stop-color="#000000" stop-opacity="0"/><stop offset="100%" stop-color="#000000" stop-opacity="${strength.toFixed(3)}"/></radialGradient></defs><rect width="${width}" height="${height}" fill="url(#v)"/></svg>`,
    );
    overlays.push({ input: vig });
  }

  return sharp(bgSvg).composite(overlays).png().toBuffer();
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
 * Apply a 3D-ish rotation to the framed device. Z is a true rotation; X and Y
 * are approximated with shear (Sharp's affine is 2D, so true perspective
 * foreshortening isn't possible — the live preview uses real CSS 3D, this is a
 * faithful-enough export). Returns the re-sized buffer.
 */
async function apply3D(
  buffer: Buffer,
  width: number,
  height: number,
  rotateX: number,
  rotateY: number,
  rotateZ: number,
): Promise<{ buffer: Buffer; width: number; height: number }> {
  if (!rotateX && !rotateY && !rotateZ) return { buffer, width, height };
  const rad = (d: number) => (d * Math.PI) / 180;
  const cz = Math.cos(rad(rotateZ));
  const sz = Math.sin(rad(rotateZ));
  const ky = Math.tan(rad(rotateY)) * 0.5; // horizontal shear from Y turn
  const kx = Math.tan(rad(rotateX)) * 0.5; // vertical shear from X tip
  // M = Rz · SYshear · SXshear  →  affine [a, b, c, d]
  const a = cz * (1 + ky * kx) - sz * kx;
  const b = cz * ky - sz;
  const c = sz * (1 + ky * kx) + cz * kx;
  const d = sz * ky + cz;
  const out = await sharp(buffer)
    .ensureAlpha()
    .affine([a, b, c, d], { background: { r: 0, g: 0, b: 0, alpha: 0 } })
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

  const framed = settings.hideMockup
    ? await bareScreenshot(shot, scale)
    : await frameScreenshot(
        shot,
        settings.frame,
        scale,
        hostFromUrl(settings.url),
        settings.windowStyle ?? 'light',
      );

  // Optional 3D rotation (Shots-style). Recompute device box from the result.
  const rotated = await apply3D(
    framed.buffer,
    framed.width,
    framed.height,
    settings.rotateX ?? 0,
    settings.rotateY ?? 0,
    settings.rotateZ ?? 0,
  );
  const device = {
    buffer: rotated.buffer,
    width: rotated.width,
    height: rotated.height,
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

  // Background layer — with optional film grain + vignette baked in (applied to
  // the background only, so the screenshot itself stays pristine and sharp).
  const background = await enhanceBackground(
    Buffer.from(renderBackgroundSvg(bg, canvasW, canvasH)),
    canvasW,
    canvasH,
    settings.noise ?? 0,
    settings.vignette ?? 0,
  );

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

  // Drop shadow: a blurred dark silhouette of the device, offset in the chosen
  // direction. Opacity can override the preset; direction is the fall angle
  // (0=up, 90=right, 180=down).
  const [shOffset, shBlur, shPresetOpacity] = SHADOW_PRESETS[settings.shadow ?? 'medium'];
  const shOpacity =
    settings.shadowOpacity !== undefined ? settings.shadowOpacity / 100 : shPresetOpacity;
  if (shOpacity > 0) {
    const dist = px(shOffset);
    const rad = ((settings.shadowDirection ?? 180) * Math.PI) / 180;
    const dx = Math.round(Math.sin(rad) * dist);
    const dy = Math.round(-Math.cos(rad) * dist);
    const shadowSigma = Math.max(8, px(shBlur));
    const silhouette = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${device.width}" height="${device.height}"><rect width="${device.width}" height="${device.height}" rx="${device.cornerRadius}" ry="${device.cornerRadius}" fill="#000000" fill-opacity="${shOpacity}"/></svg>`,
    );
    const shadow = await sharp({
      create: { width: canvasW, height: canvasH, channels: 4, background: '#00000000' },
    })
      .composite([{ input: silhouette, top: Math.max(0, pad + dy), left: Math.max(0, pad + dx) }])
      .blur(shadowSigma)
      .png()
      .toBuffer();
    layers.push({ input: shadow, top: 0, left: 0 });
  }

  layers.push({ input: device.buffer, top: pad, left: pad });

  // Optional border: a stroked rounded rect hugging the device edge.
  if (settings.border && settings.border !== 'none') {
    const bw = Math.max(1, px(settings.borderWidth ?? 4));
    const stroke = settings.border === 'dark' ? '#0b0b0f' : '#ffffff';
    // Inset by half the stroke so the border sits on the device edge, not outside.
    const inset = bw / 2;
    const borderSvg = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${device.width}" height="${device.height}"><rect x="${inset}" y="${inset}" width="${device.width - bw}" height="${device.height - bw}" rx="${Math.max(0, device.cornerRadius - inset)}" ry="${Math.max(0, device.cornerRadius - inset)}" fill="none" stroke="${stroke}" stroke-width="${bw}" stroke-opacity="0.9"/></svg>`,
    );
    layers.push({ input: borderSvg, top: pad, left: pad });
  }

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

export interface AnimationOutput {
  format: 'gif';
  width: number;
  height: number;
  buffer: Buffer;
}

/**
 * Compose a multi-frame animated GIF: each shot is framed/styled identically
 * (so every frame is the same size), stacked into a vertical strip, then encoded
 * as an animated GIF with the given per-frame hold time. Uses Sharp's native
 * animation (no ffmpeg).
 */
export async function composeAnimation(
  shots: Buffer[],
  settings: CaptureSettings,
): Promise<AnimationOutput> {
  if (shots.length === 0) throw new Error('Animation needs at least one frame');

  // Compose every frame as a PNG with the same settings.
  const composed: { buffer: Buffer; width: number; height: number }[] = [];
  for (const shot of shots) {
    composed.push(await composeAsset(shot, { ...settings, format: 'png' }));
  }

  const first = composed[0]!;
  const { width, height } = first;
  // Normalize all frames to the first frame's dimensions (they should already
  // match in viewport mode, but guard against any drift so frames line up).
  const frames = await Promise.all(
    composed.map((f) =>
      f.width === width && f.height === height
        ? f.buffer
        : sharp(f.buffer)
            .resize(width, height, { fit: 'contain', background: '#00000000' })
            .png()
            .toBuffer(),
    ),
  );

  // Join the frames as animation pages and encode an animated GIF (no ffmpeg).
  const delay = frames.map(() => settings.frameDuration ?? 1200);
  const gif = await sharp(frames, { join: { animated: true } })
    .gif({ loop: 0, delay })
    .toBuffer();

  return { format: 'gif', width, height, buffer: gif };
}

function hostFromUrl(raw: string): string {
  try {
    return new URL(raw).host;
  } catch {
    return raw;
  }
}
