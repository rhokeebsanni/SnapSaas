'use client';

import * as React from 'react';
import { Monitor, X } from 'lucide-react';

const DISMISS_KEY = 'snapsaas:mobile-notice-dismissed';

/**
 * A gentle, dismissible heads-up shown only on narrow screens: the editor is
 * built for a desktop-sized canvas. Hidden on lg+ and remembered once dismissed.
 */
export function MobileNotice() {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.localStorage.getItem(DISMISS_KEY) === '1') return;
    setShow(true);
  }, []);

  if (!show) return null;

  return (
    <div className="bg-muted/40 relative mb-4 flex items-start gap-3 rounded-xl border p-3 text-sm lg:hidden">
      <Monitor className="text-brand mt-0.5 size-4 shrink-0" />
      <p className="text-muted-foreground pr-6">
        SnapSaas works on mobile, but the editor really shines on a{' '}
        <span className="text-foreground font-medium">desktop or laptop</span> — more room for the
        preview and controls.
      </p>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => {
          window.localStorage.setItem(DISMISS_KEY, '1');
          setShow(false);
        }}
        className="text-muted-foreground hover:text-foreground absolute right-2 top-2 rounded p-1"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
