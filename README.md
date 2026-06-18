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

> Status: 🚧 In active development, built phase by phase. See [Roadmap](#roadmap).

---

## Tech stack

| Area          | Choice                                                          |
| ------------- | --------------------------------------------------------------- |
| Frontend      | Next.js 16 (App Router) · TypeScript (strict) · Tailwind CSS v4 |
| UI            | shadcn/ui · Framer Motion · Zustand (editor state)              |
| App API       | Next.js Route Handlers                                          |
| Screenshot    | **Separate Node worker** (Express + TS) · Playwright · Sharp    |
| Database      | PostgreSQL (Neon) · Drizzle ORM                                 |
| Auth          | Better Auth (email/password + Google + GitHub)                  |
| Storage       | Cloudflare R2 (S3-compatible)                                   |
| Queue         | BullMQ + Upstash Redis                                          |
| Payments      | Lemon Squeezy (Merchant of Record)                              |
| Email         | Resend + React Email                                            |
| Rate limiting | Upstash sliding-window                                          |
| Deploy        | Vercel (app) · Railway/Fly (worker) · Neon · Upstash · R2       |

## Architecture

```
User → Next.js (landing + dashboard + editor)
         │
         ├── /api/capture  → validates URL, checks plan/credits,
         │                    enqueues a BullMQ job, returns jobId
         │
         ├── Worker (Playwright) ← pulls job from queue
         │       1. launch chromium, goto(url), wait for network idle
         │       2. screenshot (retina, full-page or viewport)
         │       3. Sharp composites: frame + bg + shadow + padding
         │       4. upload result(s) to R2
         │       5. write asset row to Postgres, mark job done
         │
         ├── /api/jobs/:id → poll status (or SSE stream)
         └── Lemon Squeezy webhooks → update subscription/credits
```

This is a **monorepo** using npm workspaces:

```
.
├── web/      → Next.js app (landing, dashboard, editor, app API)
└── worker/   → Express + Playwright + Sharp screenshot worker
```

## Getting started

### Prerequisites

- Node.js **20.9+**
- npm 10+
- (For real captures) accounts for the services in `.env.example`

### 1. Clone & install

```bash
git clone <repo-url> snapsaas
cd snapsaas
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in the values you have. The app degrades gracefully where a service is not
yet configured, so you can start the UI before wiring up every integration.

### 3. Run locally

```bash
# runs the Next.js app (web) and the worker together
npm run dev
```

- Web: http://localhost:3000
- Worker health: http://localhost:4000/health

### Useful scripts

| Command             | Description                           |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Run web + worker concurrently         |
| `npm run build`     | Production build of both workspaces   |
| `npm run typecheck` | TypeScript checks across the monorepo |
| `npm run lint`      | ESLint across the monorepo            |
| `npm run format`    | Prettier write                        |

## Roadmap

Built in phases, each ending in a real commit:

- [x] **Phase 0** — Repo, monorepo tooling, CI
- [ ] **Phase 1** — Design system & landing page
- [ ] **Phase 2** — Auth (Better Auth + Drizzle/Neon)
- [ ] **Phase 3** — Screenshot engine (Playwright + Sharp)
- [ ] **Phase 4** — Queue, storage, job lifecycle
- [ ] **Phase 5** — Editor / dashboard
- [ ] **Phase 6** — Monetization (Lemon Squeezy)
- [ ] **Phase 7** — Polish, SEO, analytics
- [ ] **Phase 8** — Deploy

## License

This project is a portfolio build. All rights reserved unless stated otherwise.
