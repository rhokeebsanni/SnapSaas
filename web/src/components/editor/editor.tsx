'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { track } from '@vercel/analytics';
import {
  ChevronDown,
  Download,
  ImageOff,
  LoaderCircle,
  RotateCcw,
  Sparkles,
  Wand2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { LivePreview } from '@/components/editor/live-preview';
import { PreflightStatus } from '@/components/editor/preflight-status';
import { TemplateGallery } from '@/components/editor/template-gallery';
import { GradientBuilder } from '@/components/editor/gradient-builder';
import { Segmented } from '@/components/editor/segmented';
import { ThumbPicker } from '@/components/editor/thumb-picker';
import { FrameThumb, ShadowThumb, TiltThumb, WindowThumb } from '@/components/editor/thumbs';
import { Slider } from '@/components/ui/slider';
import { BACKGROUNDS, FRAMES, PADDING_PRESETS } from '@/lib/templates';
import { useEditorStore } from '@/store/editor';
import { downloadAsset } from '@/lib/download';
import type {
  OutputFormat,
  OutputScale,
  ShadowPreset,
  TiltPreset,
  WindowStyle,
} from '@/lib/capture';
import { cn } from '@/lib/utils';

const FORMAT_OPTIONS: { value: OutputFormat; label: string }[] = [
  { value: 'png', label: 'PNG' },
  { value: 'jpeg', label: 'JPG' },
  { value: 'webp', label: 'WebP' },
];

const SHADOW_OPTIONS: { value: ShadowPreset; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'soft', label: 'Soft' },
  { value: 'medium', label: 'Medium' },
  { value: 'dramatic', label: 'Bold' },
];

