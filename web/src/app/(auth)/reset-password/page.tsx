import * as React from 'react';
import type { Metadata } from 'next';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export const metadata: Metadata = {
  title: 'Reset password',
  description: 'Choose a new password for your SnapSaas account.',
};

// Reads ?token=/?error= via useSearchParams, so render dynamically.
export const dynamic = 'force-dynamic';

export default function ResetPasswordPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Set a new password</CardTitle>
        <CardDescription>Choose a strong password you don’t use elsewhere.</CardDescription>
      </CardHeader>
      <CardContent>
        <React.Suspense fallback={null}>
          <ResetPasswordForm />
        </React.Suspense>
      </CardContent>
    </Card>
  );
}
