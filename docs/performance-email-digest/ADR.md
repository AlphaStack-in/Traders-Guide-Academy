# ADR: performance-email-digest

**Decision:** Defer Phase 1 auto-resolve; build digest on manually-closed signals only. Snapshot lotSize onto Signal at creation time rather than resolving historically from DhanInstrument.
**Status:** Accepted
**When:** 2026-08-24

---

## Context

The feature has two phases: (1) auto-resolve open signals against live prices, (2) weekly digest email with P&L metrics. Phase 1 introduces a hard runtime dependency on a live price source (Dhan market-quote API requires an active broker token), while Phase 2 can operate entirely on signals already closed via admin actions (TARGET_HIT, SL_HIT, CLOSED_MANUAL). Additionally, computing rupee P&L requires lot size, but the DhanInstrument table is an ephemeral daily cache -- expired contracts are purged, making historical lookups impossible.

## Decision

1. **Defer auto-resolve (Phase 1) entirely.** The weekly digest will aggregate signals that admins have already manually closed. Auto-resolve can be added as a separate follow-up once a reliable price source is established, without any schema or digest logic changes.

2. **Snapshot lotSize onto the Signal model** (`lotSize Int?`) at creation time rather than maintaining a `DhanInstrumentHistory` table. The lot size is known at signal creation, and snapshotting avoids a second table and the problem of expired contracts being absent from the daily cache.

## Alternatives Rejected

- **Auto-resolve in Phase 1 via Dhan market-quote API** -- rejected because it requires a persistent "system" broker token, adds a runtime dependency on Dhan uptime for a cron, and the digest works without it since signals are already closed manually.
- **DhanInstrumentHistory table for lot size** -- rejected because it adds schema complexity (a second growing table to maintain) when a single nullable column on Signal achieves the same result more simply.

## Consequences

**Better:**
- No new external runtime dependency (no live price API needed for digest)
- Simpler schema (one field vs. an entire history table)
- Digest can ship independently and immediately adds value

**Harder:**
- Signals that are never manually closed will not appear in digests (acceptable -- admin workflow already closes all signals)
- Existing signals created before the lotSize field is added will have `lotSize = null` and rupee P&L will be unavailable for those (one-time backfill script can partially address this for non-expired contracts)

---

## Constraints for Planning

- **Do not build a live-price poller or auto-resolve cron in this issue.** The digest must work exclusively with signals already in a terminal status (TARGET_HIT, SL_HIT, CLOSED_MANUAL, or the new EXPIRED).
- **Add `lotSize Int?` to the Signal model** and populate it at signal creation time. Do not create a DhanInstrumentHistory model.
- **Add `DigestSendLog` model** with a unique constraint on `(subscriberId, weekStartDate)` for dedup. Do not send if a matching row already exists.
- **Add `emailDigestOptOut Boolean @default(false)` to Subscriber.** Filter digest recipients by `email IS NOT NULL AND emailDigestOptOut = false`.
- **Follow the existing cron route pattern** from `src/app/api/cron/sync-dhan-instruments/route.ts`: `dynamic = "force-dynamic"`, `maxDuration = 60`, guard with `isAuthorizedCronRequest`, feature-flag early return via `clientConfig`, return JSON summary.
- **Add a `digestEnabled` boolean to `ClientConfig`** for feature-flagging the digest cron, consistent with the existing `dhanConnectEnabled` / `goodwillBrokerEnabled` gating pattern.
- **Reuse existing Resend pattern** from `src/lib/email.ts` (dev-simulation fallback when `RESEND_API_KEY` is unset, `EMAIL_FROM_ADDRESS` env var). Extract a shared Resend client helper rather than duplicating instantiation.
- **Reuse `signal-metrics.ts` helpers** (`calcPnlPercent`, `deriveStatus`, `computeDashboardMetrics` patterns). Add a `calcPnlPoints` helper alongside, not a separate metrics module.
- **EXPIRED enum value** is additive-only. Grep for exhaustive switch/match on `SignalStatus` and update any found.
- **Unsubscribe link must use HMAC-signed tokens** (not plain subscriber IDs) for compliance and security.
- **Week boundary: Monday 00:00 IST to Sunday 23:59 IST.** Cron fires Sunday evening IST (approx 12:30 UTC).
- **HTML email must use inline styles only** -- no external CSS, no external image assets. Email clients strip `<style>` tags and block external resources.
- **Add `RESEND_API_KEY` to `.env.example`** (it is used by `email.ts` but currently missing from `.env.example`).
