'use client';

import * as React from 'react';

import { DeviceFrame, MockSite } from '@/components/device-frame';
import { getBackground, glowColorForCss } from '@/lib/templates';
import type { ShadowPreset, WindowStyle, FrameId } from '@/lib/capture';
import { cn } from '@/lib/utils';

/**
 * A faithful, live preview of the export. Every editor control maps to a real
 * visual here — background, frame, window style, padding, shadow depth, glow,
 * and 3D tilt — so what you see closely matches what the worker renders.
 *
 * The worker renders padding in absolute pixels at full scale; here we scale it
 * down proportionally to the preview width so the relationship stays truthful.
 */
// [distance, blur, spread, baseOpacity] per depth — combined with direction +
// opacity overrides to build the boxShadow.
const SHADOW_DEPTH: Record<ShadowPreset, [number, number, number, number]> = {
  none: [0, 0, 0, 0],
  soft: [10, 30, -12, 0.35],
  medium: [22, 50, -16, 0.45],
  dramatic: [40, 80, -20, 0.6],
};

function shadowCss(
  shadow: ShadowPreset,
  direction: number,
  opacityOverride: number | null,
): string {
  const [dist, blur, spread, baseOpacity] = SHADOW_DEPTH[shadow];
  if (dist === 0 && shadow === 'none') return 'none';
  const rad = (direction * Math.PI) / 180;
  const dx = Math.round(Math.sin(rad) * dist);
  const dy = Math.round(-Math.cos(rad) * dist);
  const opacity = opacityOverride !== null ? opacityOverride / 100 : baseOpacity;
  return `${dx}px ${dy}px ${blur}px ${spread}px rgba(0,0,0,${opacity})`;
}

function rotateTransform(rx: number, ry: number, rz: number): string {
  if (!rx && !ry && !rz) return 'none';
  return `perspective(1400px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`;
}

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
  rotateX = 0,
  rotateY = 0,
  rotateZ = 0,
  windowStyle,
  border,
  borderWidth = 4,
  shadowOpacity = null,
  shadowDirection = 180,
  hideMockup = false,
  noise = 0,
  vignette = 0,
  watermark,
  customGradient,
}: {
  url: string;
  frame: FrameId;
  background: string;
  padding: number;
  shadow: ShadowPreset;
  glow: boolean;
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;
  windowStyle: WindowStyle;
  border?: 'none' | 'light' | 'dark';
  borderWidth?: number;
  shadowOpacity?: number | null;
  shadowDirection?: number;
  hideMockup?: boolean;
  noise?: number;
  vignette?: number;
  watermark?: boolean;
  customGradient?: { colors: string[]; angle: number };
}) {
  const preset = getBackground(background);
  // A custom gradient overrides the preset's css when active.
  const bgCss =
    background === 'custom' && customGradient
      ? `linear-gradient(${customGradient.angle}deg, ${customGradient.colors.join(', ')})`
      : preset.css;
  // Map the worker's 0–400px padding onto a sensible preview range (0–14%).
  const padPct = Math.min(14, (padding / 400) * 14 + 1.5);
  const glowColor =
    background === 'custom' && customGradient
      ? customGradient.colors[0]
      : glowColorForCss(background);

  // Wide frames (browser/macbook) size by width — the box grows to the column
  // width and looks great. The iPhone is tall, so instead we bind the whole
  // composition (device + its padding) by HEIGHT and let width follow: it zooms
  // out until the entire padded frame fits, and the padding stays proportional.
  const isPhone = frame === 'iphone';

  const deviceShadow = shadowCss(shadow, shadowDirection, shadowOpacity);
  // Border drawn with an outline so it hugs the rounded frame edge without
  // affecting layout. Scaled down to match the mini preview.
  const borderStyle =
    border && border !== 'none'
      ? {
          outline: `${Math.max(1, borderWidth * 0.5)}px solid ${
            border === 'dark' ? '#0b0b0f' : '#ffffff'
          }`,
          outlineOffset: `-${Math.max(1, borderWidth * 0.5)}px`,
        }
      : {};

  return (
    <div
      className={cn(
        'relative grid place-items-center overflow-hidden rounded-xl transition-[padding] duration-300',
        isPhone ? 'h-full w-auto max-w-full' : 'w-full max-w-full',
      )}
      style={{ background: bgCss, padding: `${padPct}%` }}
    >
      {/* Film grain on the background only (mirrors the worker). */}
      {noise > 0 && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 mix-blend-overlay"
          style={{
            opacity: Math.min(0.6, noise / 100),
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
      )}
      {/* Edge vignette. */}
      {vignette > 0 && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background: `radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,${((vignette / 100) * 0.7).toFixed(3)}) 100%)`,
          }}
        />
      )}
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
          'relative z-10 transition-transform duration-500 ease-out',
          // Phone: the device fills the box's remaining height (padding already
          // took its share), so adding padding shrinks the phone to keep the
          // whole composition in view. Wide frames stay width-bound.
          isPhone ? 'h-full w-auto' : 'w-full max-w-xl',
        )}
        style={{
          transform: rotateTransform(rotateX, rotateY, rotateZ),
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Colored glow behind the device. */}
        {glow && (
          <div
            aria-hidden
            className="absolute -inset-6 -z-10 rounded-[2rem] opacity-70 blur-2xl transition-opacity duration-300"
            style={{ background: glowColor }}
          />
        )}
        {hideMockup ? (
          // Hide-mockup: just the bare screenshot, softly rounded.
          <div
            className={cn(
              'overflow-hidden rounded-xl transition-shadow duration-300',
              isPhone ? 'aspect-[9/16] h-full w-auto' : 'aspect-[16/10] w-full',
            )}
            style={{ boxShadow: deviceShadow, ...borderStyle }}
          >
            <MockSite tone={TONE_BY_BG[background] ?? 'violet'} />
          </div>
        ) : (
          <DeviceFrame
            variant={frame}
            url={url || 'yoursite.com'}
            windowStyle={windowStyle}
            className={cn(
              'transition-shadow duration-300',
              isPhone ? 'h-full w-auto max-w-none' : 'w-full',
            )}
            style={{ boxShadow: deviceShadow, ...borderStyle }}
          >
            <MockSite tone={TONE_BY_BG[background] ?? 'violet'} />
          </DeviceFrame>
        )}
      </div>
    </div>
  );
}
