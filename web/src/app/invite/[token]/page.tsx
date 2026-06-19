import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CheckCircle2, XCircle } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Button } from '@/components/ui/button';
import { getServerSession } from '@/lib/session';
import { acceptInvite } from '@/lib/team';

export const dynamic = 'force-dynamic';

export default async function AcceptInvitePage(props: PageProps<'/invite/[token]'>) {
  const { token } = await props.params;
  const session = await getServerSession();

  // Must be signed in to accept — bounce through sign-in and come right back.
  if (!session) {
    redirect(`/sign-in?next=/invite/${token}`);
  }

  const result = await acceptInvite(token, session.user.id, session.user.email);

  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-20">
        <div className="bg-card w-full max-w-md rounded-2xl border p-8 text-center">
          {result.ok ? (
            <>
              <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-emerald-500/15 text-emerald-500">
                <CheckCircle2 className="size-6" />
              </div>
              <h1 className="text-xl font-semibold">You’re in! 🎉</h1>
              <p className="text-muted-foreground mt-2 text-sm">
                You’ve joined the team and now have Pro features. Time to make something gorgeous.
              </p>
              <Button variant="brand" className="mt-6" asChild>
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
            </>
          ) : (
            <>
              <div className="bg-destructive/15 text-destructive mx-auto mb-4 grid size-12 place-items-center rounded-full">
                <XCircle className="size-6" />
              </div>
              <h1 className="text-xl font-semibold">Invite couldn’t be accepted</h1>
              <p className="text-muted-foreground mt-2 text-sm">{result.error}</p>
              <Button variant="outline" className="mt-6" asChild>
                <Link href="/dashboard">Back to dashboard</Link>
              </Button>
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
