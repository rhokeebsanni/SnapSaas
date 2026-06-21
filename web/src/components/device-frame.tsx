import * as React from 'react';

import { cn } from '@/lib/utils';

export type FrameVariant = 'browser' | 'iphone' | 'macbook';

interface DeviceFrameProps extends React.ComponentProps<'div'> {
  variant?: FrameVariant;
  /** Address bar label for the browser frame. */
  url?: string;
  /** Browser chrome styling (browser variant only). */
  windowStyle?: 'light' | 'dark' | 'glass' | 'glass-dark' | 'inset' | 'inset-dark';
  children?: React.ReactNode;
}

/**
 * Pure-CSS device chrome used to wrap a screenshot (or a mock). The same
 * component powers the marketing gallery and the editor preview so the framing
 * language stays consistent across the product.
 */
export function DeviceFrame({
  variant = 'browser',
  url = 'yoursite.com',
  windowStyle = 'light',
  className,
  children,
  ...props
}: DeviceFrameProps) {
  if (variant === 'iphone') {
    return (
      <div
        className={cn(
          // Aspect ratio is locked; the caller decides whether it's sized by
          // width (w-full) or height (h-full w-auto). Default keeps the old
          // width-driven sizing for the marketing pages.
          'relative mx-auto aspect-[9/19] w-full max-w-[260px] rounded-[2.5rem] border-[6px] border-neutral-800 bg-neutral-800 shadow-2xl',
          className,
        )}
        {...props}
      >
        <div className="absolute left-1/2 top-2.5 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-neutral-900" />
        <div className="bg-background h-full w-full overflow-hidden rounded-[2rem]">{children}</div>
      </div>
    );
  }

  if (variant === 'macbook') {
    return (
      <div className={cn('mx-auto w-full max-w-2xl', className)} {...props}>
        <div className="rounded-t-xl border-[10px] border-b-0 border-neutral-800 bg-neutral-800 shadow-2xl">
          <div className="bg-background aspect-[16/10] w-full overflow-hidden rounded-md">
            {children}
          </div>
        </div>
        {/* Laptop base */}
        <div className="relative h-3 rounded-b-xl bg-gradient-to-b from-neutral-700 to-neutral-800">
          <div className="absolute left-1/2 top-0 h-1.5 w-20 -translate-x-1/2 rounded-b-lg bg-neutral-900/80" />
        </div>
      </div>
    );
  }

  // Default: browser window chrome.
  const dark =
    windowStyle === 'dark' || windowStyle === 'glass-dark' || windowStyle === 'inset-dark';
  const glass = windowStyle === 'glass' || windowStyle === 'glass-dark';
  const inset = windowStyle === 'inset' || windowStyle === 'inset-dark';

  // Inset: no toolbar — the screenshot is matted inside a colored card.
  if (inset) {
    return (
      <div
        className={cn(
          'overflow-hidden rounded-xl border p-2.5 shadow-2xl ring-1 ring-black/5',
          dark ? 'border-neutral-800 bg-neutral-900' : 'border-neutral-200 bg-white',
          className,
        )}
        {...props}
      >
        <div className="bg-background aspect-[16/10] w-full overflow-hidden rounded-lg">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border shadow-2xl ring-1 ring-black/5',
        glass
          ? dark
            ? 'border-white/10 bg-neutral-900/50 backdrop-blur-md'
            : 'border-white/40 bg-white/40 backdrop-blur-md'
          : dark
            ? 'border-neutral-700 bg-neutral-900'
            : 'bg-card',
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          'flex items-center gap-2 border-b px-3 py-2.5',
          glass
            ? dark
              ? 'border-white/10 bg-white/5'
              : 'border-white/30 bg-white/20'
            : dark
              ? 'border-neutral-700 bg-neutral-800'
              : 'bg-muted/60',
        )}
      >
        <div className="flex gap-1.5">
          <span className="size-3 rounded-full bg-red-400/80" />
          <span className="size-3 rounded-full bg-yellow-400/80" />
          <span className="size-3 rounded-full bg-green-400/80" />
        </div>
        <div
          className={cn(
            'mx-auto flex h-6 w-full max-w-sm items-center justify-center rounded-md px-3 text-xs',
            glass
              ? 'bg-white/20 text-white/80'
              : dark
                ? 'bg-neutral-950 text-neutral-400'
                : 'bg-background text-muted-foreground',
          )}
        >
          {url}
        </div>
      </div>
      <div className="bg-background aspect-[16/10] w-full overflow-hidden">{children}</div>
    </div>
  );
}

/**
 * A pleasant gradient "site" used as placeholder content inside frames on the
 * marketing pages, so we don't need to ship real screenshot assets.
 */
export function MockSite({ tone = 'violet' }: { tone?: 'violet' | 'teal' | 'amber' | 'rose' }) {
  const tones: Record<string, string> = {
    violet: 'from-violet-500/30 via-indigo-500/20 to-sky-500/30',
    teal: 'from-teal-500/30 via-emerald-500/20 to-cyan-500/30',
    amber: 'from-amber-500/30 via-orange-500/20 to-rose-500/30',
    rose: 'from-rose-500/30 via-pink-500/20 to-fuchsia-500/30',
  };

  return (
    <div className={cn('flex h-full w-full flex-col bg-gradient-to-br', tones[tone])}>
      <div className="flex items-center justify-between p-4">
        <div className="bg-foreground/30 h-3 w-16 rounded-full" />
        <div className="flex gap-2">
          <div className="bg-foreground/15 h-3 w-10 rounded-full" />
          <div className="bg-foreground/15 h-3 w-10 rounded-full" />
          <div className="bg-foreground/40 h-3 w-12 rounded-full" />
        </div>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="bg-foreground/40 h-5 w-3/4 rounded-full" />
        <div className="bg-foreground/20 h-3 w-1/2 rounded-full" />
        <div className="bg-foreground/70 mt-2 h-7 w-28 rounded-lg" />
      </div>
      <div className="grid grid-cols-3 gap-2 p-4">
        <div className="bg-foreground/10 h-10 rounded-lg" />
        <div className="bg-foreground/10 h-10 rounded-lg" />
        <div className="bg-foreground/10 h-10 rounded-lg" />
      </div>
    </div>
  );
}
