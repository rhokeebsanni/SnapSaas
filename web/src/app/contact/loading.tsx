import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Skeleton } from '@/components/ui/skeleton';

export default function ContactLoading() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mx-auto mb-12 max-w-2xl space-y-3 text-center">
            <Skeleton className="mx-auto size-12 rounded-2xl" />
            <Skeleton className="mx-auto h-10 w-72" />
            <Skeleton className="mx-auto h-4 w-96 max-w-full" />
          </div>
          <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
            <div className="space-y-6">
              <Skeleton className="h-40 rounded-2xl" />
              <Skeleton className="h-56 rounded-2xl" />
            </div>
            <Skeleton className="h-[28rem] rounded-2xl" />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
