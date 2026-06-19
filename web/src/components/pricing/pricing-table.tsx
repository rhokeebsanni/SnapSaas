'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Check, LoaderCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PLAN_LIST, yearlyDiscountPercent, type Plan, type PlanId } from '@/lib/plans';
import { formatPrice, REGIONS, type Region } from '@/lib/pricing';
import { cn } from '@/lib/utils';

export function PricingTable({
  signedIn,
  currentPlan,
}: {
  signedIn: boolean;
  currentPlan?: PlanId;
}) {
  const router = useRouter();
  const [yearly, setYearly] = React.useState(false);
  const [region, setRegion] = React.useState<Region>('US');
  const [pending, setPending] = React.useState<PlanId | null>(null);

  // Currency follows the visitor's region automatically (display only).
  React.useEffect(() => {
    import('@/lib/pricing').then(({ detectRegion }) => setRegion(detectRegion()));
  }, []);

  async function choose(plan: Plan) {
    if (plan.id === 'free') {
      router.push(signedIn ? '/dashboard' : '/sign-up');
      return;
    }
    if (!signedIn) {
      router.push(`/sign-up?next=/pricing`);
      return;
    }

    setPending(plan.id);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: plan.id, cycle: yearly ? 'yearly' : 'monthly' }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.url) {
        // Hand off to Lemon Squeezy's hosted checkout. The session cookie stays
        // put — we come back to /dashboard?upgraded=1, still signed in.
        window.location.assign(data.url);
        return;
      }

      // Specific, honest messaging instead of a dead end that looks like a logout.
      if (res.status === 401) {
        toast.error('Your session expired. Please sign in again.');
        router.push('/sign-in?next=/pricing');
      } else if (res.status === 503) {
        toast.info('Payments are being set up', {
          description: 'Card checkout isn’t live yet — check back shortly.',
        });
      } else {
        toast.error(data.error ?? 'Could not start checkout.');
      }
    } catch {
      toast.error('Network error — please try again.');
    }
    setPending(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <div className="bg-background inline-flex items-center gap-1 rounded-full border p-1 text-sm">
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
            Yearly <span className="text-brand">save 20%</span>
          </button>
        </div>
      </div>

      {!REGIONS[region].charged && (
        <p className="text-muted-foreground mx-auto max-w-md text-center text-xs">
          Showing {REGIONS[region].currency} prices for {REGIONS[region].label}. Checkout is
          processed in USD by Lemon Squeezy (it converts your card automatically), so the exact
          amount may vary slightly with the day’s rate.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {PLAN_LIST.map((plan) => {
          const usd = yearly ? plan.priceYearly : plan.priceMonthly;
          const price = formatPrice(usd, region);
          const suffix = plan.priceMonthly === 0 ? '' : yearly ? '/yr' : '/mo';
          const discount = yearlyDiscountPercent(plan);
          const isCurrent = currentPlan === plan.id;

          return (
            <div
              key={plan.id}
              className={cn(
                'bg-card relative flex h-full flex-col rounded-2xl border p-6',
                plan.highlighted && 'border-brand/50 ring-brand/30 shadow-lg ring-1',
              )}
            >
              {plan.highlighted && (
                <Badge
                  variant="brand"
                  className="bg-brand text-brand-foreground absolute -top-3 left-1/2 -translate-x-1/2"
                >
                  Most popular
                </Badge>
              )}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="text-muted-foreground mt-1 text-sm">{plan.tagline}</p>

              <div className="mt-5 flex items-end gap-1">
                <span className="text-4xl font-bold tracking-tight">{price}</span>
                <span className="text-muted-foreground mb-1 text-sm">{suffix}</span>
              </div>
              {yearly && discount > 0 && (
                <p className="text-brand mt-1 text-xs">Save {discount}% vs. monthly</p>
              )}

              <Button
                variant={plan.highlighted ? 'brand' : 'outline'}
                className="mt-6"
                disabled={isCurrent || pending === plan.id}
                onClick={() => choose(plan)}
              >
                {pending === plan.id && <LoaderCircle className="size-4 animate-spin" />}
                {isCurrent ? 'Current plan' : plan.cta}
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
        })}
      </div>
    </div>
  );
}
