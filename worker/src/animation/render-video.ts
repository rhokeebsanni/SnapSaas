import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import sharp from 'sharp';
import ffmpegPath from 'ffmpeg-static';

import { getBrowser } from '../capture/browser';
import { getBackground, type BackgroundPreset } from '../config/templates';
import {
  ANIMATION_PRESETS,
  DEFAULT_ANIM_PARAMS,
  FPS,
  type AnimationParams,
  type BuiltAnimation,
} from './presets';
import { buildScene } from './scene';

export interface VideoOutput {
  format: 'mp4' | 'gif';
  width: number;
  height: number;
  buffer: Buffer;
  frames: number;
}

/** Turn a background preset into a CSS background string for the HTML scene. */
function backgroundToCss(bg: BackgroundPreset): string {
  if (bg.type === 'solid') return bg.color;
  if (bg.type === 'gradient') {
    const stops = bg.stops.map(([o, c]) => `${c} ${Math.round(o * 100)}%`).join(', ');
    return `linear-gradient(${bg.angle}deg, ${stops})`;
  }
  // mesh: layered radial gradients over a base color.
  const layers = bg.blobs
    .map((b) => `radial-gradient(at ${b.cx * 100}% ${b.cy * 100}%, ${b.color}cc, transparent 55%)`)
    .join(', ');
  return `${layers}, ${bg.base}`;
}

function toEven(n: number): number {
  return n % 2 === 0 ? n : n + 1;
}

/** Encode a numbered PNG sequence to an MP4 (h264, 60fps, web-friendly). */
function encodeMp4(framesDir: string, outPath: string, fps: number): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!ffmpegPath) return reject(new Error('ffmpeg binary not found (ffmpeg-static)'));
    const args = [
      '-y',
      '-framerate',
      String(fps),
      '-i',
      path.join(framesDir, 'f_%05d.png'),
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-crf',
      '18',
      '-preset',
      'medium',
      '-movflags',
      '+faststart',
      outPath,
    ];
    const proc = spawn(ffmpegPath, args);
    let err = '';
    proc.stderr.on('data', (d) => (err += d.toString()));
    proc.on('error', reject);
    proc.on('close', (code) =>
      code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}: ${err.slice(-600)}`)),
    );
  });
}

/**
 * Render an animation preset deterministically and encode it to MP4.
 *
 * The scene runs the animation PAUSED; we step `currentTime` frame-by-frame at a
 * locked 60fps and screenshot each step (no real-time recording — that drops
 * frames and causes jank). The exact frame times make the motion perfectly
 * smooth and reproducible.
 */
export async function renderAnimationVideo(
  shot: Buffer,
  backgroundId: string,
  presetId: string,
  url: string,
  params: AnimationParams = DEFAULT_ANIM_PARAMS,
): Promise<VideoOutput> {
  const preset = ANIMATION_PRESETS[presetId] ?? ANIMATION_PRESETS['slow-zoom']!;
  // Turn the slider params (speed / intensity / smoothness) into concrete
  // keyframes + timing for this preset.
  const animation: BuiltAnimation = preset.build(params);

  // Scene geometry derived from the screenshot's aspect ratio.
  const meta = await sharp(shot).metadata();
  const shotW = meta.width ?? 1280;
  const shotH = meta.height ?? 800;
  const padding = 96;
  const mockupW = 1000;
  const chromeH = 40;
  const shotDisplayH = Math.round((mockupW * shotH) / shotW);
  const mockupH = chromeH + shotDisplayH;
  const sceneW = toEven(mockupW + padding * 2);
  const sceneH = toEven(mockupH + padding * 2);

  const bg = getBackground(backgroundId);
  const html = buildScene({
    shotDataUri: `data:image/png;base64,${shot.toString('base64')}`,
    url,
    backgroundCss: backgroundToCss(bg),
    sceneW,
    sceneH,
    mockupW,
    chromeH,
    animation,
  });

  // Frame plan: main timeline + optional hold on the final frame.
  const step = 1000 / FPS;
  const mainFrames = Math.max(1, Math.round(animation.renderMs / step));
  const holdFrames = Math.round(animation.holdMs / step);

  const browser = await getBrowser();
  const context = await browser.newContext({
    viewport: { width: sceneW, height: sceneH },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const dir = await mkdtemp(path.join(tmpdir(), 'snapanim-'));

  try {
    await page.setContent(html, { waitUntil: 'load' });
    // Wait until the scene's paused animation is parked on window.__anim.
    await page.waitForFunction('window.__ready === true', undefined, { timeout: 10_000 });

    let frameIndex = 0;
    const writeFrame = async (buf: Buffer) => {
      await writeFile(path.join(dir, `f_${String(frameIndex).padStart(5, '0')}.png`), buf);
      frameIndex += 1;
    };

    for (let i = 0; i < mainFrames; i++) {
      const t = i * step;
      await page.evaluate((time) => {
        (globalThis as unknown as { __anim: { currentTime: number } }).__anim.currentTime = time;
      }, t);
      await writeFrame(await page.screenshot({ type: 'png' }));
    }

    // Hold the final frame (re-use the last screenshot) for a clean settle.
    if (holdFrames > 0) {
      await page.evaluate((time) => {
        (globalThis as unknown as { __anim: { currentTime: number } }).__anim.currentTime = time;
      }, animation.renderMs);
      const last = await page.screenshot({ type: 'png' });
      for (let i = 0; i < holdFrames; i++) await writeFrame(last);
    }

    const outPath = path.join(dir, 'out.mp4');
    await encodeMp4(dir, outPath, FPS);
    const buffer = await readFile(outPath);

    return { format: 'mp4', width: sceneW, height: sceneH, buffer, frames: frameIndex };
  } finally {
    await context.close().catch(() => undefined);
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}
