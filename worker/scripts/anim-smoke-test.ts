/**
 * Manual smoke test for the deterministic animation pipeline.
 *
 *   npx tsx scripts/anim-smoke-test.ts [presetId] [backgroundId] [speed] [intensity] [smoothness]
 *
 * speed/intensity/smoothness are 0..100 slider values (default 50 = mid-range).
 *
 * Renders a self-contained "fake dashboard" screenshot (no network), runs it
 * through the frame-by-frame WAAPI capture pipeline, and writes an MP4 plus a
 * short ffprobe-style report so smoothness / fps can be confirmed by eye.
 *
 * This lives in scripts/ (outside src/) so it never ships in the worker build.
 */
import { spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { chromium } from 'playwright';
import ffmpegPath from 'ffmpeg-static';

import { renderAnimationVideo } from '../src/animation/render-video';
import { ANIMATION_PRESETS, type AnimationParams } from '../src/animation/presets';

const presetId = process.argv[2] ?? 'slow-zoom';
const backgroundId = process.argv[3] ?? 'aurora';
// Slider values arrive as 0..100; default to mid-range (50). Normalize to 0..1.
const slider = (i: number) => Math.min(100, Math.max(0, Number(process.argv[i] ?? '50'))) / 100;
const params: AnimationParams = {
  speed: slider(4),
  intensity: slider(5),
  smoothness: slider(6),
};

/** A clean, realistic SaaS dashboard so motion is judged on real-looking UI. */
const DASHBOARD_HTML = `<!doctype html><html><head><meta charset="utf-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { width:1280px; height:800px; font:14px/1.4 -apple-system,'Segoe UI',Roboto,sans-serif;
         color:#0f172a; background:#f8fafc; display:flex; }
  .side { width:230px; height:800px; background:#0b1220; color:#cbd5e1; padding:24px 18px; }
  .brand { display:flex; align-items:center; gap:10px; font-weight:700; color:#fff; font-size:16px; margin-bottom:28px; }
  .logo { width:28px; height:28px; border-radius:8px; background:linear-gradient(135deg,#7c3aed,#06b6d4); }
  .nav { display:flex; flex-direction:column; gap:6px; }
  .nav a { padding:10px 12px; border-radius:9px; color:#94a3b8; text-decoration:none; }
  .nav a.on { background:#1e293b; color:#fff; }
  .main { flex:1; padding:28px 32px; }
  .top { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
  h1 { font-size:22px; }
  .btn { background:linear-gradient(135deg,#7c3aed,#6d28d9); color:#fff; padding:10px 16px; border-radius:10px; font-weight:600; }
  .cards { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; margin-bottom:24px; }
  .card { background:#fff; border:1px solid #e2e8f0; border-radius:14px; padding:18px; box-shadow:0 1px 2px rgba(15,23,42,.04); }
  .card .k { color:#64748b; font-size:12px; text-transform:uppercase; letter-spacing:.04em; }
  .card .v { font-size:28px; font-weight:700; margin-top:6px; }
  .card .d { color:#16a34a; font-size:12px; margin-top:4px; }
  .panel { background:#fff; border:1px solid #e2e8f0; border-radius:14px; padding:20px; box-shadow:0 1px 2px rgba(15,23,42,.04); }
  .panel h2 { font-size:15px; margin-bottom:16px; }
  .chart { height:200px; display:flex; align-items:flex-end; gap:14px; }
  .bar { flex:1; border-radius:8px 8px 0 0; background:linear-gradient(180deg,#8b5cf6,#6366f1); }
</style></head><body>
  <div class="side">
    <div class="brand"><div class="logo"></div> SnapSaas</div>
    <div class="nav">
      <a class="on">Overview</a><a>Captures</a><a>Templates</a><a>Animations</a><a>Billing</a><a>Settings</a>
    </div>
  </div>
  <div class="main">
    <div class="top"><h1>Overview</h1><div class="btn">New capture</div></div>
    <div class="cards">
      <div class="card"><div class="k">Renders</div><div class="v">12,480</div><div class="d">+18% this week</div></div>
      <div class="card"><div class="k">Avg time</div><div class="v">1.9s</div><div class="d">-12% faster</div></div>
      <div class="card"><div class="k">MP4 exports</div><div class="v">3,201</div><div class="d">+44% this week</div></div>
    </div>
    <div class="panel"><h2>Exports this month</h2>
      <div class="chart">
        <div class="bar" style="height:42%"></div><div class="bar" style="height:66%"></div>
        <div class="bar" style="height:51%"></div><div class="bar" style="height:88%"></div>
        <div class="bar" style="height:72%"></div><div class="bar" style="height:95%"></div>
        <div class="bar" style="height:60%"></div><div class="bar" style="height:80%"></div>
      </div>
    </div>
  </div>
</body></html>`;

async function makeFakeShot(): Promise<Buffer> {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--hide-scrollbars'],
  });
  try {
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 2,
    });
    const page = await ctx.newPage();
    await page.setContent(DASHBOARD_HTML, { waitUntil: 'load' });
    return await page.screenshot({ type: 'png' });
  } finally {
    await browser.close();
  }
}

