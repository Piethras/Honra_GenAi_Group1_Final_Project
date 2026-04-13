# InsightForge — AI Data Analysis Agent

A full-stack AI-powered data analytics platform. Upload CSV/Excel files, ask questions in plain English, and get charts, insights, and exportable reports — no coding required.

Ai-agent:
cd apps\ai-engine
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
http://localhost:8000/health

Front-end:
cd apps\web
npm run dev
http://localhost:3000

http://localhost:3000/auth/login 

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS + shadcn/ui |
| Auth | Clerk |
| Database | PostgreSQL via Supabase + Prisma ORM |
| File Storage | Supabase Storage |
| AI Engine | Python FastAPI + OpenAI GPT-4o |
| Billing | Stripe |
| Charts | Recharts + Plotly.js |
| Deployment | Vercel (frontend) + Railway (AI engine) |

## Prerequisites

- Node.js 18+
- Python 3.11+
- A [Supabase](https://supabase.com) project (free tier works)
- A [Clerk](https://clerk.com) account (free tier works)
- A [Stripe](https://stripe.com) account (test mode)
- An [OpenAI](https://platform.openai.com) API key

## Quick Start

### 1. Clone and install

```bash
git clone <your-repo>
cd insightforge

# Install Next.js dependencies
cd apps/web
npm install

# Install Python dependencies
cd ../ai-engine
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Set up environment variables

Copy `apps/web/.env.example` to `apps/web/.env.local` and fill in all values.
Copy `apps/ai-engine/.env.example` to `apps/ai-engine/.env` and fill in all values.

### 3. Set up the database

```bash
cd apps/web
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Configure Clerk

- Create a Clerk application at https://clerk.com
- Enable Google OAuth in Clerk dashboard
- Add webhook endpoint: `https://your-domain.com/api/webhooks/clerk`
- Select events: `user.created`, `user.updated`, `organization.created`, `organizationMembership.created`

### 5. Configure Stripe

- Create products in Stripe: Pro ($15/mo) and Team ($49/mo)
- Copy price IDs into `apps/web/app/api/billing/checkout/route.ts`
- Add webhook endpoint: `https://your-domain.com/api/webhooks/stripe`
- Select events: `checkout.session.completed`, `customer.subscription.deleted`, `customer.subscription.updated`

### 6. Configure Supabase Storage

- Create a private bucket called `datasets`
- Set max file size to 50MB

### 7. Run locally

Terminal 1 — Next.js:
```bash
cd apps/web
npm run dev
```

Terminal 2 — Python AI engine:
```bash
cd apps/ai-engine
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

Open http://localhost:3000

## Project Structure

```
AI-DATA-AGENT/
├── apps/
│   ├── web/                    # Next.js 14 app
│   │   ├── app/
│   │   │   ├── auth/           # Login, register pages
│   │   │   ├── dashboard/      # Protected app pages
│   │   │   └── api/            # API routes
│   │   ├── components/         # React components
│   │   ├── lib/                # Utilities (db, storage, stripe, ai)
│   │   └── prisma/             # Database schema & migrations
│   └── ai-engine/              # Python FastAPI microservice
│       ├── routers/            # Route handlers
│       └── services/           # LLM, executor, insights
└── .github/workflows/          # CI/CD pipelines
```

## Deployment

### Frontend (Vercel)
1. Push to GitHub
2. Import repo in Vercel
3. Set root directory to `apps/web`
4. Add all environment variables
5. Deploy

### AI Engine (Railway)
1. Create a new Railway project
2. Point to `apps/ai-engine`
3. Railway auto-detects the Dockerfile
4. Add environment variables
5. Deploy — Railway gives you a public URL (set as `AI_ENGINE_URL` in Vercel)

## Subscription Tiers

| Feature | Free | Pro ($15/mo) | Team ($49/mo) |
|---|---|---|---|
| Datasets | 2 | Unlimited | Unlimited |
| Queries/month | 20 | Unlimited | Unlimited |
| File size | 10 MB | 50 MB | 200 MB |
| Users | 1 | 1 | Up to 10 |
| Report exports | 3/month | Unlimited | Unlimited |

## License

MIT
