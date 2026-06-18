import path from 'node:path';
import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

// The monorepo keeps a single `.env` at the repo root. Load that first, then
// allow a worker-local `.env` to override during local development.
loadDotenv({ path: path.resolve(process.cwd(), '../.env') });
loadDotenv({ path: path.resolve(process.cwd(), '.env'), override: true });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  INTERNAL_API_SECRET: z.string().min(1).default('dev-internal-secret-change-me'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid worker environment variables:');
  console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
