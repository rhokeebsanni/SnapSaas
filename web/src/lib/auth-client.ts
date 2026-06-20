import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  // Falls back to the current origin when unset, which is what we want in dev.
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;

// Password reset + email verification. `requestPasswordReset` emails the reset
// link; `resetPassword` consumes the token to set the new password.
export const requestPasswordReset = authClient.requestPasswordReset;
export const resetPassword = authClient.resetPassword;
export const sendVerificationEmail = authClient.sendVerificationEmail;
