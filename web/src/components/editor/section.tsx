'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * A collapsible group of editor controls. Keeps the (now long) controls column
 * tidy — open by default, click the header to collapse. Purely presentational.
 */
export function Section({
  title,
  icon,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <div className="bg-card/40 overflow-hidden rounded-xl border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="hover:bg-muted/40 flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold transition-colors"
      >
        {icon && <span className="text-muted-foreground">{icon}</span>}
        {title}
        <ChevronDown
          className={cn(
            'text-muted-foreground ml-auto size-4 transition-transform',
            !open && '-rotate-90',
          )}
        />
      </button>
      {open && <div className="space-y-5 px-4 pb-4 pt-1">{children}</div>}
    </div>
  );
}
