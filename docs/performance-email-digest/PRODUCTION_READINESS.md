# Production Readiness: performance-email-digest

**Date:** 2026-08-24

---

## Expert Sign-offs

- [x] Security: APPROVED (SECURITY.md)
- [x] QA: APPROVED (QA.md)
- [x] SRE: APPROVED (SRE.md) -- after Fix Iteration 1

## Code Quality

- [x] All tests pass (22/22, vitest)
- [x] Type check passes (npx tsc --noEmit -- clean)
- [x] Lint passes
- [x] Build succeeds

## Documentation

- [x] CHANGELOG updated (created CHANGELOG.md with 12 entries under [Unreleased])
- [x] README updated (added Environment Variables and Cron Jobs sections)
- [x] API docs updated (no public interface changes -- new cron and unsubscribe routes documented in README and SRE runbook)
- [x] ADR written (performance-email-digest -- defer auto-resolve, snapshot lotSize on Signal)
- [x] Runbook written (present in SRE.md -- health check, failure modes, scale limits, alerts)

## Breaking Changes

None. All schema changes are additive (new nullable columns, new enum value, new table). Existing queries and workflows are unaffected.

## Rollback

**Complexity:** Low
**Plan:**
1. Set `digestEnabled: false` in `src/lib/client-config.ts` and deploy. Cron invocations return immediately with a skip message.
2. To fully remove the cron trigger, remove the entry from `vercel.json` and redeploy.
3. Migration is additive -- no compensating migration required. Leaving DigestSendLog table and EXPIRED enum value in place is harmless.

---

## Pre-Enable Checklist

Before flipping `digestEnabled` to `true` in production:

- [ ] Set `RESEND_API_KEY` in Vercel project settings
- [ ] Set `EMAIL_FROM_ADDRESS` to a verified Resend sending domain
- [ ] Set `DIGEST_UNSUBSCRIBE_SECRET` (generate with `openssl rand -hex 32`)
- [ ] Set `NEXT_PUBLIC_BASE_URL` to the production domain (e.g., `https://tradersguideacademy.com`)
- [ ] Verify Resend sending domain is authenticated (SPF/DKIM)
- [ ] Run the one-time backfill script: `npx tsx scripts/backfill-lot-sizes.ts`
- [ ] Run `npx prisma migrate deploy` on production database

---

## Final Verdict

**Status:** PRODUCTION_READY

All gates passed. The feature is safely gated behind `digestEnabled: false` and can be deployed immediately. Enable the feature flag only after completing the Pre-Enable Checklist above. Ready to commit and deploy.
