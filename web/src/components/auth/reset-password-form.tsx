'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PasswordField } from '@/components/auth/password-field';
import { resetPassword } from '@/lib/auth-client';

export function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token');
  // Better Auth appends ?error=INVALID_TOKEN when a link is bad/expired.
  const linkError = params.get('error');

  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const password = String(form.get('password') ?? '');
    const confirm = String(form.get('confirmPassword') ?? '');

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (!token) {
      setError('This reset link is invalid or has expired.');
      return;
    }

    setPending(true);
    const { error } = await resetPassword({ newPassword: password, token });
    setPending(false);

    if (error) {
      setError(error.message ?? 'Could not reset your password. The link may have expired.');
      return;
    }
    router.push('/sign-in?reset=1');
  }

  if (linkError || !token) {
    return (
      <div className="grid gap-4 text-center">
        <p className="text-sm">
          This reset link is invalid or has expired. Request a new one to continue.
        </p>
        <Button variant="brand" asChild>
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="password">New password</Label>
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
        <Label htmlFor="confirmPassword">Confirm new password</Label>
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
        Set new password
      </Button>
    </form>
  );
}
