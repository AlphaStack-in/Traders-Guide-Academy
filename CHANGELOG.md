# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- About section on contact page featuring Satish Rathod (NISM-certified founder) with biography and profile image; explains TGA's trading education focus and integration with SignalFlow
- Scrolling testimonials from 6 verified premium subscribers in "What our subscribers say" section; continuous horizontal marquee animation with avatars, ratings, and dates
- Horizontal logo (TGA-HORIOZONTAL-LOGO) in navbar for better visual balance; NavbarLogo component dedicated to navbar display

### Fixed
- Removed placeholder "Support Team" section from contact page with TODO manager values
- Replaced transparent logo (RGBA) with white-background version (RGB) across navbar and all components for consistent branding
- Updated site logo to proper branded TGA-LOGO asset; replaced placeholder Photoroom versions with final TGA-LOGO-favicon.png

### Changed
- Navbar logo now displays with white padding, rounded corners, and subtle blue glow on hover
- Admin dashboard navbar updated to use horizontal logo (NavbarLogo) instead of square placeholder, matching public site branding
- Footer logo (favicon) styled with white padding, rounded corners, and subtle blue glow on hover
- Weekly performance email digest sent to PREMIUM subscribers every Sunday at 9:30 AM IST, summarising the week's closed signals with win rate, P&L in points and rupees, best/worst trade, and a per-signal table (performance-email-digest)
- `EXPIRED` status added to the `SignalStatus` enum for contracts that lapsed without hitting target or stop-loss (performance-email-digest)
- `DigestSendLog` Prisma model records each digest send per subscriber per week, preventing duplicate sends on cron retries (performance-email-digest)
- `emailDigestOptOut` field on `Subscriber`; clicking the HMAC-signed unsubscribe link in any digest email sets this flag and opts the subscriber out of future digests (performance-email-digest)
- `lotSize` field on `Signal`, snapshotted at signal creation from the DhanInstrument cache, enabling rupee P&L computation in the digest (performance-email-digest)
- `digestEnabled` feature flag on `ClientConfig`; set to `false` for TGA until the Resend sending domain is verified (performance-email-digest)
- Shared `getResendClient()` and `getFromAddress()` helpers extracted from `email.ts`; all email sending (referral invites and digest) now goes through these (performance-email-digest)
- One-time backfill script `scripts/backfill-lot-sizes.ts` to populate `lotSize` on existing signals from the last 7 days at rollout (performance-email-digest)
- Cron route `/api/cron/weekly-digest` following the established `isAuthorizedCronRequest` + `CRON_SECRET` pattern, scheduled via `vercel.json` at `0 4 * * 0` (Sunday 04:00 UTC) (performance-email-digest)
- Unsubscribe route `GET /api/unsubscribe` validates an HMAC-signed token and sets `emailDigestOptOut = true` on the subscriber (performance-email-digest)
- Unit test suite (vitest) with 22 tests covering week-boundary computation, digest metrics, and HMAC token round-trips (performance-email-digest)
- New required environment variables: `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS`, `DIGEST_UNSUBSCRIBE_SECRET`, `NEXT_PUBLIC_BASE_URL` (see `.env.example`) (performance-email-digest)
