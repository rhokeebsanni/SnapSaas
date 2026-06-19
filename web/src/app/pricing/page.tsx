import type { Metadata } from 'next';

import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { PricingTable } from '@/components/pricing/pricing-table';
import { getServerSession } from '@/lib/session';
import { getAccount } from '@/lib/account';
import type { PlanId } from '@/lib/plans';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple pricing for SnapSaas — start free, upgrade when you need more.',
};

const FAQ = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Manage or cancel your subscription from the billing portal in your settings at any time.',
  },
  {
    q: 'What happens to the watermark?',
    a: 'The free plan adds a subtle “Made with SnapSaas” watermark. Paid plans export with no watermark.',
  },
  {
    q: 'Do unused captures roll over?',
    a: 'Capture allowances reset at the start of each billing month and do not roll over.',
  },
  {
    q: 'Which payment methods do you accept?',
    a: 'Payments are handled by Lemon Squeezy (our Merchant of Record), which supports global cards and handles VAT/tax.',
  },
];

export default async function PricingPage() {
  const session = await getServerSession();
  let currentPlan: PlanId | undefined;
  if (session) {
    const account = await getAccount(session.user.id);
    currentPlan = account.plan.id;
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Pricing that scales with you
            </h1>
            <p className="text-muted-foreground mt-4">
              Start free. Upgrade for no watermark, higher resolution, and the full catalog.
            </p>
          </div>

          <PricingTable signedIn={Boolean(session)} currentPlan={currentPlan} />

          <div id="faq" className="mx-auto mt-20 max-w-2xl scroll-mt-24">
            <h2 className="mb-6 text-center text-2xl font-bold tracking-tight">
              Frequently asked questions
            </h2>
            <dl className="space-y-4">
              {FAQ.map((item) => (
                <div key={item.q} className="bg-card rounded-xl border p-5">
                  <dt className="font-medium">{item.q}</dt>
                  <dd className="text-muted-foreground mt-2 text-sm">{item.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
