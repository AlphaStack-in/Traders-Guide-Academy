# SignalFlow

Full-stack web app for publishing intraday options-buying trade signals to premium
subscribers, with an admin dashboard for signal entry and performance analytics.

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

Once the GitHub repo (`technojegan/SignalFlow`) is connected to the Vercel
project, every push to `main` auto-deploys to production and every other branch gets a
preview deployment — no extra config needed. Root directory and build command
(`next build`) work out of the box since this is a standard Next.js app at the repo root.

After the first deploy, verify: landing page loads with real stats, `/signals` renders
seeded data, `/admin/login` authenticates against Supabase, and the dashboard charts
render with real numbers.

## Notes

- All monetary figures are option premium **points**, not rupee P&L amounts.
- `pnlPercent` and signal `status` are always computed server-side
  (`src/lib/signal-metrics.ts`) — never entered manually.
- The "Register Premium" flow only stores leads in `Subscriber` for now — see the
  `TODO(payments)` comment in `src/app/register/actions.ts` for where to wire up
  Razorpay/Stripe later.
- Instagram thumbnail grid data lives in `src/lib/constants.ts`
  (`INSTAGRAM_THUMBNAILS`) — swap the placeholder entries for real reels any time.


## Production Deployments

| Brand Platform | Production URL |
| :--- | :--- |
| **Goodwill** | [https://goodwill-pi.vercel.app](https://goodwill-pi.vercel.app) |
| **SignalFlow** (formerly Traders Hub Center) | [https://traders-hub-center.vercel.app](https://traders-hub-center.vercel.app) _(rename pending — see onboarding runbook)_ |
| **StockOps** | [https://stockops-technojegan1.vercel.app](https://stockops-technojegan1.vercel.app) |