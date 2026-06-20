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
}: {
  url: string;
  frame: FrameId;
  background: string;
  padding: number;
  shadow: ShadowPreset;
  glow: boolean;
  tilt: TiltPreset;
  windowStyle: WindowStyle;
}) {
  const bg = getBackground(background);
  // Map the worker's 0–400px padding onto a sensible preview range (0–14%).
  const padPct = Math.min(14, (padding / 400) * 14 + 1.5);
  const glowColor = glowColorForCss(background);

  // The iPhone frame is tall and narrow (aspect 9/19). Sizing it by width alone
  // makes it overflow the (height-capped) preview box and get clipped, so cap
  // the device's *width* tightly for the phone — its height then fits.
  const isPhone = frame === 'iphone';

  return (
    <div
      className="grid w-full place-items-center overflow-hidden rounded-xl transition-[padding] duration-300"
      style={{ background: bg.css, padding: `${padPct}%` }}
    >
      <div
        className={cn(
          'relative w-full transition-transform duration-500 ease-out',
          // The phone is a tall 9/19 frame; sizing by width alone overflows the
          // height-capped preview box and clips. A tight width keeps it short
          // enough (~210px → ~443px tall) to fit comfortably.
          isPhone ? 'mx-auto max-w-[210px]' : 'max-w-xl',
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
          className="w-full transition-shadow duration-300"
          style={{ boxShadow: SHADOW_CSS[shadow] }}
        >
          <MockSite tone={TONE_BY_BG[background] ?? 'violet'} />
        </DeviceFrame>
      </div>
    </div>
  );
}
