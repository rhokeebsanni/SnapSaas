'use client';

import * as React from 'react';
import Link from 'next/link';
import { Plus, Sparkles, Trash2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { useEditorStore } from '@/store/editor';
import { cn } from '@/lib/utils';

const MAX_FRAMES = 7; // extra frames beyond the main URL (8 total)

/**
 * Animation controls: turn the capture into an animated GIF slideshow built from
 * the main URL plus extra "frame" URLs, each captured with the same style. A
 * Pro feature — locked with an upgrade nudge otherwise.
 */
export function AnimateControls({ canAnimate }: { canAnimate: boolean }) {
  const s = useEditorStore();

  if (!canAnimate) {
    return (
      <div className="text-muted-foreground space-y-2 text-sm">
        <p>
          Turn several pages into one animated GIF — a slideshow that cycles through each capture.
        </p>
        <Button variant="brand" size="sm" asChild>
          <Link href="/pricing">
            <Sparkles className="size-4" /> Unlock animations with Pro
          </Link>
        </Button>
      </div>
    );
  }

  function setUrlAt(i: number, value: string) {
    const next = s.animationUrls.slice();
    next[i] = value;
    s.setAnimationUrls(next);
  }
  function addUrl() {
    if (s.animationUrls.length >= MAX_FRAMES) return;
    s.setAnimationUrls([...s.animationUrls, '']);
  }
  function removeUrl(i: number) {
    s.setAnimationUrls(s.animationUrls.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-4">
      <label className="flex items-center justify-between">
        <span className="text-sm font-medium">Animated GIF</span>
        <button
          type="button"
          role="switch"
          aria-checked={s.animate}
          onClick={() => s.setAnimate(!s.animate)}
          className={cn(
            'relative inline-flex h-7 w-12 items-center rounded-full border transition-colors',
            s.animate ? 'bg-brand border-brand' : 'bg-muted/40',
          )}
        >
          <span
            className={cn(
              'inline-block size-5 rounded-full bg-white shadow transition-transform',
              s.animate ? 'translate-x-6' : 'translate-x-1',
            )}
          />
        </button>
      </label>

      {s.animate && (
        <>
          <p className="text-muted-foreground text-xs">
            Each URL becomes a frame, captured with the style above. The main URL is frame 1.
          </p>

          {/* Frame 1 = main URL (read-only reference). */}
          <div className="flex items-center gap-2">
            <span className="bg-muted text-muted-foreground grid size-6 shrink-0 place-items-center rounded text-xs font-medium">
              1
            </span>
            <Input value={s.url || 'yoursite.com'} disabled className="opacity-70" />
          </div>

          {s.animationUrls.map((u, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="bg-muted text-muted-foreground grid size-6 shrink-0 place-items-center rounded text-xs font-medium">
                {i + 2}
              </span>
              <Input
                value={u}
                onChange={(e) => setUrlAt(i, e.target.value)}
                placeholder="another-page.com"
                inputMode="url"
              />
              <button
                type="button"
                aria-label="Remove frame"
                onClick={() => removeUrl(i)}
                className="text-muted-foreground hover:text-destructive shrink-0 rounded p-1.5"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}

          {s.animationUrls.length < MAX_FRAMES && (
            <Button variant="outline" size="sm" onClick={addUrl} className="w-full">
              <Plus className="size-4" /> Add frame
            </Button>
          )}

          <div className="space-y-1 pt-1">
            <div className="text-muted-foreground flex items-center justify-between text-xs">
              <span>Frame duration</span>
              <span className="font-mono tabular-nums">{(s.frameDuration / 1000).toFixed(1)}s</span>
            </div>
            <Slider
              value={[s.frameDuration]}
              onValueChange={(v: number[]) => s.setFrameDuration(v[0])}
              min={300}
              max={4000}
              step={100}
              aria-label="Frame duration"
            />
          </div>

          {s.animationUrls.filter((u) => u.trim()).length === 0 && (
            <p className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
              <X className="size-3.5" /> Add at least one more frame to animate.
            </p>
          )}
        </>
      )}
    </div>
  );
}
