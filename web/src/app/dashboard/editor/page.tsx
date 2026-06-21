import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Editor } from '@/components/editor/editor';
import { getServerSession } from '@/lib/session';
import { getAccount } from '@/lib/account';

export const metadata: Metadata = { title: 'New capture' };

export default async function EditorPage(props: PageProps<'/dashboard/editor'>) {
  const session = await getServerSession();
  if (!session) redirect('/sign-in');

  const account = await getAccount(session.user.id);
  const searchParams = await props.searchParams;
  const initialUrl = typeof searchParams.url === 'string' ? searchParams.url : undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New capture</h1>
          <p className="text-muted-foreground">
            Paste a URL, choose a style, and generate share-ready assets.
          </p>
        </div>
        <Badge variant={account.plan.id === 'free' ? 'secondary' : 'brand'}>
          {account.plan.limits.capturesPerMonth < 0
            ? 'Unlimited captures'
            : `${account.credits} captures left`}
        </Badge>
      </div>

      <Editor
        maxScale={account.plan.limits.maxScale}
        allTemplates={account.plan.limits.allTemplates}
        watermark={account.plan.limits.watermark}
        canAnimate={account.plan.limits.batch}
        initialUrl={initialUrl}
      />
    </div>
  );
}
