# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

Versioning continues the semantic patch series from the SignalFlow template (`1.0.7` → `1.0.8` …). The footer and Admin Changelog page read the current version from `package.json` (now **1.0.26**).

Each release header now includes a build timestamp (24-hour IST, matching `build-info.ts`'s `formattedBuildTime`), not just a date — this reflects the actual commit that shipped the version. While adding timestamps, two pre-existing dates were corrected to match their real shipping commit: `1.0.8` (was dated by the TGA fork commit, 3 days before the digest-email feature in that release actually shipped) and `1.0.2` (was off by one day around a just-after-midnight IST commit).

## [Unreleased]

## [1.0.26] - 2026-08-27 21:32 IST

### Changed
- "Parse Signal" now calls TGA's own signal-format parser directly instead of the shared codebase's multi-vendor auto-detector — Goodwill's parser is no longer reachable from TGA's admin panel at all
- Parsed-result badge and toast now read "TGA" instead of "SIGNALFLOW"/"GOODWILL"

## [1.0.25] - 2026-08-27 20:57 IST

### Fixed
- Signal parser: signals with an "ABOVE ..." entry and a slash-separated target list (e.g. "TARGET- 18/40/80/150") were being misrouted to the Goodwill parser instead of SignalFlow's own, causing "Missing targets and stop loss" on valid signal text — SignalFlow's "Above"/"Expiry" keywords are now checked first

### Added
- Signal parser: targets written as points-from-entry ("TARGET- 18/40/80/150 POINT") are now converted to actual target prices using the parsed entry price; the raw points and the conversion are shown alongside the parsed result
- Manual Signal Entry: Stock Symbol is now a type-to-search combobox — suggests this deployment's previously-used stock symbols first, then a larger seed list of frequently-traded intraday F&O stocks, still accepts any symbol typed freely

### Changed
- Manual Signal Entry: CMP field label now explicitly says "(Optional)" — it already fell back to Entry Price when left blank

## [1.0.23] - 2026-08-27 19:25 IST

### Added
- Signal parser: slash-separated targets (e.g. `18/40/80/150`), entry range upper bound (`ABOVE 160-170` → `entryHigh`), and explicit expiry from signal text (`EXPIRY 18th aug`)
- Profile page: estimated billing period row, Upgrade/Extend buttons via shared Continue Premium flow, and more broker options (Alice Blue, Lemonn, Sahi, SBI Securities, IIFL Securities, Paytm Money, SAMCO)
- Account menu: chevron on the subscriber name dropdown trigger

### Changed
- Manage Signals and Ongoing Trades sections now auto-expand/collapse when the first/last signal appears (re-syncs `defaultOpen` after `router.refresh()`)
- Profile page: 2-column info table, removed Batch row, full timestamp for Joined date
- Home pricing section: extracted shared `ContinuePremiumPanel` component (also used on profile)
- Testimonials: updated three member names (Rohan Deshmukh, Siddharth Mehta, Aditya Kulkarni)

## [1.0.22] - 2026-08-27 18:40 IST

### Changed
- Admin navbar: removed rounded bordered highlight boxes from active menu links (desktop and mobile); active state now uses primary text color and semibold weight only, matching the public site navbar

## [1.0.21] - 2026-08-27 18:34 IST

### Changed
- Contact page: added a "Join our free communities" heading above the Instagram/Telegram/YouTube cards, so that section reads as its own thing instead of being unlabeled
- Contact page: moved the "Get in Touch" heading and subheadline down to sit directly above the "Send us a Message" form, instead of above the social channel cards

## [1.0.20] - 2026-08-26 23:29 IST

### Changed
- Home page pricing section redesigned into a single compact card: the 3 separate Monthly/Quarterly/Yearly cards plus a full-width "Every plan includes" panel are now one glass card with a slim 3-column comparison row, a condensed benefits/timings strip, and the "Most Popular" badge shown inline next to the plan name instead of an overlapping floating badge
- AliceBlue broker offer switched from a large standalone card to a compact horizontal banner (logo, one line of offer copy, one CTA)
- Removed the large decorative bull illustration from the pricing section to reclaim vertical space — this was the one visible content change beyond layout, agreed as part of the compact redesign

## [1.0.19] - 2026-08-26 23:05 IST

### Changed
- Replaced the single dated-batch pricing model (one fixed price, one start/end date) with 3 recurring billing-cycle tiers — Monthly, Quarterly, Yearly — each with its own price. **Pricing shown is starter placeholder data (derived from the previous ₹4,999 price) — replace with real numbers in `client-config.ts` before this goes live.**
- Register form now shows a 3-tier plan picker instead of a fixed "Joining Batch" indicator; the chosen plan is preselected from a `?plan=` link (e.g. from a specific pricing card) and carries through to payment instructions
- Home page pricing section rebuilt as a 3-card tier grid (Quarterly marked "Most Popular") with a shared benefits/timings panel below
- "Continue Premium" renewal flow now lets an existing member pick which plan they're renewing before showing that plan's price
- Account dashboard Payment Details card shows the subscriber's actual plan price; falls back to listing all 3 tiers for subscribers with no plan on record (pre-dates this change)
- FAQ pricing/timings sections rewritten for the 3-tier model, dropping the old fixed batch-date-range framing

### Added
- `Subscriber.billingCycle` (Monthly/Quarterly/Yearly, nullable) — requires `npx prisma migrate dev --name add_billing_cycle`
- Profile page now shows which plan a subscriber is on (read-only) alongside the existing Batch field — kept separate, since Batch is still used for internal/admin cohort tracking

### Fixed
- `/#pricing` anchor link (already referenced from the FAQ page) now actually resolves — the pricing section was missing its `id="pricing"`

## [1.0.18] - 2026-08-26 22:38 IST

### Added
- Editable subscriber profile on `/account/profile` — Name, Phone, Email, and Current Broker with view/edit toggle
- Shared `BROKER_OPTIONS` constant used by registration and profile edit forms

### Changed
- Admin nav: Logout moved under the profile icon dropdown (matches subscriber account menu pattern)

### Fixed
- Profile email updates reject an email already used by another account

## [1.0.17] - 2026-08-26 22:11 IST

### Added
- Subscribers now set their own password at registration and are logged in immediately — no more waiting on an admin to set a password before first login
- Persistent "Payment Details" card on the account dashboard (`/account/profile`), showing the same UPI/manager info previously only shown once right after registering
- Every changelog entry (here and on the Admin Changelog page) now carries a full build timestamp, not just a date

### Changed
- Registration now requires a real email (previously optional) — login is email + password based, so an account needs a reachable email to be usable
- Admin nav: "Messages" moved out of the top-level bar into the "Members" dropdown, alongside View Members and Referrals

### Fixed
- Registration now rejects an email that's already registered, preventing two accounts from silently sharing one login email (`Subscriber.email` has no DB-level unique constraint)

## [1.0.16] - 2026-08-26 21:55 IST

### Fixed
- Navbar no longer shows Register Premium and Login at the same time for logged-out visitors
- After registration, a long-lived `tga_registered` cookie drives whether the navbar shows Register or Login

## [1.0.15] - 2026-08-26 20:03 IST

### Removed
- Redundant "Join our community: Free Telegram community" line from the contact page founder bio (Telegram remains in the social cards below)

## [1.0.14] - 2026-08-26 19:59 IST

### Added
- Instagram, Telegram, and YouTube contact cards on the contact page (sourced from `client-config.ts`)

### Changed
- Founder bio Telegram link now uses `clientConfig.telegramUrl` instead of a hardcoded URL

## [1.0.13] - 2026-08-26 19:54 IST

### Changed
- Removed rounded bordered highlight boxes from active public navbar links (Home, Dashboard, Signals, Contact)
- Contact page content width constrained to `max-w-7xl` to match navbar (logo through Register Premium)

## [1.0.12] - 2026-08-26 19:24 IST

### Added
- TGA brand asset library in `assets/` (logos, favicons, horizontal variants, founder image)
- `brokerOffer` config for client-specific demat partner cards (TGA uses AliceBlue with 20% brokerage discount)
- `newsAlertsEnabled` feature flag to gate the home-page News & Market Alerts panel
- Official AliceBlue partner logo on the pricing offer card (`public/aliceblue-logo.png`)
- Cursor rule requiring changelog updates on every product commit

### Fixed
- Premium community pricing card now shows ₹4,999 with real benefits, WhatsApp/Zoom timings, and refund policy
- Broker offer card no longer shows Dhan branding when TGA is partnered with AliceBlue
- Batch pricing headline ordinals (`1st Batch` instead of `1th Batch`) for clients without a custom headline
- Empty benefit bullets no longer render as blank list items on the pricing card
- Removed SignalFlow brand leak from News & Market Alerts panel title

### Changed
- Pricing section headline set to "Premium community" with updated subheadline and "Register Premium" CTA
- FAQ and Terms referral sections now reference AliceBlue instead of Dhan when the broker offer is enabled
- News & Market Alerts section hidden on the home page (`newsAlertsEnabled: false`) until admin tooling is ready
- Backfilled admin changelog (`src/lib/changelog.ts`) from Git history for TGA releases 1.0.8–1.0.12

## [1.0.11] - 2026-08-25 09:09 IST

### Changed
- Dropdown menu styling simplified: removed rounded borders from menu items, content, and sub-content for sharp edges
- Logo hover effects simplified: removed blue glow shadow, kept subtle scale animation for clean appearance
- Navbar horizontal logo updated with latest TGA branding; subtle border replaces white background block

## [1.0.10] - 2026-08-24 19:53 IST

### Added
- Real social media links: Instagram, YouTube, and Telegram
- Telegram community link in About section: https://t.me/tradersguideacademy01
- About section on contact page featuring Satish Rathod (NISM-certified founder, 25 years market experience)
- Scrolling testimonials from premium subscribers in "What our subscribers say" section
- Horizontal logo (`TGA-HORIOZONTAL-LOGO`) in navbar via `NavbarLogo` component

### Fixed
- Removed placeholder "Support Team" section from contact page with TODO manager values
- Corrected Instagram link tag syntax on contact page

### Changed
- Contact page founder bio redesigned: photo left, full-width biography right
- Removed WhatsApp contact option from contact page; Instagram remains primary social channel
- Admin dashboard navbar updated to use horizontal logo, matching public site branding
- Founder bio copy simplified; Telegram community CTA added

## [1.0.9] - 2026-08-24 19:11 IST

### Fixed
- Replaced transparent logo (RGBA) with white-background version (RGB) across navbar and components
- Updated site logo to proper branded TGA assets; replaced placeholder Photoroom favicon versions

### Changed
- Navbar uses horizontal TGA logo instead of square mark
- Navbar and footer logos styled with white padding, rounded corners, and subtle blue hover glow
- Footer logo cropped closer to reduce excess white padding

## [1.0.8] - 2026-08-24 11:55 IST

### Added
- Traders Guide Academy scaffolded as single-tenant client fork from SignalFlow template
- Env-var admin login and password-based subscriber login (replaces Supabase Auth)
- Polling-based signal alerts (replaces Supabase Realtime)
- Weekly performance email digest infrastructure (`/api/cron/weekly-digest`, `DigestSendLog`, `emailDigestOptOut`, `lotSize` on signals)
- `digestEnabled` feature flag on `ClientConfig` (false for TGA until Resend domain verified)

### Changed
- `EXPIRED` status added to `SignalStatus` enum for lapsed contracts

## [1.0.7] - 2026-08-12 08:12 IST

### Changed
- Parse signal textarea placeholder shows example-only text (no "Paste raw signal…" prefix)

## [1.0.6] - 2026-08-12 08:06 IST

### Changed
- Insert Sample Signal link moved left above Parse textarea
- Send Signal button aligned with Parse Signal (height, icon, padding)

## [1.0.5] - 2026-08-12 07:59 IST

### Changed
- Manual Signal Entry uniform 3-column grid; Parse Signal cleanup

## [1.0.4] - 2026-08-12 07:41 IST

### Added
- Official NSE/BSE expiry specifications and exchange holiday engine

## [1.0.3] - 2026-08-12 07:35 IST

### Added
- Dynamic instrument expiry engine; stock derivative support

## [1.0.2] - 2026-08-12 07:13 IST

### Fixed
- NIFTY/SENSEX instrument detection; compact manual signal grid

## [1.0.1] - 2026-08-11 23:06 IST

### Changed
- Automatic customer parser resolution; semantic versioning in footer (`v1.0.1 · <SHA>`)

## [1.0.0] - 2026-08-11 22:39 IST

### Added
- Build version indicator in footer with deployment popover
- Admin Changelog timeline UI
- SignalFlow lifecycle engine, Goodwill parser, News & Market Alerts section
