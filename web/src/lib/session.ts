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
    // During static prerender there's no request, so `headers()` throws a
    // DYNAMIC_SERVER_USAGE error — that's expected and just forces the page to
    // render dynamically. Only log genuinely unexpected failures.
    const digest = (err as { digest?: string })?.digest;
    if (digest !== 'DYNAMIC_SERVER_USAGE') {
      console.error('[auth] getSession failed:', err);
    }
    return null;
  }
}

/**
 * True OAuth availability is server-only (depends on secret env vars). Computed
 * per access (a getter, not a frozen module-load constant) so it always
 * reflects the current environment rather than whatever was set when this
 * module was first imported.
 */
export const oauthEnabled = {
  get google() {
    return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  },
  get github() {
    return Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
  },
};
