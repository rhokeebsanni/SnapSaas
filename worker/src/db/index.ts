import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { env } from '../env';
import * as schema from './schema';

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

/** Lazily create the DB client. Returns null when DATABASE_URL is not set. */
export function getDb() {
  if (dbInstance) return dbInstance;
  if (!env.DATABASE_URL) return null;
  const client = postgres(env.DATABASE_URL, { prepare: false });
  dbInstance = drizzle(client, { schema });
  return dbInstance;
}

export { schema };
