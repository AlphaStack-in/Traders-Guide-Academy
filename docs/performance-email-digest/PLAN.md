# Plan: performance-email-digest

**What:** Build signal outcome tracking and a weekly performance email digest for signal subscribers. The digest aggregates closed signals per subscriber, computes win rate and P&L (in points and rupees using snapshotted lot size), renders an HTML email, and sends via Resend on a Sunday-morning cron (9:30 AM IST). Includes unsubscribe support, dedup logging, and feature-flag gating.

**When:** 2026-08-24

---

## Scope

**Building:**
- Schema additions: `lotSize Int?` on Signal, `emailDigestOptOut Boolean` on Subscriber, new `DigestSendLog` model, `EXPIRED` added to `SignalStatus` enum, `digestEnabled` on `ClientConfig`
- `calcPnlPoints` helper in `signal-metrics.ts`
- Shared Resend client extraction from `email.ts`
- HMAC-signed unsubscribe token generation and one-click unsubscribe API route
- Weekly digest cron route (`/api/cron/weekly-digest`) following the existing cron pattern
- Digest aggregation logic (Monday-Sunday IST week boundary, per-subscriber metrics)
- Inline-styled HTML email template (win rate, P&L points/rupees, best/worst trade, signal table)
- `DigestSendLog`-based dedup to prevent duplicate sends
- `lotSize` population at signal creation time (modify `lifecycle.ts` and admin signal actions)
- Cron schedule entry in `vercel.json`, `RESEND_API_KEY` added to `.env.example`

**NOT Building:**
- Live-price poller or auto-resolve cron (deferred per ADR)
- `DhanInstrumentHistory` table (using lotSize snapshot instead)
- Account settings UI for digest preferences (email unsubscribe link only for now)
- Backfill script for signals older than 7 days (only last 7 days are backfilled at rollout)
- Multi-tier subscriber segmentation beyond PREMIUM filter

---

## Phases

### Phase 1: Schema & Foundation

**Goal:** Add all schema changes, the `calcPnlPoints` helper, shared Resend client, and `digestEnabled` feature flag. This phase produces a compilable, migratable codebase with no runtime behavior changes.

Tasks:
- [ ] Add `lotSize Int?` field to the `Signal` model in `prisma/schema.prisma`
- [ ] Add `emailDigestOptOut Boolean @default(false)` to `Subscriber` model
- [ ] Add `EXPIRED` to the `SignalStatus` enum
- [ ] Add `DigestSendLog` model with fields: `id`, `subscriberId`, `subscriberEmail`, `weekStartDate DateTime`, `sentAt DateTime @default(now())`, `signalCount Int`, `winRate Float`, `totalPnlPoints Float`, `totalPnlRupees Float?`. Add `@@unique([subscriberId, weekStartDate])` and `@@index([weekStartDate])`
- [ ] Run `npx prisma migrate dev` to generate and apply migration
- [ ] Add `digestEnabled: boolean` to the `ClientConfig` interface and set it to `false` in the TGA config object
- [ ] Add `calcPnlPoints(entryPrice: number, sellPrice: number): number` to `src/lib/signal-metrics.ts` (returns `sellPrice - entryPrice`)
- [ ] Extract a shared `getResendClient()` helper in `src/lib/email.ts` that returns `Resend | null` (null when `RESEND_API_KEY` is unset, triggering dev-simulation). Refactor `sendReferralInviteEmail` to use it.
- [ ] Add `RESEND_API_KEY` and `DIGEST_UNSUBSCRIBE_SECRET` entries to `.env.example` with generation instructions
- [ ] Populate `lotSize` at signal creation: update `src/lib/parsers/lifecycle.ts` and `src/app/admin/(protected)/signals/actions.ts` to resolve lot size from `DhanInstrument` (when available) and write it to the `lotSize` field
- [ ] Create one-time backfill script `scripts/backfill-lot-sizes.ts` that populates `lotSize` for all existing signals from the last 7 days using the same DhanInstrument / dhan-contract-resolver.ts lookup logic. This runs once at rollout so the first digest has complete rupee P&L data. Log how many signals were updated vs skipped (no matching DhanInstrument).

Validation:
- [ ] `npx prisma migrate dev --name add_digest_models` completes without error -- show output
- [ ] `npx prisma generate` succeeds -- show output
- [ ] `npx tsc --noEmit` compiles cleanly -- show output
- [ ] `npm test` passes (no regressions) -- show output

### Phase 2: Digest Aggregation & Email Template

