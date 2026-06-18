import 'server-only';

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // We don't throw at import time so `next build` (which doesn't run queries)
  // still succeeds. Any actual DB call will fail loudly with a clear message.
  console.warn('[db] DATABASE_URL is not set — database operations will fail until configured.');
}

/**
 * postgres.js connects lazily on first query, so constructing the client with a
 * placeholder URL is safe at build time. `prepare: false` keeps us compatible
 * with transaction-mode poolers like Neon's PgBouncer endpoint.
 */
const client = postgres(connectionString ?? 'postgresql://user:pass@localhost:5432/snapsaas', {
  prepare: false,
});

export const db = drizzle(client, { schema });
export { schema };
