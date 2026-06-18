'use client';

import { Lock } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface SegmentedOption<T extends string | number> {
  value: T;
  label: string;
  locked?: boolean;
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  className,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={cn('bg-muted/40 inline-flex flex-wrap gap-1 rounded-lg border p-1', className)}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            disabled={opt.locked}
            aria-pressed={active}
            onClick={() => !opt.locked && onChange(opt.value)}
            className={cn(
              'inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              active ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground',
              opt.locked && 'cursor-not-allowed opacity-50',
            )}
          >
            {opt.label}
            {opt.locked && <Lock className="size-3" />}
          </button>
        );
      })}
    </div>
  );
}
