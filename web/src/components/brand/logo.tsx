import { cn } from '@/lib/utils';

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'from-brand to-brand-2 text-brand-foreground inline-flex size-8 items-center justify-center rounded-lg bg-gradient-to-br shadow-sm',
        className,
      )}
      aria-hidden
    >
      {/* A capture-frame glyph: rounded viewfinder with corner brackets and a
          focal dot — "frame + snap", matching what SnapSaas actually does. */}
      <svg viewBox="0 0 24 24" fill="none" className="size-5">
        <rect x="4" y="4" width="16" height="16" rx="4.5" fill="currentColor" opacity="0.16" />
        {/* Four corner brackets. */}
        <path
          d="M8 4.8H6.3A1.5 1.5 0 0 0 4.8 6.3V8M16 4.8h1.7A1.5 1.5 0 0 1 19.2 6.3V8M8 19.2H6.3A1.5 1.5 0 0 1 4.8 17.7V16M16 19.2h1.7A1.5 1.5 0 0 0 19.2 17.7V16"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Focal dot. */}
        <circle cx="12" cy="12" r="2.6" fill="currentColor" />
      </svg>
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-semibold tracking-tight', className)}>
      <LogoMark />
      <span className="text-lg">
        Snap<span className="text-gradient">Saas</span>
      </span>
    </span>
  );
}
