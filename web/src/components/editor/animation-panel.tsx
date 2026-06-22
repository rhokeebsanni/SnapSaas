'use client';

import * as React from 'react';
import Link from 'next/link';
import { Gauge, Sparkles, Waves, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useEditorStore } from '@/store/editor';
import { ANIMATION_PRESETS, type AnimationPresetId } from '@/lib/animation';
import { cn } from '@/lib/utils';
import { useWaapiAnimation } from './use-waapi-animation';

/** A tiny faux "site" shown inside each card's animating mini-frame. */
function MiniMock() {
  return (
    <div className="flex h-full w-full flex-col bg-gradient-to-br from-violet-500/45 via-indigo-500/30 to-sky-500/45">
      <div className="flex items-center gap-1 px-1.5 py-1">
        <span className="size-1 rounded-full bg-white/70" />
        <span className="size-1 rounded-full bg-white/50" />
        <span className="size-1 rounded-full bg-white/40" />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-1 px-2">
        <div className="h-1.5 w-3/4 rounded-full bg-white/55" />
        <div className="h-1 w-1/2 rounded-full bg-white/30" />
        <div className="mt-0.5 h-2.5 w-8 rounded bg-white/75" />
      </div>
    </div>
  );
}

/** The animated mini-frame. Wrapped so the device scales/moves on its own. */
function MiniFrame({ animRef }: { animRef: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div className="grid h-[70px] w-full place-items-center overflow-hidden rounded-md bg-neutral-900/40">
      <div
        ref={animRef}
        className="aspect-[16/10] w-[78%] overflow-hidden rounded-[5px] shadow-md ring-1 ring-black/10"
      >
        <MiniMock />
      </div>
    </div>
  );
}

/** Slow Zoom card preview — driven by the live slider params. */
function SlowZoomPreview() {
  const ref = React.useRef<HTMLDivElement>(null);
  const speed = useEditorStore((s) => s.animSpeed);
  const intensity = useEditorStore((s) => s.animIntensity);
  const smoothness = useEditorStore((s) => s.animSmoothness);
  useWaapiAnimation(ref, 'slow-zoom', speed, intensity, smoothness);
  return <MiniFrame animRef={ref} />;
}

/** Fixed-motion card preview for not-yet-parametrized presets. */
function FixedPreview({ presetId }: { presetId: AnimationPresetId }) {
  const ref = React.useRef<HTMLDivElement>(null);
  useWaapiAnimation(ref, presetId, 50, 50, 50);
  return <MiniFrame animRef={ref} />;
}

function PresetCardPreview({ presetId }: { presetId: AnimationPresetId }) {
  return presetId === 'slow-zoom' ? <SlowZoomPreview /> : <FixedPreview presetId={presetId} />;
}

/** One labelled slider with end-captions (e.g. Slow ↔ Fast). */
function ParamSlider({
  icon,
  label,
  lo,
  hi,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  lo: string;
  hi: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs font-medium">
        <span className="text-muted-foreground">{icon}</span>
        {label}
        <span className="text-muted-foreground ml-auto font-mono tabular-nums">{value}</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={(v: number[]) => onChange(v[0]!)}
        min={0}
        max={100}
        step={1}
        aria-label={label}
      />
      <div className="text-muted-foreground flex justify-between text-[10px]">
        <span>{lo}</span>
        <span>{hi}</span>
      </div>
    </div>
  );
}

/**
 * CapCut-style motion picker: a horizontal row of looping preset previews, then
 * three sliders (Speed / Intensity / Smoothness) that tune the selected preset
 * and update the live preview in real time. Only Slow Zoom is slider-wired for
 * now; the rest show their motion but aren't selectable yet.
 */
