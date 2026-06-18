import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ImagePlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { CaptureCard } from '@/components/dashboard/capture-card';
import { getServerSession } from '@/lib/session';
import { getRecentCaptures } from '@/lib/projects';

export const metadata: Metadata = { title: 'Projects' };

// Always reflect the latest captures.
export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const session = await getServerSession();
  if (!session) redirect('/sign-in');

  const captures = await getRecentCaptures(session.user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your captures</h1>
          <p className="text-muted-foreground">Every screenshot you’ve generated.</p>
        </div>
        <Button variant="brand" asChild>
          <Link href="/dashboard/editor">
            <ImagePlus className="size-4" /> New capture
          </Link>
        </Button>
      </div>

      {captures.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed py-20 text-center">
          <ImagePlus className="text-muted-foreground mb-3 size-8" />
          <h2 className="text-lg font-semibold">No captures yet</h2>
          <p className="text-muted-foreground mb-4 max-w-sm text-sm">
            Paste a URL in the editor to create your first launch-ready screenshot.
          </p>
          <Button variant="brand" asChild>
            <Link href="/dashboard/editor">Create your first capture</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {captures.map((c) => (
            <CaptureCard key={c.jobId} capture={c} />
          ))}
        </div>
      )}
    </div>
  );
}
