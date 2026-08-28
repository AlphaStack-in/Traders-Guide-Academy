# New Customer Onboarding Runbook

How to stand up a new branded instance of the signals platform for a paying customer. Written while onboarding **Traders Guide Academy (TGA)**, the first paying customer — kept generic so it can be reused for the next one.

## Background: how this codebase currently works

The app (`technojegan/SignalFlow` on GitHub — Next.js + Prisma + Supabase, hosted on Vercel; recently renamed from its original working name "Traders Hub Center / THC") is a single codebase that already renders as three different brands: **SignalFlow** (the platform's own brand, not yet sold to a customer), **StockOps**, and **Goodwill**. Which brand a given deployment shows is controlled by `src/lib/client-config.ts` — a `ClientId` union (`"signalflow" | "stockops" | "goodwill"`) and a `CLIENTS` record holding each brand's name, colors, logos, social links, pricing/batch info, payment details, testimonials, and feature flags. The `NEXT_PUBLIC_CLIENT` env var picks the entry at build time. All three brands currently share one repo, one `main` branch, and each has its own Vercel project; Goodwill and StockOps currently even share one Supabase database (fine for Goodwill's current status as a demo deployment, not fine for a real paying customer).

**Decision for TGA (and future customers): give each paying customer their own repo, own Vercel project, and own Supabase project**, forked from this codebase rather than added as a fourth entry to the shared `CLIENTS` record. This avoids one customer's repo/build ever containing another customer's branding, secrets, or data, and lets each customer's codebase drift independently if needed. Fork from the **Goodwill** brand's state specifically — it's the most white-label-ready of the three (no SignalFlow-specific hardcoding, already has the generalized fields like `logoAccent`, `pricingHeadline`, `reelsSourceLabel` that got added to support a second brand).

## Step 1 — Fork the repository

Two ways to do this — pick based on whether the customer will ever get direct repo access.

**A. Private to your team, full history kept (default — use this unless B applies)**

1. `git clone https://github.com/technojegan/SignalFlow.git <new-customer>-app`
2. Create a new **private** GitHub repo for the customer (e.g. `technojegan/Traders_Guide_Academy`).
3. `git remote rename origin upstream && git remote add origin <new-repo-url> && git push -u origin main`
4. Full commit history carries over — that's fine as long as the repo stays private to your team (don't hand this repo to the customer as-is; commit messages reference other customers/brands by name).
5. There's now no ongoing link back to the shared repo. A future fix made upstream has to be manually cherry-picked over if you want it in a customer's repo.

**B. Customer gets direct repo access — use GitHub's "Use this template" instead**

SignalFlow is marked as a **template repository** (Settings → General → Template repository — a checkbox, independent of anything else, toggle it once and forget it). Generating from a template (via the "Use this template" button, or `gh repo create technojegan/Traders_Guide_Academy --template technojegan/SignalFlow --private`) gives the new repo a **single fresh commit** with no shared history — none of SignalFlow's/Goodwill's/StockOps' commit messages are visible, so no squashing step needed. Only the default branch copies unless you tick "Include all branches." Note this is *not* a fork — there's no ongoing link back either way, same as option A.

Either way, secrets, env vars, webhooks, branch protection rules, issues, and releases never carry over — Step 5 below (new isolated infrastructure) is required regardless of which method you used to create the repo.

## Step 2 — Simplify to single-tenant

Since this repo now serves exactly one brand, strip the multi-tenant scaffolding so nobody can accidentally ship the wrong brand:

- In `src/lib/client-config.ts`: collapse `ClientId` to the one brand, delete the other brands' entries, keep just the new one (seed its shape from the `goodwill` entry).
- `NEXT_PUBLIC_CLIENT` becomes optional at that point — harmless to leave the pattern (costs nothing, keeps the option open for a staging-brand toggle later), but there's only one entry for it to resolve to.

## Step 3 — Branding (fill in every `ClientConfig` field)

| Field | What's needed |
|---|---|
| `siteName` / `siteNameShort` | Full name and short mark |
| `tagline`, `siteDescription`, `heroBadgeLabel` | Marketing copy |
| `logoSrc`, `faviconSrc`, `logoAlt` | Upload real logo/favicon files to `public/` |
| `goldStart`, `goldEnd`, `logoAccent` | Brand colors (accent gradient + optional secondary color sampled from the logo) |
| `instrumentDonutColors` | 4 shades, same hue family, for the dashboard donut chart |
| `instagramUrl`, `whatsappUrl`, `telegramUrl`, `facebookUrl`, `twitterUrl`, `youtubeUrl`, `linkedinUrl` | Real links; empty string hides the icon |
| `pricingHeadline`, `reelsSourceLabel` | Only needed if this customer deviates from the default batch-pricing headline or pulls reels from somewhere other than Instagram |
| `dhanOfferEnabled`, `dhanConnectEnabled`, `goodwillBrokerEnabled` | Broker auto-order features — leave all `false` unless this customer needs live order placement |
| `batchInfo` | Real batch number, price, existing-member price, dates, Zoom/WhatsApp timings, benefits list, refund policy |
| `paymentInfo` | Real UPI VPAs + payee names, manager names/phones — **never reuse another customer's payment identifiers** |
| `testimonials` | Real quotes, or leave empty until collected — don't ship another customer's testimonials |
| `instagramThumbnails` | Real reels, or clearly-labeled placeholders (see how StockOps did this) |

**`requireAdminAuth: true` is non-negotiable for a real paying customer** — never leave it `false` (that flag is only for demo deployments still being configured, like Goodwill's current state).

## Step 4 — Other business-model levers to check

- `src/lib/referral-config.ts` — referral reward (₹1000/successful referral) and social-promotion reward amounts. Decide whether this customer runs the same economics or different numbers.
- `src/lib/constants.ts` — `DEMO_ADMIN_CREDENTIALS`. Confirm nothing still references it (it looked unused after the RBAC/Google-login work landed) and delete it from the new repo.
- `src/lib/email.ts` — now reads `clientConfig.siteName` for the referral-invite email's from-name/subject/body instead of a hardcoded brand string (this was a real bug, fixed platform-wide during the 2026-08-21 SignalFlow rebrand) — no per-customer action needed here anymore, it'll pick up whatever `siteName` you set in Step 3.

## Step 5 — New isolated infrastructure

- **Supabase**: brand-new project — do not reuse another customer's database. Get `DATABASE_URL`/`DIRECT_URL`, run `npx prisma migrate deploy`. Skip `npm run db:seed` (that's fake demo data) — launch with zero signals or manually enter the first real ones.
- **Vercel**: new project linked to the new repo; set env vars for Production + Preview; connect the real domain. `vercel.json` currently schedules two Dhan-specific cron jobs (`sync-dhan-instruments`, `renew-broker-tokens`) — if broker-connect is off for this customer, delete both entries rather than leaving dead crons behind.
- **Env vars checklist**: `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAILS` (fails closed if unset — set to the real admins' emails), `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` (optional), `RESEND_API_KEY`/`EMAIL_FROM_ADDRESS` (optional, for referral emails). Note `CRON_SECRET` is required by `src/lib/cron-auth.ts` but missing from `.env.example` — add it there if you keep any cron routes. `BROKER_TOKEN_ENC_KEY` only needed if a broker-connect feature is turned on.

## Step 6 — Admin access

- Admin auth is Google-login + DB-backed RBAC (`AdminUser` table, `src/lib/admin-rbac.ts`), not the old single-Supabase-user login. Create `AdminUser` rows for this customer's real admins with the right `accessLevel` (`SUPER_ADMIN` for the owner, etc.); they bind on first Google sign-in. `ADMIN_EMAILS` is the fail-closed backstop, not the primary mechanism.

## Step 7 — Legal / compliance

- `/terms` and `/privacy` aren't hardcoded to any brand name, and the footer's SEBI disclaimer text is generic ("not a SEBI-registered Research Analyst or Investment Adviser...") — reusable as-is *only if* that's actually true for this customer. Confirm their registration status before launch; the footer already pulls `clientConfig.siteName` dynamically, no code change needed there.

## Step 8 — Assets to collect from the customer before launch

Logo (transparent PNG/SVG) + favicon, brand colors, social handles/links, batch pricing + dates + benefits + refund policy text, UPI IDs + payee names, WhatsApp/Telegram group links, admin emails, any real testimonials, reel links for the video grid (or ship labeled placeholders).

## Step 9 — QA before going live

- Full flow test: landing loads with live (not fake) stats, `/signals` renders, `/register` saves a `Subscriber`, `/admin/login` (Google) works and is actually gated, dashboard charts render, Smart Paste Parser handles a sample signal correctly.
- Double-check `requireAdminAuth: true` before any real subscriber data exists.
- Set up monitoring/alerts (Vercel + Supabase) and a backup/PITR policy for the database.
- Fresh secrets only — never reuse another customer's UPI IDs, tokens, or encryption keys.
- Domain + SSL via Vercel custom domain; DNS at the customer's registrar.

## Step 10 — Ongoing

Keep a one-line registry of which repo / Vercel project / Supabase project belongs to which customer, the same way the shared repo's README tracks its brands' production URLs — now across multiple standalone repos instead of one.

---

## TGA-specific decisions (this run)

- **Business model**: same signal-subscription + batch pricing model as existing brands, just rebranded — no new pages or schema needed.
- **Broker connect**: off for launch (`dhanOfferEnabled`, `dhanConnectEnabled`, `goodwillBrokerEnabled` all `false`) — ship signals + subscriptions first.
- **Payments**: existing-subscriber Upgrade/Extend/renewal now goes through real self-service checkout — Cashfree recurring UPI Autopay subscriptions (see CHANGELOG.md 1.0.37, `prisma/schema.prisma` Subscription/Payment models, `src/app/api/webhooks/cashfree/route.ts`). WhatsApp is kept as a manual fallback next to the checkout button. New-member registration payment (`PaymentDetailsCard`) is still manual UPI + WhatsApp confirmation, unchanged. A given deployment only actually accepts real money once its own Cashfree account is set up and activated — see CHANGELOG.md 1.0.37 for the exact steps; a fresh client deployment starts back at manual-only until that's done for them, same as before.
- **Repo access**: private to the team — full commit history kept, not handed to TGA as-is. Use Step 1 method **A** (plain clone + push), not the template-generation method.

## Note: the 2026-08-21 platform rebrand (THC → SignalFlow)

The platform's own default brand — previously working-named "Traders Hub Center" / "THC" (not yet sold to any customer) — was renamed to **SignalFlow** across the codebase: the `ClientId`/`CLIENTS` entry (`"thc"` → `"signalflow"`), site name/short mark, logo/favicon/hero-image assets (`thc-*` → `signalflow-*`), the design-system CSS token prefix (`--thc-*` / `.thc-*` → `--signalflow-*` / `.signalflow-*`), the internal message-parser identifier (`CustomerType "THC"` → `"SIGNALFLOW"`, `thc-parser.ts` → `signalflow-parser.ts`), `package.json`'s `name` field, and the GitHub repo itself (`technojegan/Traders_Hub_Center` → `technojegan/SignalFlow` — done manually on GitHub/Vercel, not by this session). A few things worth knowing if you're picking this up later:

- Any Signal rows already in the dev database from before the rename still have `parserName: "THC"` — purely cosmetic/historical, nothing reads that value for business logic, so no migration is required unless you want full cosmetic consistency (a one-off `UPDATE "Signal" SET "parserName" = 'SIGNALFLOW' WHERE "parserName" = 'THC';` would do it).
- The resolver still accepts `"THC"` and `"TRADERS_HUB_CENTER"` as backward-compatible aliases when resolving which parser to use — safe to remove later once nothing external sends those values.
- The real social-media handles (`traders_hub_center` on WhatsApp/Telegram/Instagram) were **not** touched — renaming code doesn't rename an external account. Rename those accounts separately, then update the URLs in `client-config.ts` to match.
- Two promo images (`public/promo/offer1.jpeg`, `offer2.jpeg`) may still visually show the old "Traders Hub Center" branding baked into the image itself — only their alt text was updated. Regenerate those images with new branding when convenient.
- `src/lib/email.ts`'s referral-invite email used a placeholder domain (`noreply@signalflow.app`) since the real domain isn't purchased yet — swap in the real domain once one is bought (see the Production Readiness epic in `backlog.yaml`).
