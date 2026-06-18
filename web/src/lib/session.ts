import 'server-only';

import { headers } from 'next/headers';

import { auth } from '@/lib/auth';

/** Read the current session in a Server Component / Route Handler. */
export async function getServerSession() {
  return auth.api.getSession({ headers: await headers() });
}

/** True OAuth availability is server-only (depends on secret env vars). */
export const oauthEnabled = {
  google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  github: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
};
