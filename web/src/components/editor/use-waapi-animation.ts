'use client';

import * as React from 'react';

import { buildAnimation, toPreviewAnimation, type AnimationPresetId } from '@/lib/animation';

/**
 * Run a looping WAAPI preview of the chosen motion preset on `ref`, rebuilding
 * whenever the preset or any slider param changes — that's what makes the live
 * preview update in real time as the user drags. Passing `presetId = null`
 * cancels any running animation and leaves the element at rest.
 *
 * The preview uses the same `buildAnimation` math as the exported video, wrapped
 * by `toPreviewAnimation` so it loops continuously instead of playing once.
 */
export function useWaapiAnimation(
  ref: React.RefObject<HTMLElement | null>,
  presetId: AnimationPresetId | null,
  speed: number,
  intensity: number,
  smoothness: number,
): void {
  React.useEffect(() => {
    const el = ref.current;
    if (!el || !presetId) return;

    // Slider values arrive as 0..100; the param model expects 0..1.
    const built = toPreviewAnimation(
      buildAnimation(presetId, {
        speed: speed / 100,
        intensity: intensity / 100,
        smoothness: smoothness / 100,
      }),
    );
    const anim = el.animate(built.keyframes, built.options);

    return () => anim.cancel();
  }, [ref, presetId, speed, intensity, smoothness]);
}
