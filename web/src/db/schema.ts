import { boolean, integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import type { CaptureSettings } from '@/lib/capture';

/**
 * Auth tables follow the Better Auth core schema (model names `user`,
 * `session`, `account`, `verification` and the field keys it expects). We add
 * a couple of product columns (`plan`, `credits`) to `user` with DB-level
 * defaults so Better Auth can keep inserting only its own fields.
 */

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified')
    .$defaultFn(() => false)
    .notNull(),
  image: text('image'),

  // Product fields (managed by SnapSaas, not Better Auth).
  plan: text('plan').notNull().default('free'),
  credits: integer('credits').notNull().default(10),

  createdAt: timestamp('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updated_at')
    .$defaultFn(() => new Date())
    .notNull(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()),
});

/**
 * Product tables: a `project` is one source URL, a `job` is one capture run
 * (queued → processing → done/failed), and `asset` rows are the rendered
 * outputs stored in R2.
 */

export const project = pgTable('project', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  sourceUrl: text('source_url').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const job = pgTable('job', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => project.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('queued'),
  settings: jsonb('settings').$type<CaptureSettings>().notNull(),
  error: text('error'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const asset = pgTable('asset', {
  id: text('id').primaryKey(),
  jobId: text('job_id')
    .notNull()
    .references(() => job.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  r2Key: text('r2_key').notNull(),
  url: text('url').notNull(),
  format: text('format').notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  hasWatermark: boolean('has_watermark').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const subscription = pgTable('subscription', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  lemonSqueezyId: text('lemon_squeezy_id').notNull().unique(),
  customerId: text('customer_id'),
  status: text('status').notNull(),
  plan: text('plan').notNull(),
  variantId: text('variant_id'),
  customerPortalUrl: text('customer_portal_url'),
  renewsAt: timestamp('renews_at'),
  endsAt: timestamp('ends_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type User = typeof user.$inferSelect;
export type Session = typeof session.$inferSelect;
export type Project = typeof project.$inferSelect;
export type Job = typeof job.$inferSelect;
export type Asset = typeof asset.$inferSelect;
export type Subscription = typeof subscription.$inferSelect;
