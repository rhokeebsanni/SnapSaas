import { cn } from '@/lib/utils';

/** A shimmering placeholder block used while content loads. */
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('bg-muted/60 animate-pulse rounded-md', className)}
      {...props}
    />
  );
}

export { Skeleton };
