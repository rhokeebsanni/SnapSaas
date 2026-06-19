import { redirect } from 'next/navigation';

import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Hero } from '@/components/landing/hero';
import { TrustStrip } from '@/components/landing/trust-strip';
import { Features } from '@/components/landing/features';
import { FrameGallery } from '@/components/landing/frame-gallery';
import { BeforeAfter } from '@/components/landing/before-after';
import { PricingTeaser } from '@/components/landing/pricing-teaser';
import { CTA } from '@/components/landing/cta';
import { getServerSession } from '@/lib/session';

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

export default async function HomePage() {
  // Signed-in visitors go straight to the app; logged-out visitors (and
  // crawlers, which carry no session cookie) still get the marketing page.
  const session = await getServerSession();
  if (session) redirect('/dashboard');

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <TrustStrip />
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
