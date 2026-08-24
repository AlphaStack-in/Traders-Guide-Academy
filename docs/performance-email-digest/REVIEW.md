# Review: performance-email-digest

**When:** 2026-08-24
**Iteration:** 1/3

---

## Verdict

**Status:** APPROVED (after Fix Iteration 1)

---

## Expert Verdicts

| Expert | Status | Blocking Issues |
|--------|--------|----------------|
| Security | APPROVED | 0 |
| QA | APPROVED | 0 |
| SRE | APPROVED (re-review) | 0 |

---

## Consolidated Blocking Issues

**From SRE:**
- ~~`NEXT_PUBLIC_BASE_URL` missing from `.env.example` and has no safe default. If unset in Vercel, every unsubscribe link in digest emails will point to `http://localhost:3000`. Subscribers cannot unsubscribe. Fix: add to `.env.example` with documentation.~~ FIXED

## Non-Blocking Issues Worth Fixing

**From Security:**
1. ~~Use `crypto.timingSafeEqual` instead of manual XOR loop in `unsubscribe.ts`~~ FIXED
2. HTML-escape `subscriberName` in the email template as defense-in-depth
3. Use constant-time comparison for bearer token in `cron-auth.ts`

**From QA:**
1. ~~Auth check fires after feature-flag check in cron route -- swap order so unauthenticated callers can't observe feature-flag state~~ FIXED
2. ~~Missing `DIGEST_UNSUBSCRIBE_SECRET` throws uncaught in the cron route per-recipient loop~~ FIXED
3. Break-even trades (pnlPoints === 0) classified as losses -- no test documents this behavior
4. No unit test for `renderDigestEmail`

**From SRE (non-blocking):**
1. ~~Dev simulation still writes `DigestSendLog` -- running locally exhausts dedup entries~~ FIXED
2. ~~Unsubscribe route swallows DB errors with no logger~~ FIXED
3. ~~Feature flag evaluated before auth check (same as QA #1)~~ FIXED (same fix as QA #1)
4. Sequential send loop has ~150-subscriber timeout ceiling

---

## Fix Validation

```
> vitest run

 RUN  v4.1.11 D:/2 App Dev/2 Traders Guide Academy

 Test Files  3 passed (3)
      Tests  22 passed (22)
   Start at  10:49:12
   Duration  344ms (transform 131ms, setup 0ms, import 262ms, tests 19ms, environment 0ms)
```

```
> npx tsc --noEmit
(no output -- clean compilation)
```
