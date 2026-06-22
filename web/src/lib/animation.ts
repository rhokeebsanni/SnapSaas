/**
 * Animation param model for the editor — the browser-side mirror of the worker's
 * `worker/src/animation/presets.ts`. The same Speed / Intensity / Smoothness
 * sliders drive both the live WAAPI preview here and the deterministic MP4/GIF
 * the worker renders, so the two stay visually in sync. Keep the math identical.
 */

export type AnimationPresetId = 'slow-zoom' | 'rise-reveal' | 'float' | 'tilt-settle';

export interface AnimationPresetMeta {
  id: AnimationPresetId;
  name: string;
  description: string;
  /**
   * Whether the sliders + export are wired for this preset yet. Only Slow Zoom
   * is live in this pass; the rest preview their motion but aren't selectable
   * until they're parametrized in the follow-up.
   */
  enabled: boolean;
}

export const ANIMATION_PRESETS: AnimationPresetMeta[] = [
  {
    id: 'slow-zoom',
    name: 'Slow Zoom',
    description: 'Gradual cinematic zoom from center',
    enabled: true,
  },
  {
    id: 'rise-reveal',
    name: 'Rise Reveal',
    description: 'Fades up into place, then holds',
    enabled: false,
  },
  { id: 'float', name: 'Float', description: 'Weightless looping drift', enabled: false },
  {
    id: 'tilt-settle',
    name: '3D Tilt Settle',
    description: 'Tilts in and springs flat',
    enabled: false,
  },
];

/** Slider params normalized to 0..1 (the UI stores 0..100 ints and divides). */
export interface AnimationParams {
  /** 0 = slow/cinematic, 1 = fast/snappy. Drives duration. */
  speed: number;
  /** 0 = subtle, 1 = dramatic. Drives motion magnitude. */
  intensity: number;
  /** 0 = snappy (quick attack), 1 = floaty (gentle in-out). Drives easing. */
  smoothness: number;
}

export const DEFAULT_ANIM_PARAMS: AnimationParams = { speed: 0.5, intensity: 0.5, smoothness: 0.5 };

export interface BuiltAnimation {
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
  /** True when the motion already loops seamlessly (Float). */
  loop: boolean;
}

const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const round = (n: number, dp = 4): number => Number(n.toFixed(dp));

/**
 * Map Smoothness → a cubic-bezier easing, interpolating between a "snappy" curve
 * (quick attack, fast settle) and a "floaty" one (gentle, symmetric in-out).
 * Identical to the worker so preview easing matches the export.
 */
export function smoothnessEasing(smoothness: number): string {
  const t = clamp01(smoothness);
  const snappy = [0.16, 0.84, 0.28, 1];
  const floaty = [0.37, 0.0, 0.63, 1];
  const c = snappy.map((s, i) => round(lerp(s, floaty[i]!, t), 3));
  return `cubic-bezier(${c.join(', ')})`;
}

function buildSlowZoom(p: AnimationParams): BuiltAnimation {
  const duration = Math.round(lerp(9000, 3000, clamp01(p.speed)));
  const scaleTo = 1 + lerp(0.02, 0.14, clamp01(p.intensity));
  return {
    keyframes: [{ transform: 'scale(1)' }, { transform: `scale(${round(scaleTo)})` }],
    options: { duration, easing: smoothnessEasing(p.smoothness), iterations: 1, fill: 'both' },
    loop: false,
  };
}

// Presets 2–4: fixed motion carried over from the worker (params ignored for
// now). They animate in the picker preview but aren't slider-wired yet.
function buildRiseReveal(): BuiltAnimation {
  return {
    keyframes: [
      { opacity: 0, transform: 'translateY(40px) scale(0.96)' },
      { opacity: 1, transform: 'translateY(0px) scale(1)' },
    ],
    options: {
      duration: 800,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      iterations: 1,
      fill: 'both',
    },
    loop: false,
  };
}

function buildFloat(): BuiltAnimation {
  return {
    keyframes: [
      { transform: 'translateY(0px)' },
      { transform: 'translateY(-12px)' },
      { transform: 'translateY(0px)' },
    ],
    options: { duration: 4000, easing: 'ease-in-out', iterations: Infinity, fill: 'both' },
    loop: true,
  };
}

function buildTiltSettle(): BuiltAnimation {
  return {
    keyframes: [
      { transform: 'perspective(1200px) rotateX(8deg) rotateY(-12deg) scale(0.95)' },
      { transform: 'perspective(1200px) rotateX(0deg) rotateY(0deg) scale(1)' },
    ],
    options: {
      duration: 1000,
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      iterations: 1,
      fill: 'both',
    },
    loop: false,
  };
}

export function buildAnimation(id: AnimationPresetId, params: AnimationParams): BuiltAnimation {
  switch (id) {
    case 'slow-zoom':
      return buildSlowZoom(params);
    case 'rise-reveal':
      return buildRiseReveal();
    case 'float':
      return buildFloat();
    case 'tilt-settle':
      return buildTiltSettle();
  }
}

/**
 * Turn a built animation into a continuously-looping version for the live
 * preview / picker cards. Seamless loops play as-is; one-shot motions ping-pong
 * (alternate, infinite) with a short hold so the effect reads on repeat.
 */
export function toPreviewAnimation(built: BuiltAnimation): BuiltAnimation {
  if (built.loop) return built;
  return {
    ...built,
    options: {
      ...built.options,
      iterations: Infinity,
      direction: 'alternate',
      // A touch slower + an end delay so the loop doesn't feel frantic.
      duration: (Number(built.options.duration) || 1000) * 1.1,
      endDelay: 450,
    },
  };
}
