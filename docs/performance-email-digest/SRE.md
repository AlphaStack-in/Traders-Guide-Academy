# SRE Review: performance-email-digest

**When:** 2026-08-24 (Re-review after Fix Iteration 1)

---

## Verdict

**Status:** APPROVED

All blocking and non-blocking issues from the initial review have been resolved. The feature is behind `digestEnabled: false` for TGA and is safe to deploy. Enable the flag only after verifying `NEXT_PUBLIC_BASE_URL`, `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS`, and `DIGEST_UNSUBSCRIBE_SECRET` are set in Vercel project settings and the Resend sending domain is verified.

---

## Re-Review: Fix Verification

The following issues were raised in the initial review. Each has been verified against the current code.

### Blocking — Resolved

| Issue | Resolution | Verified |
|-------|-----------|---------|
| `NEXT_PUBLIC_BASE_URL` missing from `.env.example` | Added at `.env.example` line 46–49 with purpose comment and placeholder production value | ✓ |

### Non-Blocking — Resolved

| Issue | Resolution | Verified |
|-------|-----------|---------|
| Feature flag checked before authorization | `isAuthorizedCronRequest` is now the first gate (line 20); `digestEnabled` check follows (line 24) | ✓ |
| Dev simulation wrote `DigestSendLog` entries | `logDigestSend` is now inside the `if (resend)` branch only; the `else` (dev) branch logs to console and does not touch the DB | ✓ |
| Unsubscribe route swallowed DB errors silently | `catch` block now calls `console.error("Unsubscribe error:", error)` before returning 500 | ✓ |
| `DIGEST_UNSUBSCRIBE_SECRET` not guarded at cron startup | Route returns HTTP 500 with a descriptive JSON error if the env var is absent, before any DB or email work begins | ✓ |
| HMAC comparison used string equality (timing-safe concern) | `verifyUnsubscribeToken` now uses `crypto.timingSafeEqual` with equal-length `Buffer` objects; length mismatch returns `false` without compare | ✓ |

### Non-Blocking — Still Open (Accepted, pre-existing)

These were not targeted in Fix Iteration 1. Both are documented in the runbook and accepted as known limitations at current scale.

- **Sequential per-recipient send loop**: ~150-send limit within the 60-second `maxDuration`. Safe at current subscriber count; needs batching before exceeding ~150 PREMIUM subscribers.
- **Dedup check-then-insert race**: No DB transaction around `hasAlreadySent` + `logDigestSend`. Vercel does not normally double-invoke scheduled crons, so practical risk is low. Addressable with `INSERT ... ON CONFLICT DO NOTHING` in a future iteration.

---

## Operational Surface

| Category | Change | Notes |
|----------|--------|-------|
| New endpoints | Yes | `GET /api/cron/weekly-digest` (cron), `GET /api/unsubscribe` (user-facing) |
| New env vars | Yes | `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS`, `DIGEST_UNSUBSCRIBE_SECRET`, `NEXT_PUBLIC_BASE_URL` |
| External dependencies | Yes | Resend email API — one call per recipient per run |
| Data migrations | Yes | `DigestSendLog` table, `Signal.lotSize`, `Subscriber.emailDigestOptOut`, `EXPIRED` enum value |
| Background jobs | Yes | Weekly cron via vercel.json: `0 4 * * 0` (Sunday 04:00 UTC = 09:30 IST) |
| Feature flag | Yes | `digestEnabled` in `client-config.ts` — currently `false` for TGA |

---

## Observability

| Check | Status | Notes |
|-------|--------|-------|
| Error logging | ✓ | Outer catch logs to `console.error`; unsubscribe catch now also logs; per-recipient send errors collected into `errors[]` |
| No sensitive data in logs | ✓ | Dev simulation logs email address and subject only — no tokens, no API keys |
| JSON response for cron observability | ✓ | Route returns `{sent, skippedAlreadySent, skippedNoEmail, signalsInWeek, errors[]}` |
| Metrics instrumented | N/A | No metrics infrastructure in this codebase; JSON response body serves as observability output |
| Trace propagation | N/A | No distributed tracing in this codebase |

---

## Error Handling

| Check | Status | Notes |
|-------|--------|-------|
| External failures caught | ✓ | Resend send errors (thrown exceptions and returned `error` objects) are caught per-recipient; failures recorded in `errors[]`; processing continues for remaining recipients |
| Appropriate HTTP status codes | ✓ | 401 for unauthorized, 500 for missing env var or unexpected errors, 200 for all cron outcomes including partial failures reported in body |
| Retry with backoff | N/A | Cron runs once per week; per-recipient errors are logged for manual follow-up |
| Unsubscribe route error logging | ✓ | `catch` block now calls `console.error` before returning 500 |

---

## Configuration

| Variable | Purpose | Default | Required |
|----------|---------|---------|---------|
| `RESEND_API_KEY` | Resend API key for sending emails | None (dev simulation if unset) | Yes, for production sends |
| `EMAIL_FROM_ADDRESS` | Verified sender address in Resend | `SiteName <noreply@tga-placeholder.app>` | Yes — placeholder domain will be rejected by Resend |
| `DIGEST_UNSUBSCRIBE_SECRET` | HMAC secret for signing unsubscribe tokens | None (cron returns 500 if unset) | Yes, hard required |
| `NEXT_PUBLIC_BASE_URL` | Base URL for constructing unsubscribe links in emails | `http://localhost:3000` | Yes — set in Vercel project settings before enabling |
| `CRON_SECRET` | Vercel Cron `Authorization: Bearer` secret | Fails closed if unset | Yes (pre-existing) |

---

## Rollback

**Complexity:** Low