**Goal:** Build the core digest logic (query closed signals for the IST week, compute per-subscriber metrics, render HTML email) and the HMAC-signed unsubscribe mechanism. No cron wiring yet -- this phase produces tested, importable modules.

Tasks:
- [ ] Create `src/lib/digest/weekly-digest.ts` with:
  - `getISTWeekBoundary(referenceDate: Date): { weekStart: Date; weekEnd: Date }` -- Monday 00:00 IST to Sunday 23:59 IST
  - `getDigestRecipients()` -- query subscribers where `email IS NOT NULL AND emailDigestOptOut = false AND plan = PREMIUM`
  - `getWeeklySignals(weekStart: Date, weekEnd: Date)` -- query signals in terminal status (TARGET_HIT, SL_HIT, CLOSED_MANUAL, EXPIRED) closed within the week
  - `computeDigestMetrics(signals)` -- win rate, total P&L points, P&L rupees (using lotSize), best/worst trade, per-instrument breakdown
  - `hasAlreadySent(subscriberId: string, weekStartDate: Date): boolean` -- check DigestSendLog
  - `logDigestSend(...)` -- write DigestSendLog row
- [ ] Create `src/lib/digest/unsubscribe.ts` with:
  - `generateUnsubscribeToken(subscriberId: string): string` -- HMAC-SHA256 using `DIGEST_UNSUBSCRIBE_SECRET` env var
  - `verifyUnsubscribeToken(subscriberId: string, token: string): boolean`
- [ ] Create `src/lib/digest/digest-email-template.ts` -- function that accepts digest metrics and returns an HTML string with inline styles. Include: header with site name, week date range, summary stats (signals closed, win rate, total P&L points, total P&L rupees), signal table (instrument, strike, option type, entry, exit, P&L), best/worst trade callout, unsubscribe link at footer
- [ ] Create `src/app/api/unsubscribe/route.ts` -- GET handler that validates HMAC token, sets `emailDigestOptOut = true` on the subscriber, returns a confirmation HTML page

Validation:
- [ ] `npx tsc --noEmit` compiles cleanly -- show output
- [ ] `npm test` passes -- show output
- [ ] Unit test for `getISTWeekBoundary` returns correct Monday-Sunday boundaries -- show output
- [ ] Unit test for `generateUnsubscribeToken` / `verifyUnsubscribeToken` round-trips correctly -- show output
- [ ] Unit test for `computeDigestMetrics` with sample signal data returns expected win rate and P&L -- show output

### Phase 3: Cron Route & Integration

**Goal:** Wire up the weekly digest cron route, add the vercel.json schedule, and verify end-to-end flow including dedup, feature-flag gating, and email sending (dev-simulation mode).

Tasks:
- [ ] Create `src/app/api/cron/weekly-digest/route.ts` following the sync-dhan-instruments pattern:
  - `export const dynamic = "force-dynamic"; export const maxDuration = 60;`
  - Guard with `isAuthorizedCronRequest(request)`
  - Early return if `!clientConfig.digestEnabled`
  - Call `getISTWeekBoundary(new Date())` for the just-ended week
  - Fetch recipients via `getDigestRecipients()`
  - Fetch weekly signals via `getWeeklySignals(weekStart, weekEnd)`
  - For each recipient: check `hasAlreadySent`, compute metrics, render template, send email via shared Resend client, log to `DigestSendLog`
  - Return JSON summary: `{ success, weekStart, recipientCount, sent, skippedAlreadySent, skippedNoEmail, errors }`
- [ ] Add cron schedule to `vercel.json`: `"0 4 * * 0"` (Sunday 04:00 UTC = 9:30 AM IST) targeting `/api/cron/weekly-digest`
- [ ] Verify feature-flag gating: with `digestEnabled: false`, cron returns early with skip message
- [ ] Verify dedup: calling cron twice for the same week sends zero emails the second time
- [ ] Verify dev-simulation: without `RESEND_API_KEY`, digest logs email content to console instead of sending

Validation:
- [ ] `npx tsc --noEmit` compiles cleanly -- show output
- [ ] `npm test` passes -- show output
- [ ] Manual cron invocation with `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/weekly-digest` returns expected JSON summary -- show output
- [ ] Second invocation for the same week shows `skippedAlreadySent` count matching first run's `sent` count -- show output
- [ ] With `digestEnabled: false`, cron returns `{ success: true, skipped: "..." }` -- show output

---

## Acceptance Criteria