const TILT_OPTIONS: { value: TiltPreset; label: string }[] = [
  { value: 'none', label: 'Flat' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
];

const WINDOW_OPTIONS: { value: WindowStyle; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

// Plain-language names + explanations for the export scale, so "1×/2×/3×"
// jargon doesn't trip people up.
const SCALE_LABEL: Record<OutputScale, string> = {
  1: 'Standard',
  2: 'Sharp',
  3: 'Ultra',
};

const SCALE_HINT: Record<OutputScale, string> = {
  1: 'Standard (1×) — crisp on screen; good for social posts and previews.',
  2: 'Sharp (2×) — retina-quality, twice the pixels. Best for most uses.',
  3: 'Ultra (3×) — maximum detail for print and large displays. Bigger files.',
};

/** Keep custom output dimensions within the worker's accepted range. */
function clampSize(v: number): number {
  if (!Number.isFinite(v)) return 200;
  return Math.min(4000, Math.max(200, Math.round(v)));
}

export function Editor({
  maxScale,
  allTemplates,
  watermark,
  initialUrl,
}: {
  maxScale: OutputScale;
  allTemplates: boolean;
  watermark: boolean;
  initialUrl?: string;
}) {
  const s = useEditorStore();
  const router = useRouter();

  React.useEffect(() => {
    if (initialUrl) s.setUrl(initialUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUrl]);

  // When a run settles, re-sync server state (the credits badge reflects the
  // spend on success, and the refund when a capture fails).
  React.useEffect(() => {
    if (s.status === 'done' || s.status === 'failed') router.refresh();
  }, [s.status, router]);

  const runGenerate = React.useCallback(() => {
    const st = useEditorStore.getState();
    if (st.status === 'submitting' || st.status === 'queued' || st.status === 'processing') return;
    track('capture_started', { frame: st.frame, background: st.background });
    void st.generate();
  }, []);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        runGenerate();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [runGenerate]);

  const busy = s.status === 'submitting' || s.status === 'queued' || s.status === 'processing';
  const isDone = s.status === 'done';
  const customSize = s.outputWidth !== null || s.outputHeight !== null;
  // Show a first batch of backgrounds, then a "show more" — keeps the panel short.
  const [showAllBg, setShowAllBg] = React.useState(false);
  const BG_COLLAPSED = 8;
  const shownBackgrounds = showAllBg ? BACKGROUNDS : BACKGROUNDS.slice(0, BG_COLLAPSED);
  const shownAsset = s.assets.find((a) => a.format === s.format) ?? s.assets[0] ?? null;
  // The browser frame is the only one with chrome styling.
  const showWindowStyle = s.frame === 'browser';

  // After a result is shown, editing a *visual* setting drops back to the live
  // preview so the change is visible immediately (and invites a re-generate).
  // Wraps a setter; `format` is intentionally NOT wrapped — it just switches
  // which already-rendered asset is shown.
  function onEdit<T>(setter: (v: T) => void) {
    return (v: T) => {
      if (useEditorStore.getState().status === 'done') s.reset();
      setter(v);
    };
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      {/* Controls */}
      <div className="space-y-6">
        <PreflightStatus />

        <form
          onSubmit={(e) => {
            e.preventDefault();
            runGenerate();
          }}
          className="space-y-2"
        >
          <Label htmlFor="capture-url">Website URL</Label>
          <div className="flex gap-2">
            <Input
              id="capture-url"
              value={s.url}
              onChange={(e) => s.setUrl(e.target.value)}
              placeholder="yoursite.com"
              inputMode="url"
              autoComplete="url"
            />
            <Button type="submit" variant="brand" disabled={busy} className="shrink-0">
              {busy ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Wand2 className="size-4" />
              )}
              Generate
            </Button>
          </div>
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
            Tip: press
            <kbd className="bg-muted rounded border px-1.5 py-0.5 font-mono text-[10px]">
              ⌘ / Ctrl
            </kbd>
            <kbd className="bg-muted rounded border px-1.5 py-0.5 font-mono text-[10px]">Enter</kbd>
            to generate.
          </p>
        </form>

        <Control label="Templates" hint="One-click looks — a great starting point.">
          <TemplateGallery allTemplates={allTemplates} columns={3} collapsedCount={6} />
        </Control>

        <Control label="Frame">
          <ThumbPicker
            value={s.frame}
            onChange={onEdit(s.setFrame)}
            columns={3}
            options={FRAMES.map((f) => ({
              value: f.id,
              label: f.name,
              preview: <FrameThumb frame={f.id} />,
            }))}
          />
        </Control>

        <Control
          label="Background"
          hint={
            s.background === 'custom'
              ? 'Custom gradient'
              : BACKGROUNDS.find((b) => b.id === s.background)?.name
          }
        >
          <div className="grid grid-cols-4 gap-2">
            {/* Custom gradient tile — always first. */}
            <button
              type="button"
              title="Custom gradient"
              onClick={() => onEdit(s.setBackground)('custom')}
              style={{
                background: `linear-gradient(${s.customGradient.angle}deg, ${s.customGradient.colors.join(', ')})`,
              }}
              className={cn(
                'relative grid aspect-square place-items-center rounded-lg border transition-all',
                s.background === 'custom' &&
                  'ring-brand ring-offset-background ring-2 ring-offset-2',
              )}
            >
              <Wand2 className="size-4 text-white drop-shadow" />
            </button>
            {shownBackgrounds.map((b) => {
              const locked = b.tier === 'pro' && !allTemplates;
              const active = b.id === s.background;
              return (
                <button
                  key={b.id}
                  type="button"
                  title={locked ? `${b.name} (Pro)` : b.name}
                  disabled={locked}
                  onClick={() => onEdit(s.setBackground)(b.id)}
                  style={{ background: b.css }}
                  className={cn(
                    'relative aspect-square rounded-lg border transition-all',
                    active && 'ring-brand ring-offset-background ring-2 ring-offset-2',
                    locked && 'cursor-not-allowed opacity-50',
                  )}
                >
                  {locked && (
                    <span className="absolute inset-0 grid place-items-center text-[10px] font-semibold text-white drop-shadow">
                      PRO
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {BACKGROUNDS.length > BG_COLLAPSED && (
            <button
              type="button"
              onClick={() => setShowAllBg((v) => !v)}
              className="text-muted-foreground hover:text-foreground mt-2 flex w-full items-center justify-center gap-1 text-xs font-medium"
            >
              {showAllBg ? 'Show fewer' : `Show ${BACKGROUNDS.length - BG_COLLAPSED} more`}
              <ChevronDown
                className={cn('size-3.5 transition-transform', showAllBg && 'rotate-180')}
              />
            </button>
          )}
          {s.background === 'custom' && (
            <div className="mt-3">
              <GradientBuilder
                value={s.customGradient}
                onChange={(g) => {
                  if (s.status === 'done') s.reset();
                  s.setCustomGradient(g);
                }}
              />
            </div>
          )}
        </Control>

        <Control label="Page">
          <Segmented
            value={s.mode}
            onChange={onEdit(s.setMode)}
            options={[
              { value: 'viewport', label: 'Viewport' },
              { value: 'full', label: 'Full page' },
            ]}
          />
        </Control>

        {s.mode === 'viewport' && (
          <Control
            label="Capture from"
            hint="Scroll down this many pixels before capturing — to frame a section further down the page."
          >
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={20000}
                step={100}
                value={s.scrollY}
                onChange={(e) => onEdit(s.setScrollY)(Math.max(0, Number(e.target.value) || 0))}
                className="w-28"
              />
              <span className="text-muted-foreground text-sm">px from top</span>
            </div>
          </Control>
        )}

        <Control label="Image quality" hint={SCALE_HINT[s.scale]}>
          <Segmented
            value={s.scale}
            onChange={onEdit(s.setScale)}
            options={([1, 2, 3] as OutputScale[]).map((n) => ({
              value: n,
              label: SCALE_LABEL[n],
              locked: n > maxScale,
            }))}
          />
        </Control>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Padding</Label>
            <span className="text-muted-foreground font-mono text-xs tabular-nums">
              {s.padding}px
            </span>
          </div>
          {/* Quick presets… */}
          <Segmented
            value={PADDING_PRESETS.some((p) => p.value === s.padding) ? s.padding : -1}
            onChange={(v) => onEdit(s.setPadding)(v as number)}
            options={[
              ...PADDING_PRESETS.map((p) => ({ value: p.value as number, label: p.label })),
              { value: -1, label: 'Custom', locked: true },
            ]}
          />
          {/* …and a slider for anything in between. */}
          <Slider
            value={[s.padding]}
            onValueChange={(values: number[]) => onEdit(s.setPadding)(values[0])}
            min={0}
            max={400}
            step={4}
            aria-label="Padding"
            className="pt-1"
          />
        </div>

        <Control label="Shadow">
          <ThumbPicker
            value={s.shadow}
            onChange={onEdit(s.setShadow)}
            columns={4}
            options={SHADOW_OPTIONS.map((o) => ({
              ...o,
              preview: <ShadowThumb shadow={o.value} />,
            }))}
          />
        </Control>

        <Control label="3D tilt">
          <ThumbPicker
            value={s.tilt}
            onChange={onEdit(s.setTilt)}
            columns={3}
            options={TILT_OPTIONS.map((o) => ({
              ...o,
              preview: <TiltThumb tilt={o.value} />,
            }))}
          />
        </Control>

        {showWindowStyle && (
          <Control label="Window">
            <ThumbPicker
              value={s.windowStyle}
              onChange={onEdit(s.setWindowStyle)}
              columns={2}
              options={WINDOW_OPTIONS.map((o) => ({
                ...o,
                preview: <WindowThumb style={o.value} />,
              }))}
            />
          </Control>
        )}

        <Control label="Glow">
          <button
            type="button"
            role="switch"
            aria-checked={s.glow}
            onClick={() => onEdit(s.setGlow)(!s.glow)}
            className={cn(
              'relative inline-flex h-7 w-12 items-center rounded-full border transition-colors',
              s.glow ? 'bg-brand border-brand' : 'bg-muted/40',
            )}
          >
            <span
              className={cn(
                'inline-block size-5 rounded-full bg-white shadow transition-transform',
                s.glow ? 'translate-x-6' : 'translate-x-1',
              )}
            />
          </button>
        </Control>

        <Control
          label="Output size"
          hint="By default the size comes from the frame + padding. Turn on to set exact dimensions — the composition is fit inside without stretching."
        >
          <div className="space-y-2">
            <Segmented
              value={customSize ? 'custom' : 'auto'}
              onChange={(v) => {
                if (v === 'auto') {
                  onEdit(s.setOutputWidth)(null);
                  onEdit(s.setOutputHeight)(null);
                } else {
                  // Seed with sensible defaults when switching to custom.
                  onEdit(s.setOutputWidth)(s.outputWidth ?? 1280);
                  onEdit(s.setOutputHeight)(s.outputHeight ?? 800);
                }
              }}
              options={[
                { value: 'auto', label: 'Auto' },
                { value: 'custom', label: 'Custom' },
              ]}
            />
            {customSize && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={200}
                  max={4000}
                  step={10}
                  aria-label="Output width"
                  value={s.outputWidth ?? 1280}
                  onChange={(e) => onEdit(s.setOutputWidth)(clampSize(Number(e.target.value)))}
                  className="w-24"
                />
                <span className="text-muted-foreground text-sm">×</span>
                <Input
                  type="number"
                  min={200}
                  max={4000}
                  step={10}
                  aria-label="Output height"
                  value={s.outputHeight ?? 800}
                  onChange={(e) => onEdit(s.setOutputHeight)(clampSize(Number(e.target.value)))}
                  className="w-24"
                />
                <span className="text-muted-foreground text-sm">px</span>
              </div>
            )}
          </div>
        </Control>

        <Control label="Download format">
          <Segmented value={s.format} onChange={s.setFormat} options={FORMAT_OPTIONS} />
        </Control>
      </div>

      {/* Preview — pinned in view so changes are visible without scrolling. */}
      <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div
          className={cn(
            'bg-muted/30 relative grid place-items-center overflow-hidden rounded-2xl border p-6',
            // A definite height at every breakpoint so the (height-bound) iPhone
            // preview always has something to fit into and never clips. On desktop
            // we fill the viewport; once a result is shown we cap it so the
            // download bar below stays on screen.
            'h-[55vh] min-h-[360px]',
            isDone ? 'lg:h-auto lg:max-h-[calc(100dvh-12rem)]' : 'lg:h-[calc(100dvh-7rem)]',
          )}
        >
          {shownAsset && s.status === 'done' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shownAsset.url}
              alt="Generated screenshot"
              className="max-h-full w-auto max-w-full rounded-lg shadow-lg"
            />
          ) : s.status === 'failed' ? (
            <div className="text-muted-foreground flex flex-col items-center gap-2 text-center">
              <ImageOff className="size-8" />
              <p className="max-w-xs text-sm">{s.error ?? 'Something went wrong.'}</p>
              <Button variant="outline" size="sm" onClick={s.reset}>
                Try again
              </Button>
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <LivePreview
                url={s.url}
                frame={s.frame}
                background={s.background}
                padding={s.padding}
                shadow={s.shadow}
                glow={s.glow}
                tilt={s.tilt}
                windowStyle={s.windowStyle}
                watermark={watermark}
                customGradient={s.background === 'custom' ? s.customGradient : undefined}
              />
            </div>
          )}

          {busy && (
            <div className="bg-background/50 absolute inset-0 grid place-items-center backdrop-blur-sm">
              <div className="bg-background flex items-center gap-2 rounded-full border px-4 py-2 text-sm shadow-lg">
                <LoaderCircle className="text-brand size-4 animate-spin" />
                {s.status === 'processing' ? 'Rendering…' : 'Capturing your site…'}
              </div>
            </div>
          )}
        </div>

        {s.status === 'done' && shownAsset && (
          <div className="bg-card flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              {shownAsset.hasWatermark ? (
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="size-3" /> Watermarked —{' '}
                  <Link href="/#pricing" className="underline">
                    upgrade to remove
                  </Link>
                </Badge>
              ) : (
                <span>
                  {shownAsset.width}×{shownAsset.height}px
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {s.assets.map((a) => (
                <Button
                  key={a.id}
                  variant={a.format === s.format ? 'brand' : 'outline'}
                  size="sm"
                  onClick={() =>
                    downloadAsset(
                      a.url,
                      `snapsaas-${s.frame}.${a.format === 'jpeg' ? 'jpg' : a.format}`,
                    )
                  }
                >
                  <Download className="size-4" />
                  {a.format.toUpperCase()}
                </Button>
              ))}
              <Button variant="ghost" size="sm" onClick={s.reset}>
                <RotateCcw className="size-4" /> New
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Control({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div>{children}</div>
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  );
}
