import { ArrowRight } from 'lucide-react';

import { FadeIn } from '@/components/motion/fade-in';
import { DeviceFrame, MockSite } from '@/components/device-frame';
import { Badge } from '@/components/ui/badge';

export function BeforeAfter() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <FadeIn className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">From raw grab to gorgeous</h2>
        <p className="text-muted-foreground mt-4">
          The same screenshot, before and after SnapSaas does its thing.
        </p>
      </FadeIn>

      <FadeIn delay={0.08} className="mt-12">
        <div className="grid items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
          {/* Before: a flat, unframed screenshot */}
          <div className="relative">
            <Badge variant="outline" className="bg-background/80 absolute left-3 top-3 z-10">
              Before
            </Badge>
            <div className="overflow-hidden rounded-lg border opacity-90 grayscale-[0.15]">
              <div className="aspect-[16/10]">
                <MockSite tone="violet" />
              </div>
            </div>
          </div>

          <div className="bg-background text-muted-foreground mx-auto hidden size-10 items-center justify-center rounded-full border md:flex">
            <ArrowRight className="size-5" />
          </div>

          {/* After: framed + background + shadow */}
          <div className="from-brand/15 to-brand-2/15 relative rounded-2xl bg-gradient-to-br p-6">
            <Badge variant="brand" className="absolute left-6 top-6 z-10">
              After
            </Badge>
            <DeviceFrame variant="browser" url="acme.com">
              <MockSite tone="violet" />
            </DeviceFrame>
          </div>
        </div>
      </FadeIn>
    </section>
  );
}
