import type { Metadata } from 'next';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SignUpForm } from '@/components/auth/sign-up-form';
import { OAuthButtons } from '@/components/auth/oauth-buttons';
import { oauthEnabled } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Create your account',
  description: 'Create a free SnapSaas account and start capturing screenshots.',
};

export default function SignUpPage() {
  const hasOAuth = oauthEnabled.google || oauthEnabled.github;

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Create your account</CardTitle>
        <CardDescription>
          Start with <span className="text-foreground font-medium">30 days of Pro, free</span> — no
          card required.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <OAuthButtons google={oauthEnabled.google} github={oauthEnabled.github} />
        {hasOAuth && (
          <div className="text-muted-foreground relative text-center text-xs">
            <span className="bg-card relative z-10 px-2">or sign up with email</span>
            <span className="bg-border absolute left-0 top-1/2 -z-0 h-px w-full" />
          </div>
        )}
        <SignUpForm />
      </CardContent>
    </Card>
  );
}
