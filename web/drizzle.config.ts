import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    // Provided at runtime by `dotenv-cli` (local) or the platform (CI/prod).
    // Not needed for `drizzle-kit generate`.
    url: process.env.DATABASE_URL ?? '',
  },
  verbose: true,
  strict: true,
});
