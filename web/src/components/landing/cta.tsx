import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { FadeIn } from '@/components/motion/fade-in';

export function CTA() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <FadeIn>
        <div className="from-brand/15 via-background to-brand-2/15 relative overflow-hidden rounded-3xl border bg-gradient-to-br px-6 py-16 text-center sm:px-12">
          <div className="bg-grid pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
          <h2 className="mx-auto max-w-2xl text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Make your site look gorgeous in seconds
          </h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-lg">
            Join founders and indie hackers shipping beautiful launch assets without ever opening a
            design tool.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button variant="brand" size="lg" asChild>
              <Link href="/sign-up" className="gap-2">
                Start for free
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/#pricing">See pricing</Link>
            </Button>
          </div>
          <p className="text-muted-foreground mt-4 text-xs">No credit card required.</p>
        </div>
      </FadeIn>
    </section>
  );
}
