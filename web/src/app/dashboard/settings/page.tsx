import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getServerSession } from '@/lib/session';
import { getAccount } from '@/lib/account';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const session = await getServerSession();
  if (!session) redirect('/sign-in');

  const account = await getAccount(session.user.id);

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
          <CardDescription>Billing management arrives with payments.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Current plan</span>
          <Badge variant={account.plan.id === 'free' ? 'secondary' : 'brand'}>
            {account.plan.name}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}
