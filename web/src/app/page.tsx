import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Hero } from '@/components/landing/hero';
import { Features } from '@/components/landing/features';
import { FrameGallery } from '@/components/landing/frame-gallery';
import { BeforeAfter } from '@/components/landing/before-after';
import { PricingTeaser } from '@/components/landing/pricing-teaser';
import { CTA } from '@/components/landing/cta';

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <Features />
        <FrameGallery />
        <BeforeAfter />
        <PricingTeaser />
        <CTA />
      </main>
      <SiteFooter />
    </>
  );
}
