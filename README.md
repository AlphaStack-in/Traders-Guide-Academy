# Traders Guide Academy (TGA)

Full-stack web app for publishing intraday options-buying trade signals to premium
subscribers, with an admin dashboard for signal entry and performance analytics.

Single-tenant client repo, forked from the shared SignalFlow codebase — see
`docs/customer-onboarding-runbook.md` (carried over from that fork) for the full
onboarding checklist, and `src/lib/client-config.ts` for this deployment's branding,
which is currently placeholder pending real TGA assets.

**Stack:** Next.js 16 (App Router) + TypeScript · Tailwind CSS v4 + shadcn/ui · Recharts ·
Prisma → Supabase Postgres · Supabase Auth · Vercel.

## 1. Local setup

```bash
npm install
cp .env.example .env   # then fill in real values, see step 2
npx prisma generate
```

## 2. Supabase project

1. Create a project at [supabase.com](https://supabase.com) (or reuse an existing one).
2. **Project Settings → Database → Connection string**: copy the pooled connection
   string (port 6543, `?pgbouncer=true`) into `DATABASE_URL`, and the direct connection
   string (port 5432) into `DIRECT_URL`.
3. **Project Settings → API**: copy the Project URL and `anon` key into
   `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and the `service_role`
   key into `SUPABASE_SERVICE_ROLE_KEY` (server-only, never expose to the client).
4. Apply the schema:
   ```bash
   npx prisma migrate deploy
   ```
   This runs `prisma/migrations/20260717000000_init`, which creates the `Signal` and
   `Subscriber` tables (see `prisma/schema.prisma` for the full model).
5. Seed sample data (mixed wins/losses/open signals, so the dashboard has something to
   show):
   ```bash
   npm run db:seed
   ```
6. **Authentication → Users**: create a single admin user (email + password) directly
   in the Supabase dashboard. There is no public sign-up flow — this is the one account
   used to sign in at `/admin/login`.

## 3. Run it

```bash
npm run dev
```

- `/` — landing page with live stats pulled from the DB
- `/signals` — public track record grid
- `/register` — premium lead capture form
- `/admin/login` — Supabase Auth sign-in
- `/admin/dashboard`, `/admin/signals` — auth-gated (redirects to `/admin/login` if
  not signed in)

## 4. Deploy to Vercel

```bash
vercel login        # first time only
vercel link          # link this directory to a Vercel project
vercel env pull      # or add the same 5 env vars from .env in the Vercel dashboard
                      # (Project Settings > Environment Variables, for Production + Preview)
vercel --prod        # or just `git push` once the GitHub repo is connected
```

Once the GitHub repo (`AlphaStack-in/Traders-Guide-Academy`) is connected to the Vercel
project, every push to `main` auto-deploys to production and every other branch gets a
preview deployment — no extra config needed. Root directory and build command
(`next build`) work out of the box since this is a standard Next.js app at the repo root.

After the first deploy, verify: landing page loads with real stats, `/signals` renders
seeded data, `/admin/login` authenticates against Supabase, and the dashboard charts
render with real numbers.

## 5. Environment variables

Core variables (Supabase, auth) are covered in step 2. The additional variables below
are required for email features:

| Variable | Description | Required |
|---|---|---|
| `RESEND_API_KEY` | Resend API key for sending emails. Without it the app falls back to console-logging email content (dev simulation). | Production |
| `EMAIL_FROM_ADDRESS` | Sending address shown in emails, e.g. `noreply@yourdomain.com`. Must be on a Resend-verified domain. | Production |
| `DIGEST_UNSUBSCRIBE_SECRET` | Secret used to sign HMAC unsubscribe tokens. Generate with `openssl rand -hex 32`. Must remain stable — rotating it invalidates outstanding unsubscribe links. | Production |
| `NEXT_PUBLIC_BASE_URL` | Canonical base URL of the deployment, e.g. `https://tradersguideacademy.com`. Used to build unsubscribe links in digest emails. Defaults to `http://localhost:3000` if unset. | Production |
| `CRON_SECRET` | Bearer token that Vercel sends with cron requests. Set the same value in the Vercel project environment and in `vercel.json`'s cron headers. | Production |

See `.env.example` for the full list with generation instructions.

## 6. Cron jobs

Cron schedules are defined in `vercel.json` and run automatically on Vercel.
All cron routes require the `Authorization: Bearer $CRON_SECRET` header.

| Route | Schedule | What it does |
|---|---|---|
| `/api/cron/weekly-digest` | `0 4 * * 0` (Sunday 04:00 UTC = 9:30 AM IST) | Sends the weekly performance email digest to PREMIUM subscribers. Gated by `digestEnabled` in `src/lib/client-config.ts` — flip to `true` once the Resend sending domain is verified. |
| `/api/cron/sync-dhan-instruments` | See `vercel.json` | Refreshes the DhanInstrument lot-size cache from the Dhan API. |
| `/api/cron/renew-broker-tokens` | See `vercel.json` | Renews Dhan broker access tokens before they expire. |

To invoke a cron route manually in development:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/weekly-digest
```

The digest cron returns a JSON summary: `{ success, weekStart, recipientCount, sent, skippedAlreadySent, skippedNoEmail, errors }`.

## Notes

- The weekly digest reports P&L in both **points** (premium points) and **rupees** (using
  the lot size snapshotted at signal creation). Signals created before the
  `performance-email-digest` rollout may show "N/A" for rupee P&L.
- `pnlPercent` and signal `status` are always computed server-side
  (`src/lib/signal-metrics.ts`) — never entered manually.
- The "Register Premium" flow only stores leads in `Subscriber` for now — see the
  `TODO(payments)` comment in `src/app/register/actions.ts` for where to wire up
  Razorpay/Stripe later.
- Instagram thumbnail grid data lives in `src/lib/client-config.ts`
  (`instagramThumbnails` on the `tga` entry) — currently empty; add real reels, or
  clearly-labeled placeholders, whenever they're supplied.

## Production Deployment

| Client | Production URL |
| :--- | :--- |
| **Traders Guide Academy** | _TODO — set once the Vercel project is created (see onboarding runbook, Step 5)_ |