/** Use the bundled ffmpeg to print stream info (acts as an ffprobe stand-in). */
function probe(file: string): string {
  if (!ffmpegPath) return '(no ffmpeg binary)';
  const out = spawnSync(ffmpegPath, ['-hide_banner', '-i', file], { encoding: 'utf8' });
  // ffmpeg prints input info to stderr and exits non-zero (no output set) — that's expected.
  const lines = (out.stderr || '').split('\n').filter((l) => /Duration|Stream|fps|tbr/.test(l));
  return lines.map((l) => l.trim()).join('\n');
}

async function main() {
  const preset = ANIMATION_PRESETS[presetId];
  if (!preset) {
    console.error(
      `Unknown preset "${presetId}". Options: ${Object.keys(ANIMATION_PRESETS).join(', ')}`,
    );
    process.exit(1);
  }

  console.log(`\n[1/3] Rendering fake dashboard screenshot (1280x800 @2x)…`);
  const t0 = Date.now();
  const shot = await makeFakeShot();
  console.log(`      shot ready: ${(shot.length / 1024).toFixed(0)} KB in ${Date.now() - t0}ms`);

  const pct = (n: number) => `${Math.round(n * 100)}`;
  console.log(
    `[2/3] Capturing "${preset.name}" frame-by-frame at 60fps (bg="${backgroundId}", ` +
      `speed=${pct(params.speed)} intensity=${pct(params.intensity)} smoothness=${pct(params.smoothness)})…`,
  );
  const t1 = Date.now();
  const video = await renderAnimationVideo(
    shot,
    backgroundId,
    presetId,
    'snapsaas.com/dashboard',
    params,
  );
  const renderMs = Date.now() - t1;

  const outDir = path.join(__dirname, '..', 'tmp');
  await mkdir(outDir, { recursive: true });
  const outFile = path.join(outDir, `anim-${presetId}.mp4`);
  await writeFile(outFile, video.buffer);

  console.log(`[3/3] Wrote ${outFile}`);
  const built = preset.build(params);
  const expectedFrames =
    Math.max(1, Math.round(built.renderMs / (1000 / 60))) + Math.round(built.holdMs / (1000 / 60));
  console.log(`\n--- RESULT ---------------------------------------------`);
  console.log(`preset      : ${preset.name} (${presetId})`);
  console.log(`easing      : ${built.options.easing}  duration=${built.options.duration}ms`);
  console.log(`dimensions  : ${video.width} x ${video.height}`);
  console.log(`frames      : ${video.frames}  (expected ${expectedFrames})`);
  console.log(`duration    : ${(video.frames / 60).toFixed(3)}s @ locked 60fps`);
  console.log(`file size   : ${(video.buffer.length / 1024).toFixed(0)} KB`);
  console.log(`capture time: ${(renderMs / 1000).toFixed(1)}s wall`);
  console.log(
    `ffmpeg probe:\n${probe(outFile)
      .split('\n')
      .map((l) => '  ' + l)
      .join('\n')}`,
  );
  console.log(`--------------------------------------------------------\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
