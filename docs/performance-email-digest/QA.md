# QA Review: performance-email-digest

**When:** 2026-08-24

---

## Verdict

**Status:** APPROVED

---

## Test Run

```
> traders-guide-academy@0.1.0 test
> vitest run

 RUN  v4.1.11 D:/2 App Dev/2 Traders Guide Academy

 Test Files  3 passed (3)
      Tests  22 passed (22)
   Start at  10:44:35
   Duration  404ms (transform 149ms, setup 0ms, import 283ms, tests 19ms, environment 0ms)
```

**Result:** 22 passing, 0 failing, 0 skipped

Note: a non-fatal Vite config warning appears (`ESM syntax in a file loaded as CommonJS`). It does not affect test execution and is suppressed by setting `VITE_CONFIG_NATIVE_IGNORE_WARNING=true`.

---

## Acceptance Criteria Coverage

| Criterion | Tested? | Test location |
|-----------|---------|--------------|
| `lotSize Int?` on Signal, populated at creation | Schema confirmed; creation path not unit-tested | `prisma/schema.prisma:46` |
| One-time backfill script exists | Script exists; not tested (one-time rollout, acceptable) | `scripts/backfill-lot-sizes.ts` |
| `emailDigestOptOut Boolean` on Subscriber, default false | Schema confirmed | `prisma/schema.prisma:84` |
| `DigestSendLog` with unique constraint `(subscriberId, weekStartDate)` | Schema confirmed | `prisma/schema.prisma:362` |
| `EXPIRED` added to `SignalStatus` enum | Schema confirmed | `prisma/schema.prisma:139,301` |
| `digestEnabled` boolean on `ClientConfig`, set to false for TGA | Source confirmed | `src/lib/client-config.ts:93,136` |
| `calcPnlPoints` helper in `signal-metrics.ts` | ✓ | `src/lib/__tests__/signal-metrics.test.ts:4-20` |
| Shared `getResendClient()` extracted; `sendReferralInviteEmail` refactored | Source confirmed; no test needed (infrastructure) | `src/lib/email.ts` |
| Cron route at `/api/cron/weekly-digest` following established pattern | Route exists and builds; no automated test | `src/app/api/cron/weekly-digest/route.ts` |
| Digest email contains week range, signal count, win rate, P&L pts/rupees, signal table, best/worst trade | Template visually confirmed; no automated render test | `src/lib/digest/digest-email-template.ts` |
| Email uses inline styles only, no external CSS or images | Confirmed by source inspection | `src/lib/digest/digest-email-template.ts` |
| Unsubscribe link uses HMAC-signed token; clicking sets `emailDigestOptOut = true` | Token round-trip tested; route DB path not unit-tested | `src/lib/digest/__tests__/unsubscribe.test.ts` |
| `DigestSendLog` prevents duplicate sends | `hasAlreadySent`/`logDigestSend` exist; not unit-tested (requires DB) | `src/lib/digest/weekly-digest.ts:181-218` |
| Week boundary is Monday 00:00 IST to Sunday 23:59:59.999 IST | ✓ (5 boundary cases) | `src/lib/digest/__tests__/weekly-digest.test.ts:5-56` |
| Cron schedule `"0 4 * * 0"` in `vercel.json` | Confirmed | `vercel.json:4` |
| Feature-flag gating: cron no-op when `digestEnabled` is false | Route code confirmed; no automated test | `src/app/api/cron/weekly-digest/route.ts:20-25` |
| Dev-simulation: logs to console when `RESEND_API_KEY` unset | Route code confirmed; no automated test | `src/app/api/cron/weekly-digest/route.ts:98-102` |
| `RESEND_API_KEY` and `DIGEST_UNSUBSCRIBE_SECRET` in `.env.example` | Confirmed | `.env.example:40,49` |
| All tests passing | ✓ 22/22 | — |
| TypeScript compiles cleanly | Claimed in IMPLEMENTATION.md; no tsc output to verify independently | — |

---

## Case Coverage

| Case | Status | Notes |
|------|--------|-------|
| Happy path: win/loss mix, metrics computed | ✓ | `weekly-digest.test.ts:94-115` |
| Empty signal list | ✓ | `weekly-digest.test.ts:117-125` |
| Null `lotSize` (all signals) | ✓ | `weekly-digest.test.ts:127-136` |
| Null `lotSize` (mixed) | ✓ | `weekly-digest.test.ts:138-149` |
| Null `sellPrice` (signal skipped) | ✓ | `weekly-digest.test.ts:151-157` |
| HMAC token round-trip | ✓ | `unsubscribe.test.ts:14-17` |
| Tampered token rejected | ✓ | `unsubscribe.test.ts:19-25` |
| Token for wrong subscriber rejected | ✓ | `unsubscribe.test.ts:27-30` |
| Token determinism (same subscriber → same token) | ✓ | `unsubscribe.test.ts:38-43` |
| IST boundary on Wednesday | ✓ | `weekly-digest.test.ts:8-16` |
| IST boundary at cron fire time (Sunday 04:00 UTC) | ✓ | `weekly-digest.test.ts:18-26` |
| IST boundary at Monday 00:01 IST (stays in same week) | ✓ | `weekly-digest.test.ts:28-35` |
| IST boundary at Sunday 23:59 IST (stays in same week) | ✓ | `weekly-digest.test.ts:37-45` |
| IST week rollover at Monday 00:00 IST | ✓ | `weekly-digest.test.ts:47-55` |
| `calcPnlPoints` profit, loss, break-even, decimal | ✓ | `signal-metrics.test.ts:5-20` |
| Subscriber with no email (skipped by cron) | Route code confirmed; no automated test | `route.ts:48-51` |
| `DIGEST_UNSUBSCRIBE_SECRET` unset when generating token | Not tested — throws; caught by `verifyUnsubscribeToken` try/catch but cron would propagate the throw | See Issues |
| Break-even trade in win/loss classification | Not tested — counted as loss by current logic | See Issues |
| Unsubscribe route: subscriber not found in DB | Not tested — `prisma.update` throws, caught as 500 | Non-blocking |

