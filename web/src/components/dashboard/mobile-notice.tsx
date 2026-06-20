'use client';

import * as React from 'react';
import { Monitor, X } from 'lucide-react';

const DISMISS_KEY = 'snapsaas:mobile-notice-dismissed';

/**
 * A gentle, dismissible heads-up shown only on narrow screens: the editor is
 * built for a desktop-sized canvas. Hidden on lg+ and remembered once dismissed.
 */
export function MobileNotice() {
  // Re-render once mounted so we can safely read localStorage (avoids hydration
  // mismatch) without calling setState inside an effect.
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [dismissed, setDismissed] = React.useState(false);

  if (!mounted || dismissed) return null;
  if (typeof window !== 'undefined' && window.localStorage.getItem(DISMISS_KEY) === '1')
    return null;

  return (
    <div className="bg-muted/40 relative mb-4 flex items-start gap-3 rounded-xl border p-3 text-sm lg:hidden">
      <Monitor className="text-brand mt-0.5 size-4 shrink-0" />
      <p className="text-muted-foreground pr-6">
        The editor is best on a <span className="text-foreground font-medium">larger screen</span> —
        widen this window (or use a desktop) for room to see the live preview alongside the
        controls.
      </p>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => {
          window.localStorage.setItem(DISMISS_KEY, '1');
          setDismissed(true);
        }}
        className="text-muted-foreground hover:text-foreground absolute right-2 top-2 rounded p-1"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
