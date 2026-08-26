# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

Versioning continues the semantic patch series from the SignalFlow template (`1.0.7` → `1.0.8` …). The footer and Admin Changelog page read the current version from `package.json` (now **1.0.12**).

## [Unreleased]

## [1.0.15] - 2026-08-26

### Removed
- Redundant "Join our community: Free Telegram community" line from the contact page founder bio (Telegram remains in the social cards below)

## [1.0.14] - 2026-08-26

### Added
- Instagram, Telegram, and YouTube contact cards on the contact page (sourced from `client-config.ts`)

### Changed
- Founder bio Telegram link now uses `clientConfig.telegramUrl` instead of a hardcoded URL

## [1.0.13] - 2026-08-26

### Changed
- Removed rounded bordered highlight boxes from active public navbar links (Home, Dashboard, Signals, Contact)
- Contact page content width constrained to `max-w-7xl` to match navbar (logo through Register Premium)

## [1.0.12] - 2026-08-26

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

## [1.0.11] - 2026-08-25

### Changed
- Dropdown menu styling simplified: removed rounded borders from menu items, content, and sub-content for sharp edges
- Logo hover effects simplified: removed blue glow shadow, kept subtle scale animation for clean appearance
- Navbar horizontal logo updated with latest TGA branding; subtle border replaces white background block

## [1.0.10] - 2026-08-24

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

## [1.0.9] - 2026-08-24

### Fixed
- Replaced transparent logo (RGBA) with white-background version (RGB) across navbar and components
- Updated site logo to proper branded TGA assets; replaced placeholder Photoroom favicon versions

### Changed
- Navbar uses horizontal TGA logo instead of square mark
- Navbar and footer logos styled with white padding, rounded corners, and subtle blue hover glow
- Footer logo cropped closer to reduce excess white padding

## [1.0.8] - 2026-08-21

### Added
- Traders Guide Academy scaffolded as single-tenant client fork from SignalFlow template
- Env-var admin login and password-based subscriber login (replaces Supabase Auth)
- Polling-based signal alerts (replaces Supabase Realtime)
- Weekly performance email digest infrastructure (`/api/cron/weekly-digest`, `DigestSendLog`, `emailDigestOptOut`, `lotSize` on signals)
- `digestEnabled` feature flag on `ClientConfig` (false for TGA until Resend domain verified)

### Changed
- `EXPIRED` status added to `SignalStatus` enum for lapsed contracts

## [1.0.7] - 2026-08-12

### Changed
- Parse signal textarea placeholder shows example-only text (no "Paste raw signal…" prefix)

## [1.0.6] - 2026-08-12

### Changed
- Insert Sample Signal link moved left above Parse textarea
- Send Signal button aligned with Parse Signal (height, icon, padding)

## [1.0.5] - 2026-08-12

### Changed
- Manual Signal Entry uniform 3-column grid; Parse Signal cleanup

## [1.0.4] - 2026-08-12

### Added
- Official NSE/BSE expiry specifications and exchange holiday engine

## [1.0.3] - 2026-08-12

### Added
- Dynamic instrument expiry engine; stock derivative support

## [1.0.2] - 2026-08-11

### Fixed
- NIFTY/SENSEX instrument detection; compact manual signal grid

## [1.0.1] - 2026-08-11

### Changed
- Automatic customer parser resolution; semantic versioning in footer (`v1.0.1 · <SHA>`)

## [1.0.0] - 2026-08-11

### Added
- Build version indicator in footer with deployment popover
- Admin Changelog timeline UI
- SignalFlow lifecycle engine, Goodwill parser, News & Market Alerts section
