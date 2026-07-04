# SalesFunnel

Production-ready outbound lead generation and personalized cold email automation platform. Built for internal B2B sales use, designed to be convertible to multi-tenant SaaS.

## What it does

1. Import leads via CSV or manual entry
2. Enrich company data (website scrape → Phase 4: Clearbit/Apollo)
3. Generate personalized cold email drafts using Claude AI
4. Review and approve drafts before sending
5. Send via Gmail API (OAuth)
6. Track campaign stages, replies, follow-up sequences
7. Dashboard with pipeline visibility

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 App Router | API + frontend in one repo, easy to deploy |
| Database | PostgreSQL + Prisma | Relational, typed, migrations |
| Auth | NextAuth v5 (Auth.js) | Google OAuth built-in, PrismaAdapter |
| Jobs | pg-boss | Same PostgreSQL DB, no Redis needed, retry/DLQ |
| AI | Anthropic Claude (claude-sonnet-4-6) | Best-in-class for structured generation |
| Email | Gmail API via OAuth | Sends from your real mailbox |
| UI | Tailwind CSS | Clean internal tool aesthetic |

## Prerequisites

- Node.js 18+
- PostgreSQL database
- Google Cloud project (for OAuth + Gmail API)
- Anthropic API key (for AI drafts)

## Setup

### 1. Clone and install

```bash
git clone <repo>
cd salesfunnel
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your values. See below for how to get each credential.

### 3. Database

```bash
npm run db:migrate    # Run migrations
npm run db:seed       # Load sample data
```

### 4. Run the app

```bash
npm run dev           # Next.js on http://localhost:3000
npm run worker        # Background job worker (separate terminal)
```

## Getting Credentials

### Google OAuth + Gmail

1. Go to https://console.cloud.google.com/
2. Create a new project
3. Enable: **Google+ API**, **Gmail API**
4. Go to **APIs & Services → Credentials → Create OAuth 2.0 Client ID**
5. Application type: Web application
6. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
7. Copy Client ID → `GOOGLE_CLIENT_ID`
8. Copy Client Secret → `GOOGLE_CLIENT_SECRET`

**Important scopes requested during OAuth:**
- `openid`, `email`, `profile` — for login
- `https://www.googleapis.com/auth/gmail.send` — for sending
- `https://www.googleapis.com/auth/gmail.readonly` — for reply sync

### Anthropic API

1. Go to https://console.anthropic.com/
2. Create an API key
3. Copy to `ANTHROPIC_API_KEY`

### NEXTAUTH_SECRET

Generate a secure random string:
```bash
openssl rand -base64 32
```

## Architecture

### Provider Abstractions

All external integrations are behind interfaces:

```
src/providers/
  email/      IEmailProvider   — Gmail today, SendGrid/Mailgun later
  enrichment/ IEnrichmentProvider — website scrape today, Clearbit/Apollo later
  ai/         IAIProvider      — Claude today, swappable
```

To add a new email provider: implement `IEmailProvider`, add a case in `email/index.ts`.

### Job System (pg-boss)

The worker process handles all async work:

| Job | Trigger | What it does |
|---|---|---|
| `enrich-company` | Manual / import | Scrapes company website |
| `generate-personalization` | After enrichment | AI personalization brief |
| `generate-draft` | After personalization | AI cold email draft |
| `send-email` | After approval | Gmail API send |
| `schedule-followups` | After send | Creates FollowUpSchedule rows |
| `sync-replies` | Every 15 min (cron) | Checks Gmail threads for replies |

Run the worker:
```bash
npm run worker
```

### Service Layer

All DB access is in `src/services/`. API routes call services, never Prisma directly.

### Multi-tenant SaaS Path

To convert to SaaS:
1. Add `workspaceId` to all models (similar to `tenant_id` in the bxlenz project)
2. Scope all service queries by `workspaceId`
3. Add workspace creation + user invite flows
4. Gate enrichment/AI usage by subscription tier

## Gmail Limitations

> Gmail alone does not support pixel-based open tracking or click tracking.

The `GmailProvider` marks `supportsOpenTracking = false` and `supportsClickTracking = false`. The UI will show these as unavailable.

To enable open/click tracking in the future:
1. Implement `SendGridProvider` or `MailgunProvider` implementing `IEmailProvider`
2. Set `supportsOpenTracking = true`
3. Handle inbound webhook events for opens/clicks → `TrackingEvent` records
4. Switch the provider in `email/index.ts`

**Reply detection** works via Gmail thread sync (checks if a thread has > 1 message), running every 15 minutes in the worker.

## Phase Roadmap

| Phase | Status | Features |
|---|---|---|
| 1 | ✅ Done | Foundation, CRUD, CSV import, campaigns, templates, approvals queue, job system skeleton |
| 2 | Planned | Gmail OAuth connect flow, send from dashboard, draft generation trigger from UI |
| 3 | Planned | Follow-up automation engine, reply sync, campaign automation |
| 4 | Planned | Clearbit/Apollo enrichment, advanced personalization, analytics |
| 5 | Planned | Retries, admin job visibility, validation hardening, deployment |

## Assumptions

- Single user/workspace for Phase 1 (multi-tenant later)
- Gmail is the primary sending provider
- Claude claude-sonnet-4-6 for AI (latest Sonnet as of build date)
- pg-boss worker runs as a separate Node process alongside Next.js
- PostgreSQL is available (not SQLite — arrays and JSONB are used)