- [ ] `lotSize Int?` field exists on Signal model and is populated at signal creation when DhanInstrument data is available
- [ ] One-time backfill script populates `lotSize` for existing signals from the last 7 days
- [ ] `emailDigestOptOut Boolean` field exists on Subscriber model, defaults to false
- [ ] `DigestSendLog` model exists with unique constraint on `(subscriberId, weekStartDate)`
- [ ] `EXPIRED` value added to `SignalStatus` enum
- [ ] `digestEnabled` boolean added to `ClientConfig` (set to `false` for TGA)
- [ ] `calcPnlPoints` helper exists in `signal-metrics.ts`
- [ ] Shared Resend client extracted; existing `sendReferralInviteEmail` refactored to use it
- [ ] Weekly digest cron route at `/api/cron/weekly-digest` follows established cron pattern
- [ ] Digest email contains: week date range, signals closed count, win rate, P&L in points and rupees, per-signal table, best/worst trade
- [ ] Email uses inline styles only, no external CSS or images
- [ ] Unsubscribe link in email uses HMAC-signed token; clicking it sets `emailDigestOptOut = true`
- [ ] `DigestSendLog` prevents duplicate sends for the same subscriber + week
- [ ] Week boundary is Monday 00:00 IST to Sunday 23:59 IST
- [ ] Cron schedule in `vercel.json` fires Sunday 9:30 AM IST (04:00 UTC)
- [ ] Feature-flag gating: cron is a no-op when `digestEnabled` is false
- [ ] Dev-simulation: emails logged to console when `RESEND_API_KEY` is unset
- [ ] `RESEND_API_KEY` and `DIGEST_UNSUBSCRIBE_SECRET` documented in `.env.example`
- [ ] All tests passing, no regressions
- [ ] TypeScript compiles cleanly (`npx tsc --noEmit`)

---

## Technical Notes

**Approach:** Three-phase build. Phase 1 lays schema and foundational helpers with zero runtime behavior change. Phase 2 builds the digest computation, email template, and unsubscribe mechanism as tested, importable modules. Phase 3 wires the cron route and vercel.json schedule, completing the end-to-end flow.

**Files:**
- Create: `src/lib/digest/weekly-digest.ts`
- Create: `src/lib/digest/digest-email-template.ts`
- Create: `src/lib/digest/unsubscribe.ts`
- Create: `src/app/api/cron/weekly-digest/route.ts`
- Create: `src/app/api/unsubscribe/route.ts`
- Create: `scripts/backfill-lot-sizes.ts` (one-time rollout script)
- Create: `prisma/migrations/YYYYMMDD_add_digest_models/migration.sql` (generated)
- Modify: `prisma/schema.prisma` (Signal, Subscriber, SignalStatus, new DigestSendLog)
- Modify: `src/lib/client-config.ts` (add digestEnabled to interface and TGA config)
- Modify: `src/lib/signal-metrics.ts` (add calcPnlPoints)
- Modify: `src/lib/email.ts` (extract shared Resend client)
- Modify: `src/lib/parsers/lifecycle.ts` (populate lotSize at signal creation)
- Modify: `src/app/admin/(protected)/signals/actions.ts` (populate lotSize in admin signal creation)
- Modify: `vercel.json` (add cron schedule)
- Modify: `.env.example` (add RESEND_API_KEY, DIGEST_UNSUBSCRIBE_SECRET)

**Dependencies:**
- `resend` (existing, v6.18.1)
- `date-fns` (existing, v4.4.0)
- `@prisma/client` (existing)
- `crypto` (Node.js built-in, for HMAC)

---

## Risks & Mitigations

| Risk | Plan |
|------|------|
| Lot size unavailable for signals older than 7 days (lotSize = null) | One-time backfill script covers the last 7 days at rollout. Older signals show "N/A" for rupee P&L; points-based P&L still works. |
| Email deliverability requires verified Resend domain | Dev/staging uses dev-simulation fallback (console logging). Production requires `EMAIL_FROM_ADDRESS` on a verified domain -- this is an ops prerequisite, not a code blocker. |
| Subscribers without email addresses skip digest silently | Cron response includes `skippedNoEmail` count for observability. |
| Vercel Cron 60s timeout with many subscribers | Batch email sends sequentially within the 60s window. Current subscriber count is small. If it grows, increase `maxDuration` (Pro plan supports up to 300s) or split into batched invocations. |
| HMAC secret rotation invalidates outstanding unsubscribe links | Document that `DIGEST_UNSUBSCRIBE_SECRET` should be stable. If rotated, old links fail gracefully (show "invalid link" page, not a crash). |
| IST week boundary edge cases (DST-free, but UTC offset matters) | IST is fixed at UTC+5:30 year-round. Use explicit `+05:30` offset in date calculations, not locale-dependent APIs. |
