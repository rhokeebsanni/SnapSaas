'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordField } from '@/components/auth/password-field';
import { signIn } from '@/lib/auth-client';

export function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  // Only allow same-app relative redirects (avoid open-redirect).
  const nextParam = params.get('next');
  const next = nextParam && nextParam.startsWith('/') ? nextParam : '/dashboard';
  const justReset = params.get('reset') === '1';
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [unverified, setUnverified] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setUnverified(false);
    const form = new FormData(e.currentTarget);
    const email = String(form.get('email') ?? '');
    const password = String(form.get('password') ?? '');

    setPending(true);
    const { error } = await signIn.email({ email, password, callbackURL: next });
    setPending(false);

    if (error) {
      // Better Auth blocks login until the email is verified (403).
      if (error.status === 403 || error.code === 'EMAIL_NOT_VERIFIED') {
        setUnverified(true);
        return;
      }
      setError(error.message ?? 'Invalid email or password.');
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      {justReset && (
        <p className="rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-center text-sm text-emerald-600 dark:text-emerald-400">
          Password updated — sign in with your new password.
        </p>
      )}
      {unverified && (
        <p className="text-muted-foreground rounded-md border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-sm">
          Please verify your email before signing in. Check your inbox for the verification link
          (and spam).
        </p>
      )}
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
          <Link
            href="/forgot-password"
            className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <PasswordField
          id="password"
          name="password"
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
