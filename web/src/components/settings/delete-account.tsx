'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { LoaderCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signOut } from '@/lib/auth-client';

export function DeleteAccount() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [confirm, setConfirm] = React.useState('');
  const [pending, setPending] = React.useState(false);

  async function destroy() {
    setPending(true);
    try {
      const res = await fetch('/api/account', { method: 'DELETE' });
      if (res.ok) {
        await signOut().catch(() => undefined);
        toast.success('Your account has been deleted.');
        router.push('/');
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(String(data.error ?? 'Could not delete your account.'));
        setPending(false);
      }
    } catch {
      toast.error('Network error — please try again.');
      setPending(false);
    }
  }

  if (!open) {
    return (
      <Button variant="outline" className="text-destructive" onClick={() => setOpen(true)}>
        Delete account
      </Button>
    );
  }

  return (
    <div className="border-destructive/40 bg-destructive/5 space-y-3 rounded-lg border p-4">
      <p className="text-sm font-medium">This permanently deletes your account and all captures.</p>
      <div className="space-y-1.5">
        <Label htmlFor="confirm-delete" className="text-xs">
          Type <span className="font-mono font-semibold">DELETE</span> to confirm
        </Label>
        <Input
          id="confirm-delete"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="DELETE"
          autoComplete="off"
        />
      </div>
      <div className="flex gap-2">
        <Button variant="destructive" disabled={confirm !== 'DELETE' || pending} onClick={destroy}>
          {pending && <LoaderCircle className="size-4 animate-spin" />}
          Delete forever
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setOpen(false);
            setConfirm('');
          }}
          disabled={pending}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
