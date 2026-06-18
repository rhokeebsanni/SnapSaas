'use client';

import * as React from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FadeIn } from '@/components/motion/fade-in';
import { PLAN_LIST, yearlyDiscountPercent, type Plan } from '@/lib/plans';
import { cn } from '@/lib/utils';

export function PricingTeaser() {
  const [yearly, setYearly] = React.useState(false);

  return (
    <section id="pricing" className="bg-muted/30 scroll-mt-20 border-t">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simple pricing that scales with you
          </h2>
          <p className="text-muted-foreground mt-4">
            Start free. Upgrade when you need no watermark, higher resolution, and the full catalog.
          </p>

          <div className="bg-background mt-6 inline-flex items-center gap-1 rounded-full border p-1 text-sm">
            <button
              type="button"
              onClick={() => setYearly(false)}
              className={cn(
                'rounded-full px-4 py-1.5 transition-colors',
                !yearly ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setYearly(true)}
              className={cn(
                'rounded-full px-4 py-1.5 transition-colors',
                yearly ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
              )}
            >
              Yearly
              <span className="text-brand ml-1">save 20%</span>
            </button>
          </div>
        </FadeIn>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {PLAN_LIST.map((plan, i) => (
            <FadeIn key={plan.id} delay={i * 0.06}>
              <PriceCard plan={plan} yearly={yearly} />
            </FadeIn>
          ))}
        </div>

        <p className="text-muted-foreground mt-8 text-center text-sm">
          Need to generate mockups at scale?{' '}
          <Link
            href="/sign-up"
            className="text-foreground font-medium underline-offset-4 hover:underline"
          >
            Ask about our pay-as-you-go API
          </Link>
          .
        </p>
      </div>
    </section>
  );
}

function PriceCard({ plan, yearly }: { plan: Plan; yearly: boolean }) {
  const price = yearly ? plan.priceYearly : plan.priceMonthly;
  const suffix = plan.priceMonthly === 0 ? '' : yearly ? '/yr' : '/mo';
  const discount = yearlyDiscountPercent(plan);

  return (
    <div
      className={cn(
        'bg-card relative flex h-full flex-col rounded-2xl border p-6',
        plan.highlighted && 'border-brand/50 ring-brand/30 shadow-lg ring-1',
      )}
    >
      {plan.highlighted && (
        <Badge variant="brand" className="absolute -top-3 left-1/2 -translate-x-1/2">
          Most popular
        </Badge>
      )}
      <h3 className="text-lg font-semibold">{plan.name}</h3>
      <p className="text-muted-foreground mt-1 text-sm">{plan.tagline}</p>

      <div className="mt-5 flex items-end gap-1">
        <span className="text-4xl font-bold tracking-tight">${price}</span>
        <span className="text-muted-foreground mb-1 text-sm">{suffix}</span>
      </div>
      {yearly && discount > 0 && (
        <p className="text-brand mt-1 text-xs">Save {discount}% vs. monthly</p>
      )}

      <Button variant={plan.highlighted ? 'brand' : 'outline'} className="mt-6" asChild>
        <Link href="/sign-up">{plan.cta}</Link>
      </Button>

      <ul className="mt-6 space-y-3 text-sm">
        {plan.features.map((feat) => (
          <li key={feat} className="flex items-start gap-2">
            <Check className="text-brand mt-0.5 size-4 shrink-0" />
            <span className="text-muted-foreground">{feat}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
