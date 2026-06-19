'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

/**
 * After returning from Lemon Squeezy checkout (`/dashboard?upgraded=1`), confirm
 * the upgrade and re-sync server state. The webhook updates the plan a moment
 * later, so we refresh once to pick it up. The session is untouched throughout.
 */
export function UpgradeToast() {
  const router = useRouter();
  const params = useSearchParams();
  const fired = React.useRef(false);

  React.useEffect(() => {
    if (fired.current) return;
    if (params.get('upgraded') !== '1') return;
    fired.current = true;

    toast.success('Welcome to your new plan! 🎉', {
      description: 'It may take a few seconds to reflect — refreshing now.',
    });

    // Drop the query param, then refresh server data to show the new plan.
    const url = new URL(window.location.href);
    url.searchParams.delete('upgraded');
    window.history.replaceState({}, '', url.toString());
    const t = setTimeout(() => router.refresh(), 2500);
    return () => clearTimeout(t);
  }, [params, router]);

  return null;
}
