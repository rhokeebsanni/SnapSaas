'use client';

import * as React from 'react';

import { AnimatedNumber } from '@/components/motion/animated-number';
import { cn } from '@/lib/utils';

/**
 * A lively dashboard stat tile: gradient icon chip, an animated count-up value,
 * a subtle hover lift, and a soft brand glow on hover. Numeric values animate;
 * string values (e.g. "3×", "Unlimited") render as-is.
 */
export function StatCard({
  icon,
  label,
  value,
  hint,
  accent = 'brand',
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  hint?: string;
  accent?: 'brand' | 'teal' | 'amber';
}) {
  const accents: Record<string, string> = {
    brand: 'from-brand/20 to-brand-2/10 text-brand',
    teal: 'from-teal-500/20 to-cyan-500/10 text-teal-400',
    amber: 'from-amber-500/20 to-orange-500/10 text-amber-400',
  };

  return (
    <div
      className={cn(
        'bg-card group relative overflow-hidden rounded-xl border p-5 transition-all duration-300',
        'dark:bg-card/70 hover:-translate-y-0.5 hover:shadow-lg dark:backdrop-blur-sm',
      )}
    >
      {/* Hover glow */}
      <div className="from-brand/10 pointer-events-none absolute -right-8 -top-8 size-24 rounded-full bg-gradient-to-br to-transparent opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />

      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm font-medium">{label}</p>
        <span
          className={cn(
            'grid size-9 place-items-center rounded-lg bg-gradient-to-br',
            accents[accent],
          )}
        >
          {icon}
        </span>
      </div>

      <p className="mt-3 text-3xl font-bold tracking-tight">
        {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
      </p>
      {hint && <p className="text-muted-foreground mt-1 text-xs">{hint}</p>}
    </div>
  );
}
