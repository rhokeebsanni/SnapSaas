import type { BuiltAnimation } from './presets';

export interface SceneSpec {
  /** Base64 PNG data URI of the captured screenshot. */
  shotDataUri: string;
  /** Address-bar label. */
  url: string;
  /** CSS background for the scene (gradient/solid). */
  backgroundCss: string;
  /** Scene (output frame) dimensions in px — even numbers for h264. */
  sceneW: number;
  sceneH: number;
  /** Mockup display width in px. */
  mockupW: number;
  /** Chrome toolbar height in px. */
  chromeH: number;
  /** Concrete animation (keyframes + timing) built from the slider params. */
  animation: BuiltAnimation;
}

/**
 * Build the full HTML/CSS scene Playwright loads. It paints the background and a
 * framed browser mockup around the screenshot, then creates the built animation
 * PAUSED and parks it on `window.__anim` so the Node side can step `currentTime`
 * deterministically. `window.__ready` flips true once set up.
 */
export function buildScene(spec: SceneSpec): string {
  const { shotDataUri, url, backgroundCss, sceneW, sceneH, mockupW, chromeH, animation } = spec;
  const kf = JSON.stringify(animation.keyframes);
  const opts = JSON.stringify({
    duration: animation.options.duration,
    easing: animation.options.easing,
    iterations: animation.options.iterations ?? 1,
    direction: animation.options.direction ?? 'normal',
    fill: 'both',
  });

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${sceneW}px; height: ${sceneH}px; overflow: hidden; }
  .scene {
    width: ${sceneW}px; height: ${sceneH}px;
    display: flex; align-items: center; justify-content: center;
    background: ${backgroundCss};
  }
  .mockup {
    width: ${mockupW}px;
    transform-origin: center center;
    will-change: transform, opacity;
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 30px 70px -22px rgba(0,0,0,0.55);
    background: #fff;
  }
  .chrome {
    height: ${chromeH}px;
    display: flex; align-items: center; gap: 8px;
    padding: 0 14px;
    background: linear-gradient(#f3f4f6, #e9eaee);
    border-bottom: 1px solid rgba(0,0,0,0.07);
  }
  .dot { width: 11px; height: 11px; border-radius: 50%; }
  .dot.r { background: #ff5f57; } .dot.y { background: #febc2e; } .dot.g { background: #28c840; }
  .addr {
    flex: 1; height: ${Math.round(chromeH * 0.55)}px; margin-left: 10px;
    background: #fff; border: 1px solid rgba(0,0,0,0.06); border-radius: 8px;
    display: flex; align-items: center; padding: 0 12px;
    font: 13px -apple-system, Segoe UI, Roboto, sans-serif; color: #6b7280;
  }
  .shot { display: block; width: 100%; height: auto; }
</style>
</head>
<body>
  <div class="scene">
    <div class="mockup" id="mockup">
      <div class="chrome">
        <span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>
        <div class="addr">${escapeHtml(url)}</div>
      </div>
      <img class="shot" src="${shotDataUri}" />
    </div>
  </div>
  <script>
    (function () {
      function start() {
        var el = document.getElementById('mockup');
        var anim = el.animate(${kf}, ${opts});
        anim.pause();
        window.__anim = anim;
        window.__ready = true;
      }
      // Wait for the screenshot image to decode so the first frame is correct.
      var img = document.querySelector('.shot');
      if (img.complete) start();
      else img.addEventListener('load', start);
    })();
  </script>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
