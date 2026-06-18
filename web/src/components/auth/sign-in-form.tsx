'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signIn } from '@/lib/auth-client';

export function SignInForm() {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const email = String(form.get('email') ?? '');
    const password = String(form.get('password') ?? '');

    setPending(true);
    const { error } = await signIn.email({ email, password, callbackURL: '/dashboard' });
    setPending(false);

    if (error) {
      setError(error.message ?? 'Invalid email or password.');
      return;
    }
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
        />
      </div>
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
        />
      </div>

      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}

      <Button type="submit" variant="brand" disabled={pending}>
        {pending && <LoaderCircle className="size-4 animate-spin" />}
        Sign in
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        New to SnapSaas?{' '}
        <Link
          href="/sign-up"
          className="text-foreground font-medium underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}
