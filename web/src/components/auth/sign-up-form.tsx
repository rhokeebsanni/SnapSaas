'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordField } from '@/components/auth/password-field';
import { VerifyEmailNotice } from '@/components/auth/verify-email-notice';
import { signUp } from '@/lib/auth-client';

export function SignUpForm() {
  const router = useRouter();
  const params = useSearchParams();
  const nextParam = params.get('next');
  const next = nextParam && nextParam.startsWith('/') ? nextParam : '/dashboard';
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  // Set once we've created the account but it needs email verification.
  const [verifyEmail, setVerifyEmail] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const name = String(form.get('name') ?? '');
    const email = String(form.get('email') ?? '');
    const password = String(form.get('password') ?? '');
    const confirmPassword = String(form.get('confirmPassword') ?? '');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setPending(true);
    const { data, error } = await signUp.email({ name, email, password, callbackURL: next });
    setPending(false);

    if (error) {
      setError(error.message ?? 'Could not create your account.');
      return;
    }
    // When email verification is required, sign-up returns no session — show the
    // "check your inbox" state instead of bouncing off the dashboard.
    if (!data?.token) {
      setVerifyEmail(email);
      return;
    }
    router.push(next);
    router.refresh();
  }

  if (verifyEmail) {
    return <VerifyEmailNotice email={verifyEmail} />;
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" autoComplete="name" required placeholder="Ada Lovelace" />
      </div>
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
        <Label htmlFor="password">Password</Label>
        <PasswordField
          id="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="At least 8 characters"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <PasswordField
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="Re-enter your password"
        />
      </div>

      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}

      <Button type="submit" variant="brand" disabled={pending}>
        {pending && <LoaderCircle className="size-4 animate-spin" />}
        Create account
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        Already have an account?{' '}
        <Link
          href="/sign-in"
          className="text-foreground font-medium underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
