'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { LoaderCircle, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function CreateTeamButton() {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function create() {
    setPending(true);
    const res = await fetch('/api/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create' }),
    });
    const data = await res.json().catch(() => ({}));
    setPending(false);
    if (res.ok) {
      toast.success('Team created — invite your teammates.');
      router.refresh();
    } else {
      toast.error(String(data.error ?? 'Could not create the team.'));
    }
  }

  return (
    <Button variant="brand" onClick={create} disabled={pending}>
      {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Users className="size-4" />}
      Create your team
    </Button>
  );
}
