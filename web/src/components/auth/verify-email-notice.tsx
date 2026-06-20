'use client';

import * as React from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { LoaderCircle, MailCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { sendVerificationEmail } from '@/lib/auth-client';

/** Shown after sign-up when email verification is required. */
export function VerifyEmailNotice({ email }: { email: string }) {
  const [pending, setPending] = React.useState(false);

  async function resend() {
    setPending(true);
    const { error } = await sendVerificationEmail({ email, callbackURL: '/dashboard' });
    setPending(false);
    if (error) {
      toast.error(error.message ?? 'Could not resend the email.');
    } else {
      toast.success('Verification email sent again.');
    }
  }

  return (
    <div className="grid gap-4 text-center">
      <div className="bg-brand/15 text-brand mx-auto grid size-12 place-items-center rounded-full">
        <MailCheck className="size-6" />
      </div>
      <div>
        <h2 className="text-lg font-semibold">Verify your email</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          We sent a verification link to{' '}
          <span className="text-foreground font-medium">{email}</span>. Click it to activate your
          account, then sign in.
        </p>
      </div>
      <Button variant="outline" onClick={resend} disabled={pending}>
        {pending && <LoaderCircle className="size-4 animate-spin" />}
        Resend email
      </Button>
      <p className="text-muted-foreground text-xs">
        Wrong address?{' '}
        <Link href="/sign-up" className="text-foreground underline-offset-4 hover:underline">
          Start over
        </Link>
      </p>
    </div>
  );
}
