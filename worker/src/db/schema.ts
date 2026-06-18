import { boolean, integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import type { CaptureSettings } from '../types';

/**
 * The web app owns the schema + migrations. The worker mirrors only the tables
 * it writes (`job`, `asset`) so it can update job status and insert rendered
 * assets. Keep these column definitions in sync with web/src/db/schema.ts.
 */

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
});

export const job = pgTable('job', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull(),
  userId: text('user_id').notNull(),
  status: text('status').notNull().default('queued'),
  settings: jsonb('settings').$type<CaptureSettings>().notNull(),
  error: text('error'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const asset = pgTable('asset', {
  id: text('id').primaryKey(),
  jobId: text('job_id').notNull(),
  userId: text('user_id').notNull(),
  r2Key: text('r2_key').notNull(),
  url: text('url').notNull(),
  format: text('format').notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  hasWatermark: boolean('has_watermark').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
