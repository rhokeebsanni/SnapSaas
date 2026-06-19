import Link from 'next/link';
import { ArrowRight, ImagePlus, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';

/** A warm, illustrated empty state shown before the user's first capture. */
export function CapturesEmptyState() {
  return (
    <div className="bg-card dark:bg-card/60 relative overflow-hidden rounded-2xl border p-10 text-center dark:backdrop-blur-sm">
      <div className="bg-grid pointer-events-none absolute inset-0 -z-10 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />

      {/* Floating frames illustration */}
      <div className="relative mx-auto mb-6 h-24 w-40">
        <div className="bg-brand/10 border-brand/30 absolute left-2 top-3 h-16 w-28 -rotate-6 rounded-lg border" />
        <div className="bg-brand-2/10 border-brand-2/30 absolute right-2 top-1 h-16 w-28 rotate-6 rounded-lg border" />
        <div className="bg-background absolute left-1/2 top-0 grid h-20 w-28 -translate-x-1/2 place-items-center rounded-lg border shadow-lg">
          <ImagePlus className="text-brand size-7" />
        </div>
      </div>

      <h3 className="text-lg font-semibold">Your gallery is waiting</h3>
      <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm">
        Paste any website URL and SnapSaas turns it into a polished, share-ready mockup in seconds.
      </p>

      <Button variant="brand" size="lg" className="mt-6" asChild>
        <Link href="/dashboard/editor" className="gap-2">
          <Sparkles className="size-4" />
          Create your first capture
          <ArrowRight className="size-4" />
        </Link>
      </Button>
    </div>
  );
}