export function AnimationPanel({ canAnimate }: { canAnimate: boolean }) {
  const preset = useEditorStore((s) => s.animPreset);
  const setPreset = useEditorStore((s) => s.setAnimPreset);
  const speed = useEditorStore((s) => s.animSpeed);
  const intensity = useEditorStore((s) => s.animIntensity);
  const smoothness = useEditorStore((s) => s.animSmoothness);
  const setSpeed = useEditorStore((s) => s.setAnimSpeed);
  const setIntensity = useEditorStore((s) => s.setAnimIntensity);
  const setSmoothness = useEditorStore((s) => s.setAnimSmoothness);

  const selectedMeta = ANIMATION_PRESETS.find((p) => p.id === preset) ?? null;

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-xs">
        Pick a motion to animate your mockup. The preview loops live — drag the sliders to tune it.
      </p>

      {/* Horizontal, snapping card row. */}
      <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1">
        {/* None / static. */}
        <button
          type="button"
          onClick={() => setPreset(null)}
          className={cn(
            'flex w-[120px] shrink-0 snap-start flex-col gap-1.5 rounded-lg border p-1.5 text-left transition-all',
            preset === null
              ? 'border-brand ring-brand/30 ring-2'
              : 'hover:border-muted-foreground/40 bg-card/40 border-transparent',
          )}
        >
          <div className="text-muted-foreground grid h-[70px] w-full place-items-center rounded-md bg-neutral-900/40 text-xs">
            No motion
          </div>
          <span className="px-1 text-xs font-medium">None</span>
        </button>

        {ANIMATION_PRESETS.map((p) => {
          const active = preset === p.id;
          const selectable = p.enabled;
          return (
            <button
              key={p.id}
              type="button"
              disabled={!selectable}
              onClick={() => selectable && setPreset(p.id)}
              title={selectable ? p.description : `${p.name} — coming soon`}
              className={cn(
                'relative flex w-[120px] shrink-0 snap-start flex-col gap-1.5 rounded-lg border p-1.5 text-left transition-all',
                active
                  ? 'border-brand ring-brand/30 ring-2'
                  : 'hover:border-muted-foreground/40 bg-card/40 border-transparent',
                !selectable && 'cursor-not-allowed opacity-70',
              )}
            >
              <PresetCardPreview presetId={p.id} />
              <span className="flex items-center justify-between px-1 text-xs font-medium">
                {p.name}
                {!selectable && (
                  <span className="bg-muted text-muted-foreground rounded px-1 py-0.5 text-[9px] font-semibold uppercase">
                    Soon
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Sliders — shown once a (wired) preset is selected. */}
      {selectedMeta?.enabled && (
        <div className="bg-card/40 space-y-4 rounded-lg border p-3">
          <div className="text-xs font-semibold">{selectedMeta.name}</div>
          <ParamSlider
            icon={<Gauge className="size-3.5" />}
            label="Speed"
            lo="Slow"
            hi="Fast"
            value={speed}
            onChange={setSpeed}
          />
          <ParamSlider
            icon={<Zap className="size-3.5" />}
            label="Intensity"
            lo="Subtle"
            hi="Dramatic"
            value={intensity}
            onChange={setIntensity}
          />
          <ParamSlider
            icon={<Waves className="size-3.5" />}
            label="Smoothness"
            lo="Snappy"
            hi="Floaty"
            value={smoothness}
            onChange={setSmoothness}
          />
        </div>
      )}

      {/* Honest status: the preview is live; animated export is the next step. */}
      {preset !== null &&
        (canAnimate ? (
          <p className="text-muted-foreground text-[11px]">
            Live preview only for now — animated <strong>MP4/GIF export</strong> is being wired into
            the render pipeline next.
          </p>
        ) : (
          <div className="text-muted-foreground space-y-2 text-[11px]">
            <p>Preview is free to explore. Animated export will be a Pro feature.</p>
            <Button variant="brand" size="sm" asChild>
              <Link href="/pricing">
                <Sparkles className="size-4" /> Upgrade to Pro
              </Link>
            </Button>
          </div>
        ))}
    </div>
  );
}