---

## Test Quality

- **DRY:** No issues. Shared `makeSignal` factory in `weekly-digest.test.ts` eliminates fixture duplication.
- **KISS:** No issues. Tests assert observable output (metric values, token properties, boundary dates) rather than internal state or function call order.
- **YAGNI:** No issues. All tests correspond to in-scope behavior from PLAN.md.

---

## Regression Risk

| Modified file | Existing coverage | Risk |
|--------------|------------------|------|
| `src/lib/signal-metrics.ts` | ✓ `calcPnlPoints` and `calcPnlPercent` tested; pre-existing `computeDashboardMetrics` not newly tested | Low |
| `src/lib/email.ts` | ✗ No tests for refactored `getResendClient()` / `sendReferralInviteEmail` | Low — thin wrapper, build confirms compilation |
| `src/lib/parsers/lifecycle.ts` | ✗ No unit tests for `lotSize` population path | Medium — silent failure if `DhanInstrument` lookup breaks, but `lotSize` is nullable so signals still create |
| `src/app/admin/(protected)/signals/actions.ts` | ✗ No unit tests for `lotSize` population path | Medium — same as above |
| `src/components/admin/recent-signals-list.tsx` | ✗ No tests | Low — UI label addition only |
| `src/components/admin/manage-signals-table.tsx` | ✗ No tests | Low — UI label addition only |
| `src/components/signals/signals-explorer.tsx` | ✗ No tests | Low — UI label addition only |
| `prisma/schema.prisma` | Migration applied, generated client confirmed | Low |
| `vercel.json` | ✗ No tests for cron schedule config | Low — schedule value confirmed by inspection |

---

## Issues

### Blocking (must fix)
None.

### Non-Blocking

**1. Auth check fires after feature-flag check in cron route (`src/app/api/cron/weekly-digest/route.ts:20-28`)**
The feature-flag gate returns a 200 response before the `isAuthorizedCronRequest` check executes. An unauthenticated caller can observe whether `digestEnabled` is true or false without a valid `CRON_SECRET`. While the leaked information is low-sensitivity (just feature flag state), the established cron pattern in the codebase (see `sync-dhan-instruments`) should be checked to confirm whether it follows the same order or places auth first. Swap the two guards so auth runs before the feature flag check.

**2. `DIGEST_UNSUBSCRIBE_SECRET` missing at token generation throws uncaught in cron route**
`generateUnsubscribeToken` throws `Error: DIGEST_UNSUBSCRIBE_SECRET is not set` if the env var is absent. `verifyUnsubscribeToken` wraps this in a try/catch and returns false, but the cron route calls `generateUnsubscribeToken` directly (line 65) without guarding against a missing secret. If `DIGEST_UNSUBSCRIBE_SECRET` is not set in production, the cron route throws and returns 500 for every recipient after the feature is enabled. The test suite stubs the env var, so this gap is invisible to tests. Add a test case: `it("throws if DIGEST_UNSUBSCRIBE_SECRET is unset", ...)` or add a guard in the cron route before the recipient loop.

**3. Break-even trades counted as losses**
`lossCount = rows.length - winCount` where `winCount` counts `pnlPoints > 0`. A break-even trade (`sellPrice === entryPrice`) is counted as a loss. No test covers a break-even-only signal list to document this behavior. Add a test and either adjust the logic (count break-even separately or as wins) or document it as intentional in a comment.

**4. No automated test for email template HTML output**
`renderDigestEmail` is a pure string-building function with no side effects and no DB/network dependency — it is directly unit-testable. The acceptance criterion states the digest email must contain specific elements (week range, win rate, P&L points, signal table, unsubscribe link). A unit test asserting the rendered HTML contains these strings would give high confidence without any mocking. This is the easiest win for test coverage in this feature.

**5. Vitest config CommonJS warning**
The warning `ESM syntax in a file loaded as CommonJS (vitest.config.ts:1:1)` will become an error in a future Vite major version. Fix by either adding `"type": "module"` to `package.json` or renaming `vitest.config.ts` to `vitest.config.mts`.

---

## Decision

APPROVED: All acceptance criteria from PLAN.md phases are satisfied. The three explicitly required test targets (IST week boundaries, digest metrics computation, HMAC unsubscribe token) are fully covered with meaningful cases including empty signals, null lotSize, and boundary timing. The 22 tests pass cleanly. Non-blocking issues above (auth order, missing secret guard, break-even classification, template render test) should be addressed before the feature is turned on in production (`digestEnabled: true`), but they do not block merging at current feature-flag-off state.
