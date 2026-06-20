'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Copy, LoaderCircle, Mail, Trash2, UserPlus } from 'lucide-react';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Member {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
}
interface Invite {
  id: string;
  email: string;
  token: string;
}

function initials(name: string) {
  return (
    name
      .split(' ')
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?'
  );
}

async function teamAction(payload: Record<string, unknown>) {
  const res = await fetch('/api/team', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data } as { ok: boolean; data: Record<string, unknown> };
}

export function TeamSettings({
  isOwner,
  members,
  invites,
  seatsUsed,
  seatsTotal,
  appUrl,
}: {
  isOwner: boolean;
  members: Member[];
  invites: Invite[];
  seatsUsed: number;
  seatsTotal: number;
  appUrl: string;
}) {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const full = seatsUsed + invites.length >= seatsTotal;

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setPending(true);
    const { ok, data } = await teamAction({ action: 'invite', email: email.trim() });
    setPending(false);
    if (ok) {
      toast.success('Invite sent', {
        description: 'They’ll get an email — or share the link from the pending list.',
      });
      setEmail('');
      router.refresh();
    } else {
      toast.error(String(data.error ?? 'Could not send the invite.'));
    }
  }

  async function revoke(inviteId: string) {
    const { ok, data } = await teamAction({ action: 'revoke', inviteId });
    if (ok) {
      toast.success('Invite revoked.');
      router.refresh();
    } else toast.error(String(data.error ?? 'Could not revoke.'));
  }

  async function remove(memberId: string) {
    const { ok, data } = await teamAction({ action: 'remove', memberId });
    if (ok) {
      toast.success('Member removed.');
      router.refresh();
    } else toast.error(String(data.error ?? 'Could not remove.'));
  }

  function copyLink(token: string) {
    navigator.clipboard.writeText(`${appUrl}/invite/${token}`);
    toast.success('Invite link copied.');
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-sm">Seats</span>
        <Badge variant="secondary">
          {seatsUsed} / {seatsTotal} used
        </Badge>
      </div>

      {/* Members */}
      <ul className="space-y-2">
        {members.map((m) => (
          <li key={m.id} className="flex items-center gap-3 rounded-lg border p-3">
            <Avatar className="size-9">
              {m.image ? <AvatarImage src={m.image} alt={m.name} /> : null}
              <AvatarFallback>{initials(m.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{m.name}</p>
              <p className="text-muted-foreground truncate text-xs">{m.email}</p>
            </div>
            {m.role === 'owner' ? (
              <Badge variant="brand">Owner</Badge>
            ) : (
              isOwner && (
                <ConfirmDialog
                  title="Remove this member?"
                  description={`${m.name || m.email} will lose access to the team and its Pro features.`}
                  confirmLabel="Remove"
                  destructive
                  onConfirm={() => remove(m.id)}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    title="Remove"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </ConfirmDialog>
              )
            )}
          </li>
        ))}
      </ul>

      {/* Pending invites */}
      {invites.length > 0 && (
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-medium">Pending invites</p>
          {invites.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center gap-2 rounded-lg border border-dashed p-3"
            >
              <Mail className="text-muted-foreground size-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate text-sm">{inv.email}</span>
              {isOwner && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyLink(inv.token)}
                    title="Copy link"
                  >
                    <Copy className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => revoke(inv.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    Revoke
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Invite form (owner only) */}
      {isOwner && (
        <form onSubmit={invite} className="space-y-2 border-t pt-4">
          <Label htmlFor="invite-email">Invite a teammate</Label>
          <div className="flex gap-2">
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@example.com"
              disabled={full}
            />
            <Button type="submit" variant="brand" disabled={pending || full} className="shrink-0">
              {pending ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <UserPlus className="size-4" />
              )}
              Invite
            </Button>
          </div>
          {full && (
            <p className="text-muted-foreground text-xs">
              All {seatsTotal} seats are used or pending. Revoke an invite to free one up.
            </p>
          )}
        </form>
      )}
    </div>
  );
}
