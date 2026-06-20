'use client';

import * as React from 'react';
import { Plus, X } from 'lucide-react';

import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

const MAX_STOPS = 4;
const MIN_STOPS = 2;

/**
 * A compact custom-gradient builder: pick 2–4 colors and an angle. Mirrors the
 * worker's linear-gradient rendering so the preview matches the export.
 */
export function GradientBuilder({
  value,
  onChange,
}: {
  value: { colors: string[]; angle: number };
  onChange: (g: { colors: string[]; angle: number }) => void;
}) {
  const { colors, angle } = value;

  function setColor(i: number, c: string) {
    const next = colors.slice();
    next[i] = c;
    onChange({ colors: next, angle });
  }
  function addColor() {
    if (colors.length >= MAX_STOPS) return;
    onChange({ colors: [...colors, '#ffffff'], angle });
  }
  function removeColor(i: number) {
    if (colors.length <= MIN_STOPS) return;
    onChange({ colors: colors.filter((_, idx) => idx !== i), angle });
  }

  const css = `linear-gradient(${angle}deg, ${colors.join(', ')})`;

  return (
    <div className="space-y-3">
      <div className="h-12 w-full rounded-lg border" style={{ background: css }} />

      <div className="flex flex-wrap items-center gap-2">
        {colors.map((c, i) => (
          <div key={i} className="relative">
            <input
              type="color"
              value={c}
              onChange={(e) => setColor(i, e.target.value)}
              aria-label={`Color ${i + 1}`}
              className="size-9 cursor-pointer rounded-md border bg-transparent p-0.5"
            />
            {colors.length > MIN_STOPS && (
              <button
                type="button"
                aria-label="Remove color"
                onClick={() => removeColor(i)}
                className="bg-background text-muted-foreground hover:text-destructive absolute -right-1.5 -top-1.5 grid size-4 place-items-center rounded-full border"
              >
                <X className="size-2.5" />
              </button>
            )}
          </div>
        ))}
        {colors.length < MAX_STOPS && (
          <button
            type="button"
            onClick={addColor}
            aria-label="Add color"
            className={cn(
              'text-muted-foreground hover:text-foreground grid size-9 place-items-center rounded-md border border-dashed',
            )}
          >
            <Plus className="size-4" />
          </button>
        )}
      </div>

      <div className="space-y-1">
        <div className="text-muted-foreground flex items-center justify-between text-xs">
          <span>Angle</span>
          <span className="font-mono tabular-nums">{angle}°</span>
        </div>
        <Slider
          value={[angle]}
          onValueChange={(v: number[]) => onChange({ colors, angle: v[0] })}
          min={0}
          max={360}
          step={5}
          aria-label="Gradient angle"
        />
      </div>
    </div>
  );
}
