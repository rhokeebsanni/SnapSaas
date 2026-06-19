'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * A card whose surface shows a soft brand glow that follows the cursor, plus a
 * gentle lift on hover. Premium without being noisy; the glow disabled-state is
 * just a normal card, so it degrades fine under reduced motion.
 */
export function SpotlightCard({ className, children, ...props }: React.ComponentProps<'div'>) {
  const ref = React.useRef<HTMLDivElement | null>(null);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    el.style.setProperty('--my', `${e.clientY - rect.top}px`);
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      className={cn(
        'spotlight elevate-hover bg-card relative h-full overflow-hidden rounded-2xl border',
        'dark:bg-card/70 dark:backdrop-blur-sm',
        className,
      )}
      {...props}
    >
      <div className="spotlight-glow" aria-hidden />
      <div className="relative">{children}</div>
    </div>
  );
}
