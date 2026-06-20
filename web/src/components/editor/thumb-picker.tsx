'use client';

import * as React from 'react';
import { Lock } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface ThumbOption<T extends string | number> {
  value: T;
  label: string;
  /** A small visual representation of the option (rendered inside the tile). */
  preview: React.ReactNode;
  locked?: boolean;
}

/**
 * A visual option picker (shots.so-style): each choice is a little preview tile
 * showing how it looks, with a label underneath, instead of a word or number.
 */
export function ThumbPicker<T extends string | number>({
  options,
  value,
  onChange,
  columns = 3,
  className,
}: {
  options: ThumbOption<T>[];
  value: T;
  onChange: (value: T) => void;
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const cols = { 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4' }[columns];
  return (
    <div className={cn('grid gap-2', cols, className)}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            disabled={opt.locked}
            aria-pressed={active}
            title={opt.locked ? `${opt.label} (Pro)` : opt.label}
            onClick={() => !opt.locked && onChange(opt.value)}
            className={cn(
              'focus-visible:ring-brand/50 group relative flex flex-col items-center gap-1.5 rounded-lg border p-2 transition-all focus-visible:outline-none focus-visible:ring-2',
              active
                ? 'border-brand/60 ring-brand/30 ring-2'
                : 'hover:border-foreground/20 border-transparent',
              opt.locked && 'cursor-not-allowed opacity-50',
            )}
          >
            <span className="bg-muted/40 grid aspect-[4/3] w-full place-items-center overflow-hidden rounded-md border">
              {opt.preview}
            </span>
            <span
              className={cn(
                'flex items-center gap-1 text-xs font-medium',
                active ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {opt.label}
              {opt.locked && <Lock className="size-3" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