**Plan:**
1. Set `digestEnabled: false` in `src/lib/client-config.ts` and deploy. Auth is checked first, then the flag — all cron invocations return `{"success":true,"skipped":"..."}` immediately.
2. The vercel.json cron schedule continues to fire on Vercel's scheduler but the route exits immediately. To fully remove the trigger, remove the entry from `vercel.json` and redeploy.
3. The migration is additive (new table, new nullable columns, new enum value). No compensating migration is required unless the `DigestSendLog` table or the `EXPIRED` enum value must be removed. Leaving them in place is harmless.

---

## Runbook

### What it does

Every Sunday at 09:30 IST (04:00 UTC), Vercel invokes `GET /api/cron/weekly-digest`. The route verifies authorization, checks the `digestEnabled` flag and the `DIGEST_UNSUBSCRIBE_SECRET` env var, then queries all PREMIUM subscribers who have not opted out, fetches signals closed in the Monday–Sunday IST week just passed, computes P&L and win-rate metrics, renders an inline-styled HTML email, and sends one email per eligible subscriber via Resend. A `DigestSendLog` row is written per successful send, providing both an audit trail and a dedup guard against duplicate sends if the cron is retried.

### Health check

After each scheduled run, check Vercel's Function Logs for the cron route. A healthy run returns HTTP 200 with a JSON body like:

```json
{
  "success": true,
  "weekStart": "2026-08-17T18:30:00.000Z",
  "recipientCount": 42,
  "sent": 40,
  "skippedAlreadySent": 0,
  "skippedNoEmail": 2,
  "signalsInWeek": 8
}
```

`errors` will be absent on a clean run. Any entry in `errors[]` means one or more subscribers did not receive the digest.

To verify the dedup table directly:

```sql
SELECT "weekStartDate", COUNT(*) AS sent
FROM "DigestSendLog"
GROUP BY "weekStartDate"
ORDER BY "weekStartDate" DESC
LIMIT 4;
```

### Failure modes

| Symptom | Likely cause | Resolution |
|---------|-------------|------------|
| Cron returns `{"success":true,"skipped":"Digest is not enabled..."}` | `digestEnabled` is `false` in client-config | Expected pre-launch. Flip to `true` once Resend domain is verified and env vars are set. |
| Cron returns HTTP 401 | `CRON_SECRET` mismatch or missing | Verify `CRON_SECRET` in Vercel environment matches the value Vercel sends. |
| Cron returns `{"success":false,"error":"DIGEST_UNSUBSCRIBE_SECRET is not configured..."}` | `DIGEST_UNSUBSCRIBE_SECRET` env var missing | Add the env var to Vercel project settings and redeploy. |
| `errors[]` contains Resend API errors for some subscribers | Resend API key invalid, rate-limited, or domain not verified | Check Resend dashboard for send errors. Re-send manually for affected subscribers after fixing. `DigestSendLog` will not have entries for failed sends, so the next cron invocation will retry them automatically. |
| Cron times out (Vercel 504, no response body) | Subscriber count exceeds the ~150-send limit within `maxDuration=60` | See scaling note below. Partial batch: subscribers already in `DigestSendLog` will be skipped on retry; remaining ones will be picked up if the cron is manually re-invoked or on next week's run. |
| Unsubscribe link in email shows `localhost:3000` | `NEXT_PUBLIC_BASE_URL` not set in Vercel env | Add `NEXT_PUBLIC_BASE_URL=https://your-production-domain.com` to Vercel project settings and redeploy before enabling. |
| Subscriber claims unsubscribe link is broken/invalid | `DIGEST_UNSUBSCRIBE_SECRET` was rotated after the email was sent | HMAC tokens are derived from the subscriber ID and the current secret. After rotation, all outstanding links become invalid. Re-send the digest or provide a direct admin opt-out. |

### Scale limit (action required before enabling at large subscriber counts)

The cron loop is sequential: for each recipient it performs one DB read (dedup check), one Resend API call (~200–400 ms), and one DB write. At 300 ms per send, the 60-second `maxDuration` allows approximately 150–180 sends per invocation. Beyond this, Vercel will terminate the function mid-batch.

The dedup mechanism is safe for retries (logged sends are skipped), but Vercel does not auto-retry timed-out scheduled crons. Before enabling the digest with more than ~150 PREMIUM subscribers, batch the sends or parallelise in controlled chunks.

### Alerts to configure

- Vercel cron function: alert if the weekly-digest function exits with HTTP 5xx or times out — indicates systemic failure (missing env var, DB unreachable, Resend outage).
- `DigestSendLog` row count: alert if Sunday's send count is zero while `recipientCount > 0` and `signalsInWeek > 0` — indicates emails were suppressed silently.
- Resend dashboard: configure a bounce/complaint rate alert at > 2% to detect deliverability issues early.

---

## Issues

### Blocking

None.

### Non-Blocking (Accepted)

- **Sequential per-recipient loop**: ~150-send limit within the 60-second `maxDuration`. Not blocking at current subscriber count; needs addressing before subscriber count exceeds ~150.
- **Dedup check-then-insert race on concurrent invocations**: `hasAlreadySent` (SELECT) and `logDigestSend` (INSERT) are not atomic. Vercel's scheduler does not normally double-invoke, so the practical risk is low. Addressable with `INSERT ... ON CONFLICT DO NOTHING` or a DB transaction in a future iteration.

---

## Decision

APPROVED — all blocking and non-blocking issues from the initial review are resolved. The feature is safe to deploy in its current gated state (`digestEnabled: false`). Before flipping the flag to `true` in production, confirm the four required env vars (`RESEND_API_KEY`, `EMAIL_FROM_ADDRESS`, `DIGEST_UNSUBSCRIBE_SECRET`, `NEXT_PUBLIC_BASE_URL`) are set in Vercel project settings and the Resend sending domain is verified.
