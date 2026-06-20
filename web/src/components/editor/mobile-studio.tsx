'use client';

import * as React from 'react';
import { Download, LoaderCircle, Monitor, RotateCcw, Sparkles, Wand2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TemplateGallery } from '@/components/editor/template-gallery';
import { useEditorStore } from '@/store/editor';
import { downloadAsset } from '@/lib/download';

/**
 * The small-screen experience. A phone/narrow window can't comfortably show the
 * full studio (live preview + every control side-by-side), so instead of a
 * cramped editor we show a focused flow: paste a URL, pick a template, generate,
 * download — with a nudge that the full editor lives on a larger screen. Shares
 * the same store as the desktop studio.
 */
export function MobileStudio({ allTemplates }: { allTemplates: boolean }) {
  const s = useEditorStore();
  const busy = s.status === 'submitting' || s.status === 'queued' || s.status === 'processing';
  const shownAsset = s.assets.find((a) => a.format === s.format) ?? s.assets[0] ?? null;

  return (
    <div className="space-y-6 lg:hidden">
      <div className="from-brand/10 to-brand-2/5 rounded-2xl border bg-gradient-to-br p-5">
        <div className="text-brand flex items-center gap-2 text-sm font-medium">
          <Sparkles className="size-4" /> SnapSaas Studio
        </div>
        <h2 className="mt-1 text-xl font-bold tracking-tight">Make a gorgeous mockup</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Paste a URL and pick a look — we’ll capture and frame it for you.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!busy) void s.generate();
          }}
          className="mt-4 space-y-2"
        >
          <Label htmlFor="m-url" className="sr-only">
            Website URL
          </Label>
          <div className="flex gap-2">
            <Input
              id="m-url"
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
        </form>
      </div>

      {/* Result (when ready) */}
      {s.status === 'done' && shownAsset && (
        <div className="space-y-3">
          <div className="bg-muted/30 overflow-hidden rounded-2xl border p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={shownAsset.url}
              alt="Generated screenshot"
              className="mx-auto max-h-[50vh] w-auto rounded-lg shadow"
            />
          </div>
          <div className="flex flex-wrap gap-2">
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

      {/* Template showcase — the "what you can make" gallery. */}
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <h3 className="text-sm font-semibold">Pick a style</h3>
          <span className="text-muted-foreground text-xs">tap to apply</span>
        </div>
        <TemplateGallery allTemplates={allTemplates} columns={2} collapsedCount={6} />
      </div>

      <div className="text-muted-foreground flex items-start gap-2 rounded-xl border p-3 text-xs">
        <Monitor className="text-brand mt-0.5 size-4 shrink-0" />
        <p>
          This is the quick studio. Open SnapSaas on a{' '}
          <span className="text-foreground font-medium">larger screen</span> for the full editor — a
          live preview plus every frame, background, shadow, 3D tilt, and export control.
        </p>
      </div>
    </div>
  );
}
