'use client';

import * as React from 'react';
import { AlertTriangle, CheckCircle2, ChevronDown, LoaderCircle, XCircle } from 'lucide-react';

import { cn } from '@/lib/utils';

interface HealthChecks {
  database: boolean;
  queue: boolean;
  storage: boolean;
  workerReachable: boolean;
  workerConsumer: boolean;
}

interface Health {
  ready: boolean;
  checks: HealthChecks;
}

const LABELS: { key: keyof HealthChecks; label: string; fix: string }[] = [
  { key: 'database', label: 'Database', fix: 'Set DATABASE_URL (Neon).' },
  { key: 'queue', label: 'Job queue', fix: 'Set REDIS_URL (Upstash).' },
  { key: 'storage', label: 'Image storage', fix: 'Set the R2_* keys (Cloudflare R2).' },
  { key: 'workerReachable', label: 'Worker online', fix: 'Run the worker (npm run dev).' },
  {
    key: 'workerConsumer',
    label: 'Worker processing',
    fix: 'Worker needs DATABASE_URL + REDIS_URL.',
  },
];

/**
 * A self-checking preflight panel for the editor. It calls /api/health and, when
 * something needed for captures is missing, shows exactly which service so you
 * can tell config problems apart from "this site can't be captured." Stays
 * collapsed and quietly green when everything is ready.
 */
export function PreflightStatus() {
  const [health, setHealth] = React.useState<Health | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    fetch('/api/health', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Health | null) => {
        if (!active) return;
        setHealth(data);
        // Auto-expand when something needs attention.
        if (data && !data.ready) setOpen(true);
      })
      .catch(() => active && setHealth(null))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 rounded-lg border px-3 py-2 text-xs">
        <LoaderCircle className="size-3.5 animate-spin" />
        Checking capture services…
      </div>
    );
  }

  if (!health) return null;

  const ready = health.ready;

  return (
    <div
      className={cn(
        'rounded-lg border text-xs',
        ready ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/40 bg-amber-500/5',
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
        aria-expanded={open}
      >
        {ready ? (
          <CheckCircle2 className="size-4 text-emerald-500" />
        ) : (
          <AlertTriangle className="size-4 text-amber-500" />
        )}
        <span className="font-medium">
          {ready ? 'Capture services ready' : 'Captures aren’t fully set up'}
        </span>
        <ChevronDown className={cn('ml-auto size-4 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <ul className="space-y-1.5 border-t px-3 py-2">
          {LABELS.map(({ key, label, fix }) => {
            const ok = health.checks[key];
            return (
              <li key={key} className="flex items-start gap-2">
                {ok ? (
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                ) : (
                  <XCircle className="text-destructive mt-0.5 size-3.5 shrink-0" />
                )}
                <span className={cn(ok ? 'text-muted-foreground' : 'text-foreground')}>
                  {label}
                  {!ok && <span className="text-muted-foreground"> — {fix}</span>}
                </span>
              </li>
            );
          })}
          {!ready && (
            <li className="text-muted-foreground pt-1">
              See <code className="bg-muted rounded px-1">.env.example</code> for where to get each
              key.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
