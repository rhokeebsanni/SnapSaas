import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  // Falls back to the current origin when unset, which is what we want in dev.
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
