'use client';

import * as React from 'react';
import Link from 'next/link';
import { LoaderCircle, MailCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { requestPasswordReset } from '@/lib/auth-client';

export function ForgotPasswordForm() {
  const [pending, setPending] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const email = String(new FormData(e.currentTarget).get('email') ?? '');

    setPending(true);
    const { error } = await requestPasswordReset({ email, redirectTo: '/reset-password' });
    setPending(false);

    // Always present success to avoid leaking which emails are registered.
    if (error && error.status && error.status >= 500) {
      setError('Something went wrong. Please try again.');
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="grid gap-4 text-center">
        <div className="bg-brand/15 text-brand mx-auto grid size-12 place-items-center rounded-full">
          <MailCheck className="size-6" />
        </div>
        <p className="text-sm">
          If an account exists for that email, we’ve sent a link to reset your password. Check your
          inbox (and spam).
        </p>
        <Button variant="outline" asChild>
          <Link href="/sign-in">Back to sign in</Link>
        </Button>
      </div>
    );
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

      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}

      <Button type="submit" variant="brand" disabled={pending}>
        {pending && <LoaderCircle className="size-4 animate-spin" />}
        Send reset link
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        Remembered it?{' '}
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
