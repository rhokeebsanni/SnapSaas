import * as React from 'react';
import type { Metadata } from 'next';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SignInForm } from '@/components/auth/sign-in-form';
import { OAuthButtons } from '@/components/auth/oauth-buttons';
import { oauthEnabled } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to your SnapSaas account.',
};

// Reads ?next= via useSearchParams in the form, so render dynamically.
export const dynamic = 'force-dynamic';

export default function SignInPage() {
  const hasOAuth = oauthEnabled.google || oauthEnabled.github;

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to keep making gorgeous screenshots.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <OAuthButtons google={oauthEnabled.google} github={oauthEnabled.github} />
        {hasOAuth && (
          <div className="text-muted-foreground relative text-center text-xs">
            <span className="bg-card relative z-10 px-2">or continue with email</span>
            <span className="bg-border absolute left-0 top-1/2 -z-0 h-px w-full" />
          </div>
        )}
        <React.Suspense fallback={null}>
          <SignInForm />
        </React.Suspense>
      </CardContent>
    </Card>
  );
}
