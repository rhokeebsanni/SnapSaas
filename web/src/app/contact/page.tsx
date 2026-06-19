import type { Metadata } from 'next';
import { Mail, MessageCircle, LifeBuoy } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { ContactForm } from '@/components/contact/contact-form';
import { SUPPORT_EMAIL } from '@/lib/email';
import { getServerSession } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Contact & Help',
  description:
    'Get help with SnapSaas — billing, bug reports, feature requests, or anything else. We usually reply within one business day.',
};

const HELP = [
  {
    q: 'My capture failed. Was I charged a credit?',
    a: 'No. Failed captures are automatically refunded — your credit balance is only reduced for captures that finish successfully.',
  },
  {
    q: 'How do I upgrade or manage my plan?',
    a: 'Open Settings from your dashboard, then “Manage billing” to change or cancel your plan. Upgrading never signs you out.',
  },
  {
    q: 'Which payment methods do you accept?',
    a: 'Payments run through Lemon Squeezy (our Merchant of Record), which accepts global cards and handles tax/VAT. Charges settle in USD.',
  },
  {
    q: 'Can I use the screenshots commercially?',
    a: 'Yes — assets you generate are yours to use for launches, social, portfolios, and landing pages.',
  },
];

export default async function ContactPage() {
  const session = await getServerSession();

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <div className="bg-brand/15 text-brand mx-auto mb-4 grid size-12 place-items-center rounded-2xl">
              <LifeBuoy className="size-6" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">How can we help?</h1>
            <p className="text-muted-foreground mt-4">
              Questions, bugs, billing, or feature ideas — send us a note and we’ll get back to you,
              usually within one business day.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
            {/* Left: ways to reach us + FAQ */}
            <div className="space-y-6">
              <div className="bg-card space-y-4 rounded-2xl border p-6">
                <h2 className="font-semibold">Other ways to reach us</h2>
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="hover:bg-muted/50 flex items-center gap-3 rounded-xl border p-3 transition-colors"
                >
                  <span className="bg-brand/15 text-brand grid size-9 place-items-center rounded-lg">
                    <Mail className="size-4" />
                  </span>
                  <span className="text-sm">
                    <span className="block font-medium">Email</span>
                    <span className="text-muted-foreground">{SUPPORT_EMAIL}</span>
                  </span>
                </a>
                <div className="hover:bg-muted/50 flex items-center gap-3 rounded-xl border p-3 transition-colors">
                  <span className="bg-brand/15 text-brand grid size-9 place-items-center rounded-lg">
                    <MessageCircle className="size-4" />
                  </span>
                  <span className="text-sm">
                    <span className="block font-medium">Response time</span>
                    <span className="text-muted-foreground">Within 1 business day</span>
                  </span>
                </div>
              </div>

              <div className="bg-card rounded-2xl border p-6">
                <h2 className="mb-4 font-semibold">Quick answers</h2>
                <dl className="space-y-4">
                  {HELP.map((item) => (
                    <div key={item.q}>
                      <dt className="text-sm font-medium">{item.q}</dt>
                      <dd className="text-muted-foreground mt-1 text-sm">{item.a}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            {/* Right: the form */}
            <ContactForm defaultEmail={session?.user.email ?? ''} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
