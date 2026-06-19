import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProfileForm } from '@/components/settings/profile-form';
import { TeamSettings } from '@/components/settings/team-settings';
import { CreateTeamButton } from '@/components/settings/create-team-button';
import { DeleteAccount } from '@/components/settings/delete-account';
import { getServerSession } from '@/lib/session';
import { getAccount, getSubscription } from '@/lib/account';
import { getTeamContext } from '@/lib/team';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const session = await getServerSession();
  if (!session) redirect('/sign-in');

  const account = await getAccount(session.user.id);
  const sub = await getSubscription(session.user.id);
  const teamCtx = await getTeamContext(session.user.id);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and plan.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your display name and avatar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ProfileForm defaultName={session.user.name} defaultImage={session.user.image ?? null} />
          <div className="flex justify-between border-t pt-4 text-sm">
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

      {/* Team */}
      <Card>
        <CardHeader>
          <CardTitle>Team</CardTitle>
          <CardDescription>
            {teamCtx
              ? 'Invite teammates to share your Team plan.'
              : account.plan.id === 'team'
                ? 'Create your team and invite up to your seat limit.'
                : 'Teams are part of the Team plan.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teamCtx ? (
            <TeamSettings
              isOwner={teamCtx.role === 'owner'}
              members={teamCtx.members}
              invites={teamCtx.invites}
              seatsUsed={teamCtx.seatsUsed}
              seatsTotal={teamCtx.seatsTotal}
              appUrl={appUrl}
            />
          ) : account.plan.id === 'team' ? (
            <CreateTeamButton />
          ) : (
            <div className="flex flex-col items-start justify-between gap-3 text-sm sm:flex-row sm:items-center">
              <p className="text-muted-foreground">
                Upgrade to the <span className="text-foreground font-medium">Team</span> plan to
                invite teammates and share Pro features.
              </p>
              <Button variant="outline" asChild>
                <a href="/pricing">View Team plan</a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
          <CardDescription>Irreversible actions for your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccount />
        </CardContent>
      </Card>
    </div>
  );
}
