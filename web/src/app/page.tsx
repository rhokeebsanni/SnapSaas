import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Hero } from '@/components/landing/hero';
import { Features } from '@/components/landing/features';
import { FrameGallery } from '@/components/landing/frame-gallery';
import { BeforeAfter } from '@/components/landing/before-after';
import { PricingTeaser } from '@/components/landing/pricing-teaser';
import { CTA } from '@/components/landing/cta';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'SnapSaas',
  applicationCategory: 'DesignApplication',
  operatingSystem: 'Web',
  description:
    'Turn any website URL into launch-ready marketing screenshots in seconds, framed and styled automatically.',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
