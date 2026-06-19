import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Skeleton } from '@/components/ui/skeleton';

export default function PricingLoading() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mx-auto mb-12 max-w-2xl space-y-3 text-center">
            <Skeleton className="mx-auto h-10 w-80" />
            <Skeleton className="mx-auto h-4 w-96 max-w-full" />
          </div>
          <div className="mx-auto mb-8 flex justify-center gap-3">
            <Skeleton className="h-9 w-44 rounded-full" />
            <Skeleton className="h-9 w-32 rounded-full" />
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-96 rounded-2xl" />
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
