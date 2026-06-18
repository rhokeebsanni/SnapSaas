import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, ImageIcon, Sparkles, Wand2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CaptureCard } from '@/components/dashboard/capture-card';
import { getServerSession } from '@/lib/session';
import { getAccount } from '@/lib/account';
import { getRecentCaptures } from '@/lib/projects';

export const metadata: Metadata = { title: 'Dashboard' };

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session) redirect('/sign-in');

  const account = await getAccount(session.user.id);
  const recent = await getRecentCaptures(session.user.id, 6);
  const limit = account.plan.limits.capturesPerMonth;
  const limitLabel = limit < 0 ? 'Unlimited' : String(limit);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {session.user.name.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-muted-foreground">Capture a site and make it look launch-ready.</p>
        </div>
        <Badge variant={account.plan.id === 'free' ? 'secondary' : 'brand'} className="gap-1">
          <Sparkles className="size-3" />
          {account.plan.name} plan
        </Badge>
      </div>

      {/* Primary CTA */}
      <Card className="border-brand/40 from-brand/10 to-brand-2/10 overflow-hidden bg-gradient-to-br">
        <CardContent className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <span className="bg-brand/15 text-brand inline-flex size-12 items-center justify-center rounded-xl">
              <Wand2 className="size-6" />
            </span>
            <div>
              <h2 className="text-lg font-semibold">Create a new capture</h2>
              <p className="text-muted-foreground text-sm">
                Paste a URL, pick a frame and background, and export in seconds.
              </p>
            </div>
          </div>
          <Button variant="brand" size="lg" asChild>
            <Link href="/dashboard/editor" className="gap-2">
              New capture <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Captures remaining
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{account.credits}</p>
            <p className="text-muted-foreground text-xs">of {limitLabel} this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Export quality
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{account.plan.limits.maxScale}×</p>
            <p className="text-muted-foreground text-xs">
              {account.plan.limits.watermark ? 'Watermarked' : 'No watermark'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="flex items-center gap-2 text-3xl font-bold">
              <ImageIcon className="text-muted-foreground size-6" /> {recent.length}
            </p>
            <p className="text-muted-foreground text-xs">
              {recent.length === 0 ? 'No captures yet' : 'Recent captures'}
            </p>
          </CardContent>
        </Card>
      </div>

      {recent.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent captures</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/projects">View all</Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((c) => (
              <CaptureCard key={c.jobId} capture={c} />
            ))}
          </div>
        </div>
      )}

      {account.plan.id === 'free' && (
        <Card>
          <CardContent className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <p className="text-muted-foreground text-sm">
              Upgrade to <span className="text-foreground font-medium">Pro</span> to remove the
              watermark, unlock 3× exports, and get the full frame catalog.
            </p>
            <Button variant="outline" asChild>
              <Link href="/#pricing">See plans</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
