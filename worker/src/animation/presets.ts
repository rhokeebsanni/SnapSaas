/**
 * Animation presets. Each is rendered deterministically: a Web Animations API
 * animation is created PAUSED in the scene, then we step `currentTime` frame by
 * frame at a locked 60fps and screenshot each step (no real-time recording — that
 * drops frames). `keyframes` and `options` are passed straight to Element.animate.
 *
 * Presets are PARAMETRIC: the editor exposes three sliders — Speed, Intensity and
 * Smoothness — and each preset's `build(params)` turns those into concrete
 * keyframes + timing. The same param→animation math is mirrored in the web app
 * (`web/src/lib/animation.ts`) so the live preview matches the exported video.
 */

/** Normalized 0..1 slider values. The UI stores 0..100 ints and divides by 100. */
export interface AnimationParams {
  /** Playback speed: 0 = slow/cinematic, 1 = fast/snappy. Drives duration. */
  speed: number;
  /** Motion magnitude: 0 = subtle, 1 = dramatic. Drives scale/offset/angle. */
  intensity: number;
  /** Easing feel: 0 = snappy (quick attack), 1 = floaty (gentle in-out). */
  smoothness: number;
}

export const DEFAULT_ANIM_PARAMS: AnimationParams = {
  speed: 0.5,
  intensity: 0.5,
  smoothness: 0.5,
};

/** A concrete animation ready to hand to Element.animate + the frame planner. */
export interface BuiltAnimation {
  /** WAAPI keyframes (array of style objects). */
  keyframes: Record<string, string | number>[];
  options: {
    duration: number;
    easing: string;
    iterations?: number;
    direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  };
  /** How many ms of timeline to actually render (one cycle for loops). */
  renderMs: number;
  /** Extra ms holding the final frame after the timeline (e.g. reveal settles). */
  holdMs: number;
  /** Whether the export should loop seamlessly (affects GIF loop + MP4 hint). */
  loop: boolean;
}

export interface AnimationPreset {
  id: string;
  name: string;
  /** Short human description for the picker card. */
  description: string;
  build: (params: AnimationParams) => BuiltAnimation;
}

export const FPS = 60;

const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const round = (n: number, dp = 4): number => Number(n.toFixed(dp));

/**
 * Map Smoothness → a cubic-bezier easing, interpolating between a "snappy" curve
 * (quick attack, fast settle) and a "floaty" curve (gentle, symmetric in-out).
 * At 0.5 it lands on a balanced, natural ease.
 */
export function smoothnessEasing(smoothness: number): string {
  const t = clamp01(smoothness);
  const snappy = [0.16, 0.84, 0.28, 1]; // shoots out early, eases to rest
  const floaty = [0.37, 0.0, 0.63, 1]; // ease-in-out sine — soft both ends
  const c = snappy.map((s, i) => round(lerp(s, floaty[i]!, t), 3));
  return `cubic-bezier(${c.join(', ')})`;
}

/**
 * SLOW ZOOM (Ken Burns) — a gradual scale-up from center. Cinematic and subtle.
 * - Speed     → duration (slow 9s … fast 3s)
 * - Intensity → final scale (subtle 1.02 … dramatic 1.14)
 * - Smoothness→ easing curve (snappy … floaty)
 */
function buildSlowZoom(p: AnimationParams): BuiltAnimation {
  const duration = Math.round(lerp(9000, 3000, clamp01(p.speed)));
  const scaleTo = 1 + lerp(0.02, 0.14, clamp01(p.intensity));
  return {
    keyframes: [{ transform: 'scale(1)' }, { transform: `scale(${round(scaleTo)})` }],
    options: { duration, easing: smoothnessEasing(p.smoothness), iterations: 1 },
    renderMs: duration,
    holdMs: 0,
    loop: false,
  };
}

// --- Presets 2–4: carried over verbatim from the pre-parametric build. They are
// intentionally NOT yet wired to the sliders (params ignored) — they'll be
// parametrized in a follow-up pass once Slow Zoom is signed off. -------------

function buildRiseReveal(_p: AnimationParams): BuiltAnimation {
  return {
    keyframes: [
      { opacity: 0, transform: 'translateY(40px) scale(0.96)' },
      { opacity: 1, transform: 'translateY(0px) scale(1)' },
    ],
    options: { duration: 800, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', iterations: 1 },
    renderMs: 800,
    holdMs: 1500,
    loop: false,
  };
}

function buildFloat(_p: AnimationParams): BuiltAnimation {
  return {
    keyframes: [
      { transform: 'translateY(0px)' },
      { transform: 'translateY(-12px)' },
      { transform: 'translateY(0px)' },
    ],
    options: {
      duration: 4000,
      easing: 'ease-in-out',
      iterations: Infinity,
      direction: 'alternate',
    },
    renderMs: 4000,
    holdMs: 0,
    loop: true,
  };
}

function buildTiltSettle(_p: AnimationParams): BuiltAnimation {
  return {
    keyframes: [
      { transform: 'perspective(1200px) rotateX(8deg) rotateY(-12deg) scale(0.95)' },
      { transform: 'perspective(1200px) rotateX(0deg) rotateY(0deg) scale(1)' },
    ],
    options: { duration: 1000, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', iterations: 1 },
    renderMs: 1000,
    holdMs: 1200,
    loop: false,
  };
}

export const ANIMATION_PRESETS: Record<string, AnimationPreset> = {
  'slow-zoom': {
    id: 'slow-zoom',
    name: 'Slow Zoom',
    description: 'Gradual cinematic zoom from center',
    build: buildSlowZoom,
  },
  'rise-reveal': {
    id: 'rise-reveal',
    name: 'Rise Reveal',
    description: 'Fades up into place, then holds',
    build: buildRiseReveal,
  },
  float: {
    id: 'float',
    name: 'Float',
    description: 'Weightless looping drift',
    build: buildFloat,
  },
  'tilt-settle': {
    id: 'tilt-settle',
    name: '3D Tilt Settle',
    description: 'Tilts in and springs flat',
    build: buildTiltSettle,
  },
};
