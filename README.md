# AI Data Analysis Agent

> **Full-stack AI-powered data analysis platform** — upload a CSV, ask questions in plain English, get charts and insights instantly.

Built with **Next.js 14 (App Router)** · **PostgreSQL (Supabase)** · **Python FastAPI** · **GPT-4o** · **Clerk Auth** · **Stripe Billing**

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Prerequisites](#3-prerequisites)
4. [Repository Structure](#4-repository-structure)
5. [Environment Setup](#5-environment-setup)
6. [Database Setup](#6-database-setup)
7. [Running Locally](#7-running-locally)
8. [External Service Setup](#8-external-service-setup)
9. [Deployment](#9-deployment)
10. [Testing](#10-testing)
11. [Sprint Roadmap Summary](#11-sprint-roadmap-summary)
12. [Team Conventions](#12-team-conventions)
13. [Common Pitfalls](#13-common-pitfalls)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Project Overview

The AI Data Analysis Agent lets users:

- Upload CSV, XLSX, or JSON datasets (up to 50 MB)
- Ask natural-language questions ("What were the top 5 products by revenue last quarter?")
- Get plain-English answers, interactive charts, and generated Pandas code
- View auto-generated statistical insights for every dataset
- Export polished PDF and XLSX reports
- Collaborate with a team via organization accounts
- Subscribe to Pro/Team plans via Stripe

**MVP Timeline:** 16 weeks across 9 sprints  
**Team Size:** 3–6 engineers  
**Methodology:** Agile Scrum — 2-week sprints

---

## 2. Architecture

```
[ Browser / Mobile ]
        | HTTPS
[ Next.js App (Vercel) ] ─── Clerk Auth ─── Stripe Billing
        | REST / Server Actions
[ PostgreSQL (Supabase) ] + [ Supabase Storage (Files) ]
        | Internal REST (X-Secret header)
[ Python FastAPI AI Engine (Railway) ]
        | HTTPS
[ OpenAI GPT-4o API ]
```

**How a query flows:**
1. User types a question in the browser
2. Next.js API route authenticates the user, checks quota, gets a signed file URL
3. Next.js calls the Python AI engine with the question + schema + file URL
4. Python downloads the file, builds a GPT-4o prompt, executes the returned Pandas code safely
5. Result rows + plain-English answer + chart config are returned to Next.js
6. Next.js saves the Query record to PostgreSQL and returns the result to the browser
7. Browser renders the chart and answer

---

## 3. Prerequisites

Make sure you have these installed before starting:

| Tool | Minimum Version | Install |
|---|---|---|
| Node.js | 20.x | https://nodejs.org |
| npm | 10.x | Comes with Node.js |
| Python | 3.11+ | https://python.org |
| Git | 2.x | https://git-scm.com |

You will also need accounts (all have free tiers) at:

- [Supabase](https://supabase.com) — hosted PostgreSQL + file storage
- [Clerk](https://clerk.com) — authentication
- [Stripe](https://stripe.com) — payments (use test mode during development)
- [OpenAI](https://platform.openai.com) — GPT-4o API
- [Vercel](https://vercel.com) — Next.js hosting
- [Railway](https://railway.app) — Python API hosting

---

## 4. Repository Structure

```
ai-data-agent/
├── apps/
│   ├── web/                          # Next.js 14 frontend + API routes
│   │   ├── app/
│   │   │   ├── (auth)/               # Login, register, onboarding pages
│   │   │   ├── (dashboard)/          # Protected app pages
│   │   │   │   ├── dashboard/        # Home dashboard
│   │   │   │   ├── datasets/         # Dataset list + detail pages
│   │   │   │   ├── query/            # NLQ interface
│   │   │   │   ├── reports/          # Report builder
│   │   │   │   └── settings/         # Account + billing + team
│   │   │   ├── api/                  # Next.js API routes
│   │   │   │   ├── datasets/         # Upload, list, CRUD, preview
│   │   │   │   ├── query/            # NLQ relay to Python engine
│   │   │   │   ├── insights/         # Auto-insight endpoints
│   │   │   │   ├── export/           # PDF + XLSX export
│   │   │   │   ├── billing/          # Stripe checkout + portal
│   │   │   │   └── webhooks/         # Clerk + Stripe webhooks
│   │   │   └── pricing/              # Public pricing page
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn/ui base components
│   │   │   ├── charts/               # Recharts wrappers
│   │   │   ├── dataset/              # DataTable, UploadZone, SchemaPanel
│   │   │   ├── query/                # ChatInput, QueryResult, InsightCard
│   │   │   ├── reports/              # ReportBuilder, ReportPreview
│   │   │   └── layout/               # Sidebar, TopBar, PageHeader
│   │   ├── hooks/                    # Custom React hooks (SWR-based)
│   │   ├── lib/                      # Shared utilities and clients
│   │   │   ├── db.ts                 # Prisma singleton
│   │   │   ├── ai.ts                 # AI engine client
│   │   │   ├── storage.ts            # Supabase storage helpers
│   │   │   ├── stripe.ts             # Stripe client
│   │   │   ├── auth.ts               # Auth helper utilities
│   │   │   ├── report.ts             # PDF HTML template builder
│   │   │   └── utils.ts              # General utilities (cn, formatters)
│   │   ├── types/                    # Shared TypeScript types
│   │   ├── prisma/
│   │   │   ├── schema.prisma         # DB schema (single source of truth)
│   │   │   └── seed.ts               # Development seed data
│   │   └── __tests__/                # Vitest test files
│   │
│   └── ai-engine/                    # Python FastAPI microservice
│       ├── main.py                   # FastAPI app + auth guard
│       ├── routers/
│       │   ├── query.py              # NLQ endpoint
│       │   ├── insights.py           # Insight generation endpoint
│       │   ├── process.py            # File processing endpoint
│       │   └── clean.py              # Data cleaning endpoint
│       ├── services/
│       │   ├── llm.py                # OpenAI API + prompt engineering
│       │   ├── executor.py           # Safe Pandas code execution
│       │   ├── insights.py           # Statistical analysis logic
│       │   └── storage.py            # Supabase Python client
│       ├── sandbox/                  # Execution sandbox utilities
│       ├── tests/                    # pytest test files
│       ├── Dockerfile                # For Railway deployment
│       └── requirements.txt          # Python dependencies
│
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Lint + type check on every PR
│       └── deploy.yml                # Auto-deploy on push to main
├── .env.example                      # Template for all env variables
├── .gitignore
└── README.md
```

---

## 5. Environment Setup

### Step 1 — Clone the repository

```bash
git clone https://github.com/your-org/ai-data-agent.git
cd ai-data-agent
```

### Step 2 — Set up the Next.js app

```bash
cd apps/web
npm install
```

Create your local environment file:

```bash
cp ../../.env.example .env.local
```

Fill in all values in `.env.local` (see [Section 8](#8-external-service-setup) for where to get each value).

### Step 3 — Set up the Python AI engine

```bash
cd ../ai-engine
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create your Python env file:

```bash
cp .env.example .env
```

Fill in the OpenAI and Supabase keys.

---

## 6. Database Setup

### Step 1 — Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy the **Database URL** (Settings → Database → Connection string → URI)
3. Copy the **Supabase URL** and **anon key** (Settings → API)
4. Copy the **service role key** (Settings → API — keep this secret!)
5. Paste all values into `apps/web/.env.local`

### Step 2 — Run Prisma migrations

```bash
cd apps/web
npx prisma generate          # Generate TypeScript types from schema
npx prisma migrate dev --name init   # Create and apply the initial migration
```

### Step 3 — Enable Row-Level Security (RLS) in Supabase

After the migration runs, open the Supabase SQL editor and run the RLS policies from **Section 7.2 of the Build Roadmap**. This is mandatory — without RLS, users can access each other's data.

```sql
-- Enable RLS on all user-data tables
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
-- Then add the CREATE POLICY statements from Section 7.2
```

### Step 4 — Create the Supabase Storage bucket

In the Supabase dashboard, go to **Storage** and create a bucket named `datasets`:
- Set it to **Private** (not public)
- Set the file size limit to **50 MB**

### Step 5 — (Optional) Seed development data

```bash
cd apps/web
npx ts-node prisma/seed.ts
```

This creates a test user and sample dataset so you can explore the app without uploading real files.

### Useful Prisma commands

```bash
npx prisma studio          # Visual DB browser at localhost:5555
npx prisma migrate reset   # Wipe and re-apply all migrations (dev only!)
npx prisma migrate deploy  # Apply pending migrations in production
npx prisma generate        # Re-generate TypeScript types after schema changes
```

---

## 7. Running Locally

You need **two terminal windows** — one for the Next.js app, one for the Python engine.

### Terminal 1 — Next.js app

```bash
cd apps/web
npm run dev
```

The app runs at `http://localhost:3000`

### Terminal 2 — Python AI engine

```bash
cd apps/ai-engine
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

The API docs are at `http://localhost:8000/docs` (FastAPI auto-generated Swagger UI)

### Verifying the setup

1. Open `http://localhost:3000` — you should see the landing page
2. Click "Get Started" and create an account via Clerk
3. After login, you should land on the dashboard
4. Upload a CSV file — it should appear in the datasets list with status PROCESSING → READY
5. Navigate to the Query page, select your dataset, and type a question

---

## 8. External Service Setup

### Clerk (Authentication)

1. Create an app at [clerk.com](https://clerk.com)
2. Enable **Google OAuth** in Social Connections
3. Enable **Organizations** in the Clerk dashboard (required for Team plan)
4. Go to **Webhooks** and create a webhook pointing to `https://your-domain.com/api/webhooks/clerk`
   - Subscribe to: `user.created`, `user.updated`, `user.deleted`, `organization.created`, `organizationMembership.created`, `organizationMembership.deleted`
5. Copy the Publishable Key, Secret Key, and Webhook Secret into your `.env.local`

### Stripe (Billing)

1. Create an account at [stripe.com](https://stripe.com)
2. Go to **Products** and create two products:
   - **Pro Plan** — $15/month recurring → copy the **Price ID** (`price_xxx`)
   - **Team Plan** — $49/month recurring → copy the **Price ID** (`price_yyy`)
3. Update the `PRICE_IDS` constant in `apps/web/lib/stripe.ts` with your actual Price IDs
4. Go to **Developers → Webhooks** and add an endpoint: `https://your-domain.com/api/webhooks/stripe`
   - Subscribe to: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
5. Copy the Publishable Key, Secret Key, and Webhook Secret into your `.env.local`
6. Use **test mode** (toggle in top-left) during development — no real charges

**Testing Stripe locally:** Use the [Stripe CLI](https://stripe.com/docs/stripe-cli) to forward webhooks to localhost:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### OpenAI

1. Create an account at [platform.openai.com](https://platform.openai.com)
2. Go to **API Keys** and create a new key
3. Add the key to `apps/ai-engine/.env` as `OPENAI_API_KEY`
4. Ensure your account has GPT-4o access (may require billing setup)

---

## 9. Deployment

### Next.js → Vercel

1. Push your repository to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Set the **Root Directory** to `apps/web`
4. Add all environment variables from your `.env.local` file in the Vercel dashboard
5. Deploy — Vercel auto-deploys on every push to `main`

**Production Prisma migrations:**
```bash
# Run this after deploying schema changes
npx prisma migrate deploy
```

### Python AI Engine → Railway

1. Go to [railway.app](https://railway.app) and create a new project
2. Connect your GitHub repository
3. Set the **Root Directory** to `apps/ai-engine`
4. Railway will detect the `Dockerfile` and build automatically
5. Add all environment variables from `apps/ai-engine/.env.example` in the Railway dashboard
6. Copy the Railway app URL and set it as `AI_ENGINE_URL` in your Vercel environment variables

### Environment Variables Checklist

Before going live, verify these are set in **both** Vercel and Railway:

| Variable | Where | Notes |
|---|---|---|
| `DATABASE_URL` | Vercel | Supabase connection string |
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel | Public — safe for client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel | Public — safe for client |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel | Secret — server only |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Vercel | Public |
| `CLERK_SECRET_KEY` | Vercel | Secret |
| `CLERK_WEBHOOK_SECRET` | Vercel | Secret |
| `STRIPE_SECRET_KEY` | Vercel | Secret — use live key in prod |
| `STRIPE_WEBHOOK_SECRET` | Vercel | Secret |
| `AI_ENGINE_URL` | Vercel | Railway app URL |
| `AI_ENGINE_SECRET` | Vercel + Railway | Must match on both sides |
| `OPENAI_API_KEY` | Railway | OpenAI key |
| `SUPABASE_URL` | Railway | Same as NEXT_PUBLIC_SUPABASE_URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Railway | Same as in Vercel |

---

## 10. Testing

### Next.js tests (Vitest)

```bash
cd apps/web
npm run test          # Run all tests once
npm run test:watch    # Watch mode during development
```

### Python tests (pytest)

```bash
cd apps/ai-engine
source venv/bin/activate
pytest tests/ -v
```

### End-to-end tests (Playwright)

```bash
cd apps/web
npm run test:e2e      # Runs Playwright E2E tests
```

The E2E tests cover the critical user path:
1. Register a new account
2. Upload a sample CSV
3. Ask a natural-language question
4. Verify a chart and answer appear
5. Export a PDF report

### Coverage targets

| Layer | Target |
|---|---|
| API route unit tests | 80% |
| Python services unit tests | 85% |
| E2E critical paths | 100% (all 5 core flows) |
| Overall code coverage | ≥ 60% |

---

## 11. Sprint Roadmap Summary

| Sprint | Weeks | Focus | Done When... |
|---|---|---|---|
| S1 | 1–2 | Foundation: Auth, DB, File Upload, CI/CD | Users can register, upload a CSV, see it in Supabase |
| S2 | 3–4 | Data Layer: Preview table, Schema panel, Cleaning UI | Users can view and clean data with no code |
| S3 | 5–6 | AI Engine: Python service, GPT-4o, Safe executor | A query returns an answer + chart from real user data |
| S4 | 7–8 | Query UI: Chat interface, Chart renderer, History | NLQ experience is polished end-to-end |
| S5 | 9 | Insights: Auto-generation, Insight cards UI | 5+ insights appear automatically on every upload |
| S6 | 10 | Reports: PDF export, XLSX export, Builder UI | Users can download a branded PDF report |
| S7 | 11 | Billing: Stripe checkout, Plans, Webhooks, Quotas | Pro users can subscribe and get unlimited queries |
| S8 | 12–13 | Teams + Polish: Orgs, RBAC, Error handling, Tests | Teams can collaborate; test coverage > 60% |
| S9 | 14–16 | Launch: Security audit, RLS, Performance, Go-live | App is public, Stripe live, first paying user |

---

## 12. Team Conventions

### Git branching

```
main          → production (auto-deploys)
feature/*     → new features (PR into main)
fix/*         → bug fixes
chore/*       → dependency updates, config changes
```

- **No direct pushes to main** — all changes via Pull Request
- PR must pass CI (lint + type check) before merge
- Require at least **1 peer code review** before merging
- Use **conventional commits**: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`
- Keep PRs small and focused — one feature per PR

### Code style

- **TypeScript strict mode** — no `any` types unless explicitly justified
- **Prettier** for formatting — run `npm run format` before committing
- **ESLint** — must pass with zero errors before PR can merge
- Every Next.js API route **must** start with an auth check (use `requireAuth()` from `lib/auth.ts`)
- Never commit secrets or API keys — use environment variables always

### Weekly team cadence

| Meeting | Frequency | Duration | Purpose |
|---|---|---|---|
| Sprint Planning | Every 2 weeks (Mon) | 1–2h | Define sprint goals, assign tasks |
| Daily Standup | Daily | 15 min | Blockers, progress updates |
| Demo / Review | Every 2 weeks (Fri) | 1h | Demo completed work |
| Retrospective | Every 2 weeks (Fri) | 30 min | Process improvements |
| Tech Sync | Weekly | 30 min | Architecture decisions |

### Recommended tools

| Category | Tool |
|---|---|
| Project management | Linear or Jira |
| Communication | Slack (#general, #dev, #deployments, #bugs) |
| Design | Figma — design screens before building |
| API testing | Insomnia or Postman |
| DB browsing | Prisma Studio (`npx prisma studio`) or TablePlus |
| Error tracking | Sentry (set up from Day 1) |
| Docs | Notion or Confluence |

---

## 13. Common Pitfalls

| Pitfall | How to Avoid |
|---|---|
| Running LLM-generated code without validation | Always pass through `executor.py is_safe()` first — never skip this |
| Forgetting auth checks on API routes | Use `requireAuth()` from `lib/auth.ts` as the very first line of every route |
| Not enabling Supabase RLS | Enable RLS on all tables before you have real user data — retrofitting is risky |
| Committing `.env` files to git | Check `.gitignore` includes `.env`, `.env.local`, `.env.production` |
| Uploading files through the Next.js server | Always upload to Supabase Storage directly — never pipe through Next.js |
| Blocking the API with synchronous AI calls | Dataset processing and insight generation must be async / fire-and-forget |
| Hardcoding OpenAI model names | Use `OPENAI_MODEL` env var — update without a code deploy when models change |
| Ignoring Stripe webhook idempotency | Use `upsert` not `create` in all webhook handlers |
| Not testing billing cancellation | Test the full cancel → downgrade → quota enforcement flow in test mode |
| Deploying without error monitoring | Set up Sentry before your first real user — you cannot fix bugs you cannot see |

---

## 14. Troubleshooting

**"Prisma client not found" error**
```bash
cd apps/web && npx prisma generate
```

**"Database URL not set" error**
Make sure your `.env.local` file exists in `apps/web/` and contains `DATABASE_URL`.

**AI engine returns 403 Forbidden**
The `AI_ENGINE_SECRET` in your Next.js `.env.local` must exactly match the `AI_ENGINE_SECRET` in `apps/ai-engine/.env`.

**File upload fails with "storage error"**
1. Verify your Supabase `datasets` bucket exists and is set to **Private**
2. Check that `SUPABASE_SERVICE_ROLE_KEY` is set correctly (not the anon key)

**Clerk webhook not firing (users not syncing to DB)**
1. Verify the webhook URL in Clerk dashboard matches your deployed app URL exactly
2. Use `stripe listen` (or `ngrok`) to expose `localhost:3000` for local webhook testing
3. Check Clerk webhook logs in the Clerk dashboard for delivery failures

**Python AI engine times out on large files**
The default timeout is 20 seconds. For large datasets, consider:
- Increasing `timeout` in `executor.py`
- Pre-sampling the dataset to 10,000 rows before sending to the LLM

**Charts not rendering**
Check that the `chartConfig` returned by the AI engine matches the expected structure:
`{ type: 'bar' | 'line' | 'pie' | 'scatter' | 'area' | 'table', columns: string[] }`

---

## License

Internal use only — AI Data Analysis Agent v1.0 — March 2026
