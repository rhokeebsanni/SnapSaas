import 'server-only';

import { headers } from 'next/headers';

import { auth } from '@/lib/auth';

/**
 * Read the current session in a Server Component / Route Handler.
 *
 * If the session lookup throws (e.g. the database is unreachable), we must NOT
 * let it bubble: a thrown error here makes protected pages crash or bounce to
 * /sign-in, which looks exactly like being silently logged out. Returning null
 * keeps that behaviour explicit and recoverable.
 */
export async function getServerSession() {
  try {
    return await auth.api.getSession({ headers: await headers() });
  } catch (err) {
    console.error('[auth] getSession failed:', err);
    return null;
  }
}

/** True OAuth availability is server-only (depends on secret env vars). */
export const oauthEnabled = {
  google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  github: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
};
