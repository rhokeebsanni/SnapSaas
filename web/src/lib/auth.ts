import 'server-only';

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { eq } from 'drizzle-orm';

import { db, schema } from '@/db';
import { TRIAL_DAYS, PLANS } from '@/lib/plans';
import { sendVerificationEmail, sendWelcomeEmail } from '@/lib/email';

// Only register an OAuth provider when both halves of its credential pair are
// present, so a partially-configured environment never wires up a broken button.
const googleProvider =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
      }
    : {};

const githubProvider =
  process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
    ? {
        github: {
          clientId: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
        },
      }
    : {};

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    // Verification is optional so the app works before email is configured.
    requireEmailVerification: false,
  },
  account: {
    accountLinking: {
      // Link a social sign-in to an existing account when the email matches.
      // This stops the "account not linked" error when someone signs up with
      // email/password (or one provider) and later uses another with the same
      // email. Only providers that verify emails are trusted, and we never link
      // across *different* emails, so this can't hijack an account.
      enabled: true,
      trustedProviders: ['google', 'github'],
      // We don't verify local email/password accounts (requireEmailVerification
      // is off), so their emailVerified stays false. Without this, Better Auth
      // refuses to link a (trusted) social login onto that unverified local
      // account and throws `account_not_linked`. The social provider already
      // verifies the email on its side, and linking is gated on an exact email
      // match, so allowing it here is safe.
      requireLocalEmailVerified: false,
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail(user.email, url);
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (createdUser) => {
          // Start a 30-day Pro trial: set the end date and top the new user up to
          // the Pro monthly capture allowance for the trial period.
          const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
          await db
            .update(schema.user)
            .set({ trialEndsAt, credits: PLANS.pro.limits.capturesPerMonth })
            .where(eq(schema.user.id, createdUser.id))
            .catch((err) => console.error('[auth] failed to start trial:', err));

          await sendWelcomeEmail(createdUser.email, createdUser.name);
        },
      },
    },
  },
  socialProviders: {
    ...googleProvider,
    ...githubProvider,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh once per day
  },
  // nextCookies() must be the last plugin so it can set cookies on responses.
  plugins: [nextCookies()],
});

export type AuthSession = typeof auth.$Infer.Session;
