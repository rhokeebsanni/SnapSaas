import * as React from 'react';

import type { FrameId, ShadowPreset, TiltPreset, WindowStyle } from '@/lib/capture';
import { cn } from '@/lib/utils';

/* Tiny visual previews used inside the editor's ThumbPicker tiles. They're
   schematic (not pixel-perfect), just enough to convey each option at a glance. */

export function FrameThumb({ frame }: { frame: FrameId }) {
  if (frame === 'iphone') {
    return (
      <div className="bg-foreground/80 h-9 w-[18px] rounded-[5px] p-[2px]">
        <div className="bg-background relative h-full w-full rounded-[3px]">
          <div className="bg-foreground/60 absolute left-1/2 top-[2px] h-[2px] w-2 -translate-x-1/2 rounded-full" />
        </div>
      </div>
    );
  }
  if (frame === 'macbook') {
    return (
      <div className="flex flex-col items-center">
        <div className="bg-foreground/80 h-7 w-12 rounded-t-[4px] p-[2px]">
          <div className="bg-background h-full w-full rounded-[2px]" />
        </div>
        <div className="bg-foreground/60 h-[3px] w-[52px] rounded-b-[2px]" />
      </div>
    );
  }
  // browser
  return (
    <div className="bg-foreground/80 h-8 w-12 overflow-hidden rounded-[4px]">
      <div className="flex h-[7px] items-center gap-[2px] px-[3px]">
        <span className="size-[2.5px] rounded-full bg-red-400" />
        <span className="size-[2.5px] rounded-full bg-yellow-400" />
        <span className="size-[2.5px] rounded-full bg-green-400" />
      </div>
      <div className="bg-background h-[25px] w-full" />
    </div>
  );
}

const SHADOW_CSS: Record<ShadowPreset, string> = {
  none: 'none',
  soft: '0 3px 6px -2px rgba(0,0,0,0.4)',
  medium: '0 6px 12px -3px rgba(0,0,0,0.5)',
  dramatic: '0 10px 18px -4px rgba(0,0,0,0.65)',
};

export function ShadowThumb({ shadow }: { shadow: ShadowPreset }) {
  return (
    <div className="bg-background size-7 rounded-[5px]" style={{ boxShadow: SHADOW_CSS[shadow] }} />
  );
}

const TILT_TRANSFORM: Record<TiltPreset, string> = {
  none: 'none',
  left: 'perspective(120px) rotateY(20deg)',
  right: 'perspective(120px) rotateY(-20deg)',
};

export function TiltThumb({ tilt }: { tilt: TiltPreset }) {
  return (
    <div
      className="from-brand/70 to-brand-2/70 h-7 w-9 rounded-[4px] bg-gradient-to-br shadow"
      style={{ transform: TILT_TRANSFORM[tilt] }}
    />
  );
}

export function WindowThumb({ style }: { style: WindowStyle }) {
  const dark = style === 'dark' || style === 'glass-dark' || style === 'inset-dark';
  const glass = style === 'glass' || style === 'glass-dark';
  const inset = style === 'inset' || style === 'inset-dark';

  // A faint checker hint behind glass so the translucency reads.
  const shell = inset
    ? dark
      ? 'border-neutral-800 bg-neutral-900'
      : 'border-neutral-300 bg-white'
    : glass
      ? dark
        ? 'border-white/15 bg-neutral-800/50'
        : 'border-white/50 bg-white/40'
      : dark
        ? 'border-neutral-700 bg-neutral-900'
        : 'border-neutral-300 bg-white';

  if (inset) {
    return (
      <div className={cn('h-8 w-12 rounded-[4px] border p-[3px]', shell)}>
        <div
          className={cn('h-full w-full rounded-[2px]', dark ? 'bg-neutral-700' : 'bg-neutral-200')}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'from-brand/30 to-brand-2/30 h-8 w-12 overflow-hidden rounded-[4px] border',
        glass && 'bg-gradient-to-br',
        shell,
      )}
    >
      <div
        className={cn(
          'flex h-[8px] items-center gap-[2px] px-[3px]',
          glass ? 'bg-white/20' : dark ? 'bg-neutral-800' : 'bg-neutral-100',
        )}
      >
        <span className="size-[2.5px] rounded-full bg-red-400" />
        <span className="size-[2.5px] rounded-full bg-yellow-400" />
        <span className="size-[2.5px] rounded-full bg-green-400" />
      </div>
      <div
        className={cn(
          'h-full w-full',
          glass ? 'bg-transparent' : dark ? 'bg-neutral-900' : 'bg-neutral-50',
        )}
      />
    </div>
  );
}

export function BorderThumb({ border }: { border: 'none' | 'light' | 'dark' }) {
  return (
    <div
      className="bg-muted size-7 rounded-[5px]"
      style={
        border === 'none'
          ? undefined
          : {
              outline: `2px solid ${border === 'dark' ? '#0b0b0f' : '#ffffff'}`,
              outlineOffset: '-2px',
            }
      }
    />
  );
}

export function ToggleThumb({ on, css }: { on: boolean; css?: string }) {
  // Used for the glow on/off tiles: a chip with or without a colored halo.
  return (
    <div
      className="bg-background size-6 rounded-[5px]"
      style={on ? { boxShadow: `0 0 10px 2px ${css ?? 'rgba(124,58,237,0.7)'}` } : undefined}
    />
  );
}
