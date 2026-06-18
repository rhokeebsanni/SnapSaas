# 🚀 SnapSaas

**Turn any website URL into launch-ready marketing screenshots in seconds.**

Paste a URL → pick a style (frame + background + layout) → SnapSaas visits the
site, captures a high-quality screenshot, drops it inside a polished device
frame (browser window, iPhone, MacBook), applies a beautiful background, and
outputs share-ready assets for product launches, portfolios, social media, and
landing pages.

It kills the tedious _screenshot → design-tool → mockup_ workflow. It is **not**
another Figma — it's a one-click "make my site look gorgeous" machine for
founders, devs, and indie hackers.

---

## Table of contents

- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Monorepo layout](#monorepo-layout)
- [Local development](#local-development)
- [Environment variables](#environment-variables)
- [Database migrations](#database-migrations)
- [Deployment](#deployment)
- [Services you need to provision](#services-you-need-to-provision)
- [Scripts](#scripts)
- [Roadmap](#roadmap)

## Tech stack

| Area          | Choice                                                          |
| ------------- | --------------------------------------------------------------- |
| Frontend      | Next.js 16 (App Router) · TypeScript (strict) · Tailwind CSS v4 |
| UI            | shadcn/ui (Radix) · Framer Motion · Zustand (editor state)      |
| App API       | Next.js Route Handlers                                          |
| Screenshot    | **Separate Node worker** (Express + TS) · Playwright · Sharp    |
| Database      | PostgreSQL (Neon) · Drizzle ORM                                 |
| Auth          | Better Auth (email/password + Google + GitHub)                  |
| Storage       | Cloudflare R2 (S3-compatible)                                   |
| Queue         | BullMQ + Upstash Redis                                          |
| Payments      | Lemon Squeezy (Merchant of Record)                              |
| Email         | Resend                                                          |
| Rate limiting | Upstash sliding-window                                          |
| Analytics     | Vercel Analytics                                                |
| Deploy        | Vercel (app) · Railway/Fly (worker) · Neon · Upstash · R2       |

## Architecture

```
User → Next.js (landing + dashboard + editor)
         │
         ├── POST /api/capture  → auth + rate-limit + SSRF check, plan/credit
         │                        gating, creates project+job, enqueues BullMQ
         │
         ├── Worker (Playwright) ← pulls job from the queue
         │       1. launch chromium, goto(url), wait for network idle
         │       2. screenshot (retina, full-page or viewport)
         │       3. Sharp composites: frame + bg + shadow + padding (+watermark)
         │       4. upload PNG/JPG/WebP to R2
         │       5. write asset rows to Postgres, mark job done, email user
         │
         ├── GET /api/jobs/:id → editor polls until done, shows results
         └── Lemon Squeezy webhooks → update subscription + plan + credits
```

## Monorepo layout

npm workspaces:

```
.
├── web/      → Next.js app (landing, auth, dashboard, editor, app API)
│   └── drizzle/   → generated SQL migrations (source of truth)
├── worker/   → Express + Playwright + Sharp screenshot worker (Dockerized)
├── vercel.json    → builds the web workspace
└── .env.example   → every environment variable, documented
```

## Local development

### Prerequisites

- Node.js **20.9+** and npm 10+
- A Postgres database (Neon, or local) and ideally an Upstash Redis for the queue

### 1. Install

```bash
npm install
# Install the headless browser the worker needs (once):
npx playwright install chromium
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in what you have. The app **degrades gracefully**: pages build and render
without external services, and each integration activates once its keys are set.
The local dev scripts load this single root `.env` (the worker reads it
directly; the web app reads it via `dotenv-cli`).

### 3. Run

```bash
npm run dev          # web (http://localhost:3000) + worker (http://localhost:4000) together
```

## Environment variables

All variables are documented in [`.env.example`](./.env.example). Summary:

- **Core** — `NEXT_PUBLIC_APP_URL`, `WORKER_URL`, `INTERNAL_API_SECRET`
- **Database** — `DATABASE_URL` (Neon Postgres)
- **Auth** — `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_*`, `GITHUB_*`
- **Queue / rate limit** — `REDIS_URL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- **Storage** — `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL`
- **Payments** — `LEMONSQUEEZY_API_KEY`, `LEMONSQUEEZY_STORE_ID`, `LEMONSQUEEZY_WEBHOOK_SECRET`, `LEMONSQUEEZY_*_VARIANT_ID`
- **Email** — `RESEND_API_KEY`, `EMAIL_FROM`

> Anything prefixed `NEXT_PUBLIC_` is exposed to the browser. Never put secrets there.

## Database migrations

Migrations are generated from the Drizzle schema and committed under
`web/drizzle/`. With `DATABASE_URL` set:

```bash
npm run db:migrate     # apply committed migrations
# or, for rapid local iteration:
npm run db:push        # push schema directly (no migration files)
npm run db:studio      # open Drizzle Studio
```

## Deployment

### Web app → Vercel

1. Import the repo into Vercel. Keep the **Root Directory at the repo root** —
   the included `vercel.json` installs the workspace and builds `web`.
2. Add every non-worker env var from `.env.example` in the Vercel dashboard.
3. Set `NEXT_PUBLIC_APP_URL` and `BETTER_AUTH_URL` to your production URL.

### Worker → Railway or Fly.io (Docker)

The worker ships a [`Dockerfile`](./worker/Dockerfile) built on the official
Playwright image (browsers + fonts preinstalled). Build from the **repo root**:

```bash
docker build -f worker/Dockerfile -t snapsaas-worker .
```

On Railway/Fly, point the build at `worker/Dockerfile` with the build context at
the repo root, and set the worker env vars (`DATABASE_URL`, `REDIS_URL`,
`R2_*`, `INTERNAL_API_SECRET`, optionally `RESEND_API_KEY`, `EMAIL_FROM`,
`NEXT_PUBLIC_APP_URL`).

### Webhooks

In Lemon Squeezy, add a webhook pointing to
`https://<your-app>/api/webhooks/lemonsqueezy` with the same
`LEMONSQUEEZY_WEBHOOK_SECRET`, subscribed to subscription events.

## Services you need to provision

To run end-to-end in production, create accounts and add the keys:

| Service                                   | Why                       | Keys                                |
| ----------------------------------------- | ------------------------- | ----------------------------------- |
| [Neon](https://neon.tech)                 | Postgres database         | `DATABASE_URL`                      |
| [Upstash](https://upstash.com)            | Redis queue + rate limit  | `REDIS_URL`, `UPSTASH_REDIS_REST_*` |
| [Cloudflare R2](https://cloudflare.com)   | Asset storage             | `R2_*`                              |
| [Lemon Squeezy](https://lemonsqueezy.com) | Payments                  | `LEMONSQUEEZY_*`                    |
| [Resend](https://resend.com)              | Transactional email       | `RESEND_API_KEY`                    |
| Google / GitHub OAuth                     | Social sign-in (optional) | `GOOGLE_*`, `GITHUB_*`              |

## Scripts

| Command              | Description                           |
| -------------------- | ------------------------------------- |
| `npm run dev`        | Run web + worker concurrently         |
| `npm run build`      | Production build of both workspaces   |
| `npm run typecheck`  | TypeScript checks across the monorepo |
| `npm run lint`       | ESLint across the monorepo            |
| `npm run format`     | Prettier write                        |
| `npm run db:migrate` | Apply database migrations             |

## Roadmap

- [x] **Phase 0** — Repo, monorepo tooling, CI
- [x] **Phase 1** — Design system & landing page
- [x] **Phase 2** — Auth (Better Auth + Drizzle/Neon)
- [x] **Phase 3** — Screenshot engine (Playwright + Sharp)
- [x] **Phase 4** — Queue, storage, job lifecycle
- [x] **Phase 5** — Editor / dashboard
- [x] **Phase 6** — Monetization (Lemon Squeezy)
- [x] **Phase 7** — Polish, SEO, analytics, emails, rate limiting
- [x] **Phase 8** — Deploy

### Stretch goals

Batch mode · auto device-frame detection · animated (scrolling) exports ·
Figma plugin & Chrome extension · AI background generation · public REST API.

## License

Portfolio build. All rights reserved unless stated otherwise.
