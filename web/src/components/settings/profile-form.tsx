'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { LoaderCircle } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function initials(name: string): string {
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

/** Editable display name + avatar (by image URL). */
export function ProfileForm({
  defaultName,
  defaultImage,
}: {
  defaultName: string;
  defaultImage: string | null;
}) {
  const router = useRouter();
  const [name, setName] = React.useState(defaultName);
  const [image, setImage] = React.useState(defaultImage ?? '');
  const [pending, setPending] = React.useState(false);

  const dirty = name.trim() !== defaultName || (image || '') !== (defaultImage ?? '');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required.');
      return;
    }
    setPending(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), image: image.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success('Profile updated.');
        router.refresh();
      } else {
        toast.error(data.error ?? 'Could not save your profile.');
      }
    } catch {
      toast.error('Network error — please try again.');
    }
    setPending(false);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="flex items-center gap-4">
        <Avatar className="size-16 border">
          {image ? <AvatarImage src={image} alt={name} /> : null}
          <AvatarFallback className="text-base">{initials(name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Label htmlFor="image">Avatar URL</Label>
          <Input
            id="image"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://…/avatar.png"
            inputMode="url"
            className="mt-1"
          />
          <p className="text-muted-foreground mt-1 text-xs">
            Paste a link to an image. Leave blank to use your initials.
          </p>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="name">Display name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          required
        />
      </div>

      <div>
        <Button type="submit" variant="brand" disabled={pending || !dirty}>
          {pending && <LoaderCircle className="size-4 animate-spin" />}
          Save changes
        </Button>
      </div>
    </form>
  );
}
