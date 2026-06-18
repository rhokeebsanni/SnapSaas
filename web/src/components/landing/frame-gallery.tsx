import { FadeIn } from '@/components/motion/fade-in';
import { DeviceFrame, MockSite } from '@/components/device-frame';

export function FrameGallery() {
  return (
    <section id="gallery" className="bg-muted/30 scroll-mt-20 border-y">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Three frames. Endless looks.
          </h2>
          <p className="text-muted-foreground mt-4">
            Browser, iPhone, and MacBook frames — each on a background that makes your product pop.
          </p>
        </FadeIn>

        <div className="mt-14 grid items-end gap-10 md:grid-cols-3">
          <FadeIn delay={0.05} className="flex flex-col items-center gap-4">
            <DeviceFrame variant="browser" url="acme.com">
              <MockSite tone="violet" />
            </DeviceFrame>
            <span className="text-muted-foreground text-sm font-medium">Browser window</span>
          </FadeIn>

          <FadeIn delay={0.12} className="flex flex-col items-center gap-4">
            <DeviceFrame variant="iphone">
              <MockSite tone="teal" />
            </DeviceFrame>
            <span className="text-muted-foreground text-sm font-medium">iPhone</span>
          </FadeIn>

          <FadeIn delay={0.19} className="flex flex-col items-center gap-4">
            <DeviceFrame variant="macbook">
              <MockSite tone="amber" />
            </DeviceFrame>
            <span className="text-muted-foreground text-sm font-medium">MacBook</span>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
