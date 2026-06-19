'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { track } from '@vercel/analytics';
import { Download, ImageOff, LoaderCircle, RotateCcw, Sparkles, Wand2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { LivePreview } from '@/components/editor/live-preview';
import { Segmented } from '@/components/editor/segmented';
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

export function Editor({
  maxScale,
  allTemplates,
  initialUrl,
}: {
  maxScale: OutputScale;
  allTemplates: boolean;
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
  const shownAsset = s.assets.find((a) => a.format === s.format) ?? s.assets[0] ?? null;
  // The browser frame is the only one with chrome styling.
  const showWindowStyle = s.frame === 'browser';

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      {/* Controls */}
      <div className="space-y-6">
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

        <Control label="Frame">
          <Segmented
            value={s.frame}
            onChange={s.setFrame}
            options={FRAMES.map((f) => ({ value: f.id, label: f.name }))}
          />
        </Control>

        <Control label="Background">
          <div className="grid grid-cols-4 gap-2">
            {BACKGROUNDS.map((b) => {
              const locked = b.tier === 'pro' && !allTemplates;
              const active = b.id === s.background;
              return (
                <button
                  key={b.id}
                  type="button"
                  title={locked ? `${b.name} (Pro)` : b.name}
                  disabled={locked}
                  onClick={() => s.setBackground(b.id)}
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
        </Control>

        <Control label="Page">
          <Segmented
            value={s.mode}
            onChange={s.setMode}
            options={[
              { value: 'viewport', label: 'Viewport' },
              { value: 'full', label: 'Full page' },
            ]}
          />
        </Control>

        <Control label="Resolution">
          <Segmented
            value={s.scale}
            onChange={(v) => s.setScale(v)}
            options={([1, 2, 3] as OutputScale[]).map((n) => ({
              value: n,
              label: `${n}×`,
              locked: n > maxScale,
            }))}
          />
        </Control>

        <Control label="Padding">
          <Segmented
            value={s.padding}
            onChange={s.setPadding}
            options={PADDING_PRESETS.map((p) => ({ value: p.value as number, label: p.label }))}
          />
        </Control>

        <Control label="Shadow">
          <Segmented value={s.shadow} onChange={s.setShadow} options={SHADOW_OPTIONS} />
        </Control>

        <Control label="3D tilt">
          <Segmented value={s.tilt} onChange={s.setTilt} options={TILT_OPTIONS} />
        </Control>

        {showWindowStyle && (
          <Control label="Window">
            <Segmented value={s.windowStyle} onChange={s.setWindowStyle} options={WINDOW_OPTIONS} />
          </Control>
        )}

        <Control label="Glow">
          <button
            type="button"
            role="switch"
            aria-checked={s.glow}
            onClick={() => s.setGlow(!s.glow)}
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

        <Control label="Download format">
          <Segmented value={s.format} onChange={s.setFormat} options={FORMAT_OPTIONS} />
        </Control>
      </div>

      {/* Preview */}
      <div className="space-y-4">
        <div className="bg-muted/30 relative grid min-h-[420px] place-items-center overflow-hidden rounded-2xl border p-6">
          {shownAsset && s.status === 'done' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shownAsset.url}
              alt="Generated screenshot"
              className="max-h-[70vh] w-auto max-w-full rounded-lg shadow-lg"
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
            <div className="w-full max-w-xl">
              <LivePreview
                url={s.url}
                frame={s.frame}
                background={s.background}
                padding={s.padding}
                shadow={s.shadow}
                glow={s.glow}
                tilt={s.tilt}
                windowStyle={s.windowStyle}
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

function Control({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div>{children}</div>
    </div>
  );
}
