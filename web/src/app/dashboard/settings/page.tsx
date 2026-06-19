import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getServerSession } from '@/lib/session';
import { getAccount, getSubscription } from '@/lib/account';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const session = await getServerSession();
  if (!session) redirect('/sign-in');

  const account = await getAccount(session.user.id);
  const sub = await getSubscription(session.user.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and plan.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account details.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{session.user.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{session.user.email}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plan &amp; billing</CardTitle>
          <CardDescription>Manage your subscription and payment details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Current plan</span>
            <Badge variant={account.plan.id === 'free' ? 'secondary' : 'brand'}>
              {account.onTrial ? 'Pro (trial)' : account.plan.name}
            </Badge>
          </div>
          {account.onTrial && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Trial ends</span>
              <span className="font-medium">
                {account.trialEndsAt?.toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}{' '}
                ({account.trialDaysLeft} day{account.trialDaysLeft === 1 ? '' : 's'} left)
              </span>
            </div>
          )}
          {sub && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium capitalize">{sub.status.replace('_', ' ')}</span>
            </div>
          )}
          <div className="flex flex-wrap gap-2 pt-2">
            {sub?.customerPortalUrl ? (
              <Button variant="outline" asChild>
                <a href={sub.customerPortalUrl} target="_blank" rel="noopener noreferrer">
                  Manage billing
                </a>
              </Button>
            ) : (
              <Button variant="brand" asChild>
                <a href="/pricing">{account.plan.id === 'free' ? 'Upgrade' : 'View plans'}</a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
