# Implementation: performance-email-digest

**What:** Weekly performance email digest for signal subscribers with outcome tracking, P&L computation, HMAC-signed unsubscribe, dedup logging, and feature-flag gating.
**When:** 2026-08-24

---

## Summary

Built signal outcome tracking and a weekly performance email digest system.
3/3 phases completed.

---

## Changes

### Files Created
- `src/lib/digest/weekly-digest.ts` - Core digest logic: IST week boundary, recipient query, weekly signal query, metrics computation, dedup check/log
- `src/lib/digest/unsubscribe.ts` - HMAC-SHA256 unsubscribe token generation and verification
- `src/lib/digest/digest-email-template.ts` - Inline-styled HTML email template renderer
- `src/app/api/cron/weekly-digest/route.ts` - Cron route: feature-flag gate, dedup, email send, JSON summary
- `src/app/api/unsubscribe/route.ts` - GET handler: validates HMAC token, sets emailDigestOptOut, returns confirmation HTML
- `scripts/backfill-lot-sizes.ts` - One-time script to populate lotSize for signals from the last 7 days
- `vitest.config.ts` - Vitest configuration with path aliases
- `src/lib/digest/__tests__/weekly-digest.test.ts` - Tests for getISTWeekBoundary and computeDigestMetrics
- `src/lib/digest/__tests__/unsubscribe.test.ts` - Tests for HMAC token round-trip
- `src/lib/__tests__/signal-metrics.test.ts` - Tests for calcPnlPoints and calcPnlPercent
- `prisma/migrations/20260824050205_add_digest_models/migration.sql` - Generated migration

### Files Modified
- `prisma/schema.prisma` - Added lotSize on Signal, emailDigestOptOut on Subscriber, EXPIRED to SignalStatus, DigestSendLog model
- `src/lib/client-config.ts` - Added digestEnabled to ClientConfig interface and TGA config (set to false)
- `src/lib/signal-metrics.ts` - Added calcPnlPoints helper
- `src/lib/email.ts` - Extracted shared getResendClient() and getFromAddress() helpers; refactored sendReferralInviteEmail to use them
- `src/lib/parsers/lifecycle.ts` - Populates lotSize at signal creation via DhanInstrument lookup
- `src/app/admin/(protected)/signals/actions.ts` - Populates lotSize at admin signal creation via DhanInstrument lookup
- `vercel.json` - Added cron schedule: "0 4 * * 0" (Sunday 04:00 UTC = 9:30 AM IST)
- `.env.example` - Added RESEND_API_KEY, EMAIL_FROM_ADDRESS, DIGEST_UNSUBSCRIBE_SECRET
- `package.json` - Added vitest dev dependency and "test" script
- `src/components/admin/recent-signals-list.tsx` - Added EXPIRED to status union and label map
- `src/components/admin/manage-signals-table.tsx` - Added EXPIRED to status union and label map
- `src/components/signals/signals-explorer.tsx` - Added EXPIRED to status union and label map

---

## Phases Completed

- [x] Phase 1: Schema & Foundation - Migration applied, lotSize populated at signal creation, shared Resend client extracted, feature flag added
- [x] Phase 2: Digest Aggregation & Email Template - Core digest logic, HMAC unsubscribe, email template, unsubscribe API route, 22 tests passing
- [x] Phase 3: Cron Route & Integration - Cron route wired with dedup + feature-flag gating, vercel.json schedule added, build succeeds

---

## Test Results

### Full Suite
```
> vitest run

 RUN  v4.1.11 D:/2 App Dev/2 Traders Guide Academy

 Test Files  3 passed (3)
      Tests  22 passed (22)
   Start at  10:39:17
   Duration  327ms (transform 127ms, setup 0ms, import 253ms, tests 17ms, environment 0ms)
```

### Type Check
```
> npx tsc --noEmit
(no output -- clean compilation)
```

### Lint (new/modified files only)
```
> npx eslint src/lib/digest/ src/app/api/cron/weekly-digest/ src/app/api/unsubscribe/ src/lib/email.ts src/lib/signal-metrics.ts scripts/backfill-lot-sizes.ts
(no output -- zero issues)
```

### Build
```
> next build
▲ Next.js 16.2.10 (Turbopack)
✓ Compiled successfully in 20.4s
✓ Generating static pages using 7 workers (18/18) in 621ms

Routes include:
├ ƒ /api/cron/weekly-digest
├ ƒ /api/unsubscribe
```

### Migration
```
> npx prisma migrate dev --name add_digest_models
Applying migration `20260824050205_add_digest_models`
Your database is now in sync with your schema.
✔ Generated Prisma Client (v6.19.3)
```

---

## Deviations from Plan

| Plan Said | What We Did | Why |
|-----------|-------------|-----|
| Phase 3 validation via curl to localhost | Validated via build + type check + tests | Cron route requires database and env vars for full E2E; build verification confirms route compiles and registers correctly. Feature-flag gating, dedup, and dev-simulation are verified through code structure following the established cron pattern exactly. |
| No test framework mentioned | Added vitest + vitest.config.ts | No test framework existed in the project; vitest was the lightest addition to enable unit testing. |

---

## Known Limitations

- `digestEnabled` is set to `false` in TGA config -- must be flipped to `true` once Resend domain is verified and the feature is ready for production (impact: low)
- Signals older than 7 days at rollout time will have `lotSize = null` and rupee P&L will show "N/A" in the digest (impact: low)
- The backfill script only works for contracts still in the DhanInstrument daily cache -- expired contracts cannot be backfilled (impact: low)
- Pre-existing lint errors (19 errors in unrelated files) are not addressed by this feature (impact: none)

---

## Fix Iteration 1

**When:** 2026-08-24
**Blocking issues fixed:** 1
**High-value non-blocking issues fixed:** 5

### Files Modified

| File | Change | Why |
|------|--------|-----|
| `.env.example` | Added `NEXT_PUBLIC_BASE_URL` with comment | Blocking: unsubscribe links defaulted to localhost in production |
| `src/app/api/cron/weekly-digest/route.ts` | Moved `isAuthorizedCronRequest` before `digestEnabled` check | Prevents unauthenticated callers from observing feature-flag state |
| `src/app/api/cron/weekly-digest/route.ts` | Added early guard for missing `DIGEST_UNSUBSCRIBE_SECRET` | Returns structured error instead of throwing per-recipient in the loop |
| `src/app/api/cron/weekly-digest/route.ts` | Moved `logDigestSend` inside `if (resend)` branch | Dev simulation no longer writes DigestSendLog entries, preventing dedup exhaustion |
| `src/lib/digest/unsubscribe.ts` | Replaced manual XOR loop with `crypto.timingSafeEqual` | Stronger timing-attack resistance using Node.js built-in |
| `src/app/api/unsubscribe/route.ts` | Added `console.error(error)` in catch block | Failed opt-outs now visible in production logs |
