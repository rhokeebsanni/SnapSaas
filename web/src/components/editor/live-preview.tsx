'use client';

import * as React from 'react';

import { DeviceFrame, MockSite } from '@/components/device-frame';
import { getBackground, glowColorForCss } from '@/lib/templates';
import type { ShadowPreset, TiltPreset, WindowStyle, FrameId } from '@/lib/capture';
import { cn } from '@/lib/utils';

/**
 * A faithful, live preview of the export. Every editor control maps to a real
 * visual here — background, frame, window style, padding, shadow depth, glow,
 * and 3D tilt — so what you see closely matches what the worker renders.
 *
 * The worker renders padding in absolute pixels at full scale; here we scale it
 * down proportionally to the preview width so the relationship stays truthful.
 */
const SHADOW_CSS: Record<ShadowPreset, string> = {
  none: 'none',
  soft: '0 10px 30px -12px rgba(0,0,0,0.35)',
  medium: '0 22px 50px -16px rgba(0,0,0,0.45)',
  dramatic: '0 40px 80px -20px rgba(0,0,0,0.6)',
};

const TILT_TRANSFORM: Record<TiltPreset, string> = {
  none: 'none',
  left: 'perspective(1400px) rotateY(14deg) rotateX(3deg)',
  right: 'perspective(1400px) rotateY(-14deg) rotateX(3deg)',
};

const TONE_BY_BG: Record<string, 'violet' | 'teal' | 'amber' | 'rose'> = {
  'violet-dream': 'violet',
  ocean: 'teal',
  sunset: 'amber',
  forest: 'teal',
  aurora: 'violet',
  candy: 'rose',
  graphite: 'violet',
  snow: 'rose',
  midnight: 'violet',
  nebula: 'rose',
  cosmos: 'violet',
  iris: 'violet',
  mint: 'teal',
};

export function LivePreview({
  url,
  frame,
  background,
  padding,
  shadow,
  glow,
  tilt,
  windowStyle,
  watermark,
}: {
  url: string;
  frame: FrameId;
  background: string;
  padding: number;
  shadow: ShadowPreset;
  glow: boolean;
  tilt: TiltPreset;
  windowStyle: WindowStyle;
  watermark?: boolean;
}) {
  const bg = getBackground(background);
  // Map the worker's 0–400px padding onto a sensible preview range (0–14%).
  const padPct = Math.min(14, (padding / 400) * 14 + 1.5);
  const glowColor = glowColorForCss(background);

  // Wide frames (browser/macbook) size by width — the box grows to the column
  // width and looks great. The iPhone is tall, so instead we bind the whole
  // composition (device + its padding) by HEIGHT and let width follow: it zooms
  // out until the entire padded frame fits, and the padding stays proportional.
  const isPhone = frame === 'iphone';

  return (
    <div
      className={cn(
        'relative grid place-items-center overflow-hidden rounded-xl transition-[padding] duration-300',
        isPhone ? 'h-full w-auto max-w-full' : 'w-full max-w-full',
      )}
      style={{ background: bg.css, padding: `${padPct}%` }}
    >
      {/* Watermark — mirrors the worker's "Made with SnapSaas" so the preview
          shows exactly what a free-plan export will look like. */}
      {watermark && (
        <span
          className="pointer-events-none absolute bottom-2 right-2.5 z-10 select-none text-[11px] font-semibold text-white/85 sm:text-xs"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.35)' }}
        >
          Made with SnapSaas
        </span>
      )}
      <div
        className={cn(
          'relative transition-transform duration-500 ease-out',
          // Phone: the device fills the box's remaining height (padding already
          // took its share), so adding padding shrinks the phone to keep the
          // whole composition in view. Wide frames stay width-bound.
          isPhone ? 'h-full w-auto' : 'w-full max-w-xl',
        )}
        style={{ transform: TILT_TRANSFORM[tilt], transformStyle: 'preserve-3d' }}
      >
        {/* Colored glow behind the device. */}
        {glow && (
          <div
            aria-hidden
            className="absolute -inset-6 -z-10 rounded-[2rem] opacity-70 blur-2xl transition-opacity duration-300"
            style={{ background: glowColor }}
          />
        )}
        <DeviceFrame
          variant={frame}
          url={url || 'yoursite.com'}
          windowStyle={windowStyle}
          className={cn(
            'transition-shadow duration-300',
            isPhone ? 'h-full w-auto max-w-none' : 'w-full',
          )}
          style={{ boxShadow: SHADOW_CSS[shadow] }}
        >
          <MockSite tone={TONE_BY_BG[background] ?? 'violet'} />
        </DeviceFrame>
      </div>
    </div>
  );
}
