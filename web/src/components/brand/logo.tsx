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
      {/* A camera-shutter / snap glyph. */}
      <svg viewBox="0 0 24 24" fill="none" className="size-5">
        <rect x="3" y="6" width="18" height="13" rx="3" fill="currentColor" opacity="0.18" />
        <path
          d="M8 6l1.2-2.1A1 1 0 0 1 10.06 3.4h3.88a1 1 0 0 1 .86.5L16 6"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12.5" r="3.4" stroke="currentColor" strokeWidth="1.6" />
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
