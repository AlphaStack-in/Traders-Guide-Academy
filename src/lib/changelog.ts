/**
 * Human-written product changelog.
 *
 * This is the ONLY authoritative source for release notes shown on the
 * Admin Changelog page. It is edited intentionally alongside each version
 * bump — it does NOT auto-generate from Git history or build metadata.
 *
 * Ordering: newest first.
 *
 * To add a new release:
 *   1. Run `npm version patch` (or minor / major) to bump package.json.
 *   2. Add a new entry at the TOP of this array.
 *   3. Commit both changes together.
 */

export interface ChangelogEntry {
  /** Semantic version this entry describes, e.g. "1.0.7". */
  version: string;
  /**
   * Human-readable release build timestamp, e.g. "12 Aug 2026, 08:12 IST".
   * Matches the shipping commit for this version (24-hour IST, same
   * convention as build-info.ts's formattedBuildTime) so the changelog
   * shows exactly when each build went out, not just the date.
   */
  date: string;
  /** Short title summarising the release. */
  title: string;
  /** Bullet-point highlights for this release. */
  highlights: string[];
}

const MONTH_ABBREVIATIONS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const CHANGELOG_DATE_PATTERN = /^(\d{1,2}) (\w{3}) (\d{4}), (\d{2}):(\d{2}) IST$/;

/**
 * Converts a ChangelogEntry's human-readable IST timestamp (e.g.
 * "30 Aug 2026, 22:45 IST") into an ISO 8601 instant string, so release
 * dates can run through the same date-filter helpers (computeBoundaries /
 * matchesDateFilter, lib/date-filter.ts) used for signal timestamps
 * elsewhere in the admin. `new Date("30 Aug 2026, 22:45 IST")` is not used
 * directly because that format's parsing is implementation-defined across
 * JS engines. Falls back to the current time if a date string doesn't match
 * the expected format (shouldn't happen for entries below).
 */
export function changelogTimestamp(date: string): string {
  const match = CHANGELOG_DATE_PATTERN.exec(date);
  if (!match) return new Date().toISOString();
  const [, day, monthAbbr, year, hour, minute] = match;
  const monthIndex = MONTH_ABBREVIATIONS.indexOf(monthAbbr);
  const utcMs =
    Date.UTC(Number(year), monthIndex, Number(day), Number(hour), Number(minute)) - IST_OFFSET_MS;
  return new Date(utcMs).toISOString();
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.0.50",
    date: "03 Sep 2026, 09:05 IST",
    title: "Settings Pages for Admin and Subscribers",
    highlights: [
      "New admin Settings page (Profile menu → Settings) — broker connect master switch + Dhan/Goodwill picker, weekly digest email toggle, News & Market Alerts toggle, all live with no redeploy",
      "New subscriber Settings page (Profile menu → Settings) — weekly digest email opt-in/out and notification bell alerts on/off",
      "Site feature flags moved from hardcoded client-config.ts booleans to a live, admin-editable AppSettings database table",
    ],
  },
  {
    version: "1.0.49",
    date: "02 Sep 2026, 07:40 IST",
    title: "Help Manual in Profile Menu",
    highlights: [
      "Help Manual link added to the subscriber profile menu dropdown — opens /help",
      "Admin nav Admin menu item renamed from \"Manual\" to \"Help Manual\"",
    ],
  },
  {
    version: "1.0.48",
    date: "02 Sep 2026, 07:30 IST",
    title: "Help Icon in Navbar",
    highlights: [
      "Help icon added to the main site navbar — opens the subscriber help manual at /help",
      "Help icon added to the admin navbar — opens the admin operator manual at /admin/help",
      "Dashboard Cumulative % card label shortened from \"Total % Won this Batch\" to \"Total % Won\"",
      "Dashboard instrument donut chart label renamed to \"Total % Won by instrument\"",
      "Ongoing Trades risk/reward chart switched from vertical to horizontal bars — potential gain extends right and potential risk extends left from the entry line",
      "Notification bell polls admin updates every 8s (was 20s), refreshes the page when new updates arrive, and clicking a notification jumps to the Admin Updates panel on Signals",
    ],
  },
  {
    version: "1.0.47",
    date: "01 Sep 2026, 21:30 IST",
    title: "Need New Demat Account Option",
    highlights: [
      "\"Need New Demat A/C\" option added to the Current Trading Broker dropdown on registration and profile",
      "Profile page shows a WhatsApp CTA to open a new Demat account under our partner broker referral when no broker is on record or that option is selected",
    ],
  },
  {
    version: "1.0.46",
    date: "31 Aug 2026, 23:21 IST",
    title: "Points Column in Signals Tables",
    highlights: [
      "Points column (sell price \u2212 entry price) added before P&L % in the Trade Log, admin Manage Signals table, and dashboard Recent Signals table",
    ],
  },
  {
    version: "1.0.45",
    date: "31 Aug 2026, 23:05 IST",
    title: "Teal Hero Social Icons",
    highlights: [
      "Home page hero social icons (WhatsApp, Instagram, Telegram, YouTube) now use brand light teal (#23a3d1) instead of gold",
    ],
  },
  {
    version: "1.0.44",
    date: "31 Aug 2026, 23:03 IST",
    title: "Navbar Logo Teal Recolor",
    highlights: [
      "Navbar horizontal logo (tga-logo-horizontal.png) recolored to brand light teal (#23a3d1) \u2014 the updated asset was never committed despite prior pushes",
    ],
  },
  {
    version: "1.0.43",
    date: "31 Aug 2026, 18:34 IST",
    title: "Updated Home Page Trust Stats",
    highlights: [
      "Home page trust stats now show 1,500+ active students, 25+ years of market experience, 250+ live sessions hosted, and 3,000+ total beneficiaries",
    ],
  },
  {
    version: "1.0.42",
    date: "31 Aug 2026, 18:20 IST",
    title: "Teal Headline Accents & SignalFlow Attribution",
    highlights: [
      "Headline highlight text (.signalflow-gold-text) now uses a light-teal gradient via new --signalflow-text-accent-* tokens instead of gold",
      "Footer, dashboard Share Performance message, refer-and-earn social shares, and site meta description now include \u201cPowered by SignalFlow technology\u201d",
    ],
  },
  {
    version: "1.0.41",
    date: "30 Aug 2026, 23:35 IST",
    title: "Lighter Teal Links & Changelog Date Filters",
    highlights: [
      "Primary teal for text links and focus rings lightened to #23a3d1 for better contrast on the dark background \u2014 CTA gradient buttons unchanged",
      "Admin Changelog page now has Today / This Week / This Month / Custom Range / All Time filter chips, matching the Signals page UX",
    ],
  },
  {
    version: "1.0.40",
    date: "30 Aug 2026, 22:45 IST",
    title: "Google Sign-In, Stock Signals & Email Uniqueness",
    highlights: [
      "Sign in with Google restored on /login and /admin/login (OAuth PKCE) \u2014 subscribers matched by verified email, admin must match ADMIN_EMAIL",
      "STOCK instrument type for individual-stock F&O signals with ticker in Signal.stockSymbol, shown across dashboard and admin",
      "Subscriber.email is now a real DB unique constraint with normalized lowercase storage \u2014 run the three new Prisma migrations before deploying",
    ],
  },
  {
    version: "1.0.39",
    date: "30 Aug 2026, 22:35 IST",
    title: "TGA Logo Teal Primary Buttons & Links",
    highlights: [
      "Primary CTA buttons, text links, and focus rings now use TGA logo teal (#1b7a9d) instead of gold — button label text switches to cream (#f5f2e8) for readability",
      "Gold is unchanged for headline gradient text, chart colors, badges, and glass-card hover glow",
    ],
  },
  {
    version: "1.0.37",
    date: "28 Aug 2026, 23:15 IST",
    title: "Self-Service Plan Upgrade/Renewal (Cashfree Autopay)",
    highlights: [
      "Upgrade/Extend buttons on the account profile page now open real in-app checkout (Cashfree UPI Autopay recurring subscriptions) instead of only handing off to WhatsApp \u2014 WhatsApp stays as a manual fallback right below it",
      "New Subscription/Payment/WebhookEvent tracking, a signature-verified Cashfree webhook, and a live Autopay status column in the admin Members table \u2014 replaces guesswork with a real payment record",
      "Needs a Cashfree account + a database migration before it's actually live \u2014 see CHANGELOG.md for the exact follow-up steps",
    ],
  },
  {
    version: "1.0.36",
    date: "28 Aug 2026, 22:09 IST",
    title: "Real Announcement Send (In-App + Email)",
    highlights: [
      "Admin \"Announcement\" button now actually sends a message instead of just showing a toast \u2014 target all members or only the currently selected ones",
      "New in-app channel (posts to the existing notification bell, always all members) and email channel (real Resend send to each targeted member's registered email)",
      "Result toast reports the real outcome (sent/failed/skipped counts) instead of a blind success message",
      "WhatsApp send and per-member-targeted in-app notifications are intentionally out of scope for this pass \u2014 see CHANGELOG.md",
    ],
  },
  {
    version: "1.0.35",
    date: "28 Aug 2026, 20:54 IST",
    title: "Tech Debt Ledger Now Lives In The Repo",
    highlights: [
      "New static tech-debt-ledger.html page (also at /tech-debt-ledger.html once deployed) — open technical debt grouped by role with severity pills",
      "Admin Changelog \"Tech debts\" link now points to the in-repo ledger instead of an external artifact URL",
    ],
  },
  {
    version: "1.0.34",
    date: "28 Aug 2026, 20:31 IST",
    title: "Admin Can Now Set A Subscriber's Password",
    highlights: [
      "Registered Members panel: new \"Set password\" action on each subscriber row — sets a new password (min. 6 characters) directly from the admin panel instead of requiring a developer to run a script by hand",
      "The confirmation message reminds the admin to share the new password with the subscriber directly — there's still no self-service reset flow",
    ],
  },
  {
    version: "1.0.33",
    date: "28 Aug 2026, 18:28 IST",
    title: "Sample Signal's Expiry Is Now Always Current",
    highlights: [
      "\"Insert Sample Signal\" now names NIFTY's actual next weekly expiry (computed fresh each time) instead of a fixed \"18th Aug\" — it always parses cleanly with HIGH confidence, no matter what today's date is",
    ],
  },
  {
    version: "1.0.32",
    date: "28 Aug 2026, 18:23 IST",
    title: "Expiry Parsing Fix & Parser Badge Removed",
    highlights: [
      "Signal parser: a written expiry with no year that had already passed (e.g. \"EXPIRY 18th Aug\" parsed after that date) used to resolve to a whole year later instead of being recognized as stale — it's now reported as unparsed and falls back to the next weekly expiry, so Expiry Date never ends up blank",
      "Removed the \"Parser: TGA\" chip from Parse Signal's parsed-result badges — internal detail, not needed on every parsed signal",
    ],
  },
  {
    version: "1.0.31",
    date: "28 Aug 2026, 18:03 IST",
    title: "Manual Signal Entry — Stock Symbol Moved Up Next To Instrument",
    highlights: [
      "Stock Symbol now appears directly below Instrument (instead of at the bottom, after Risk Rating) when Instrument is set to Stock — matches the order you'd actually fill the form in",
    ],
  },
  {
    version: "1.0.30",
    date: "28 Aug 2026, 17:50 IST",
    title: "Admin Updates Without an Open Trade & Richer Status Labels",
    highlights: [
      "Admin can now post a general \"Admin Updates\" message to subscribers even when there's no ongoing trade — the update panel is no longer tied to an open signal, and now shows a single combined, newest-first feed",
      "\"All Signals\" Status column now shows which target was hit (\"T1 Hit\", \"T2 Hit\", …) and distinguishes a still-profitable manual exit (\"Partial Profit\") from a flat \"Closed\"",
    ],
  },
  {
    version: "1.0.29",
    date: "28 Aug 2026, 17:37 IST",
    title: "Manual Signal Entry — 2-Column Table Layout",
    highlights: [
      "Manual Signal Entry now lays out every field as a 2-column table (label on the left, the input/select/combobox on the right) instead of the previous 3-column card grid — same fields, same order, same behavior, just a cleaner scan-down layout",
    ],
  },
  {
    version: "1.0.28",
    date: "28 Aug 2026, 17:27 IST",
    title: "Insert Sample Signal Updated to TGA's Real Format",
    highlights: [
      "\"Insert Sample Signal\" on Parse Signal now prefills TGA's actual signal format (ABOVE range, slash-separated points-based targets, SL-, EXPIRY) instead of the older generic single-line example — parses HIGH confidence with no warnings",
    ],
  },
  {
    version: "1.0.27",
    date: "28 Aug 2026, 07:27 IST",
    title: "Subscriber Help Manual & Admin Manual",
    highlights: [
      "New /help page: a step-by-step subscriber manual covering registration, login, how signals actually reach you (WhatsApp/Telegram, not the website), reading the Dashboard and Signals page, managing your profile, Upgrade/Extend, and the full Refer & Earn program — linked from the footer",
      "New /admin/help page: an admin operator manual covering Parse Signal, Manual Signal Entry, closing/editing Ongoing Trades, Registered Members, Messages, and Referral & Reward Management — linked from the admin nav's Admin menu as \"Manual\"",
      "Both manuals are scoped to features actually active for this deployment; a couple of real gaps found while writing them (no self-service password reset UI for admins to use on a subscriber's account, no reset-by-email flow) are called out explicitly rather than glossed over",
    ],
  },
  {
    version: "1.0.26",
    date: "27 Aug 2026, 21:32 IST",
    title: "TGA-Only Signal Parser",
    highlights: [
      "Parse Signal now calls TGA's own format parser directly — Goodwill's parser is no longer reachable from the admin panel",
      "Parsed-result badge and toast now read \"TGA\" instead of \"SIGNALFLOW\" or \"GOODWILL\"",
    ],
  },
  {
    version: "1.0.25",
    date: "27 Aug 2026, 20:57 IST",
    title: "Parser Fixes, Points Targets & Stock Combobox",
    highlights: [
      "Fixed signal misclassification: slash-separated targets with ABOVE/EXPIRY keywords no longer route to the Goodwill parser",
      "Targets written as points-from-entry (e.g. TARGET- 18/40/80/150 POINT) are converted to actual prices using the parsed entry",
      "Stock Symbol field is now a type-to-search combobox with previously-used symbols and an expanded seed list",
      "CMP field label now explicitly says (Optional)",
    ],
  },
  {
    version: "1.0.23",
    date: "27 Aug 2026, 19:25 IST",
    title: "Signal Parser, Profile Overhaul & Testimonials",
    highlights: [
      "Signal parser now handles slash-separated targets, entry ranges, and explicit expiry dates from signal text",
      "Manage Signals and Ongoing Trades sections auto-expand/collapse when signals are added or closed",
      "Profile page redesigned with 2-column info table, estimated billing period, Upgrade/Extend buttons, and more broker options",
      "Shared Continue Premium panel extracted for home pricing and profile renewal flows",
      "Account menu dropdown now shows a chevron next to the subscriber name",
      "Updated three testimonial member names",
    ],
  },
  {
    version: "1.0.22",
    date: "27 Aug 2026, 18:40 IST",
    title: "Admin Navbar Active Link Styling",
    highlights: [
      "Removed rounded bordered highlight boxes from active admin navbar links on desktop and mobile",
      "Active admin nav items now use primary text color and semibold weight only, matching the public site navbar",
    ],
  },
  {
    version: "1.0.21",
    date: "27 Aug 2026, 18:34 IST",
    title: "Contact Page Heading Cleanup",
    highlights: [
      "Added a \"Join our free communities\" heading above the social channel cards",
      "Moved the \"Get in Touch\" heading to sit directly above the Send us a Message form",
    ],
  },
  {
    version: "1.0.20",
    date: "26 Aug 2026, 23:29 IST",
    title: "Compact Pricing Section Redesign",
    highlights: [
      "Home page pricing section rebuilt as one compact card with a slim 3-column plan comparison row, replacing 3 separate cards plus a full-width benefits panel",
      "\"Most Popular\" badge now sits inline next to the plan name instead of floating above the card",
      "AliceBlue broker offer is now a compact horizontal banner instead of a large standalone card",
      "Removed the large decorative bull illustration from the pricing section to save vertical space",
    ],
  },
  {
    version: "1.0.19",
    date: "26 Aug 2026, 23:05 IST",
    title: "Monthly / Quarterly / Yearly Pricing Tiers",
    highlights: [
      "Replaced the single dated-batch price with 3 recurring billing-cycle tiers: Monthly, Quarterly, Yearly",
      "Pricing shown is starter placeholder data — replace with real numbers in client-config.ts before launch",
      "Register form shows a 3-tier plan picker; the chosen plan carries through to payment instructions",
      "Home page pricing section rebuilt as a 3-card tier grid, Quarterly marked Most Popular",
      "Continue Premium renewal flow lets an existing member pick which plan they're renewing",
      "Account dashboard Payment Details card shows the subscriber's actual plan price",
      "FAQ pricing and timings sections rewritten for the 3-tier model",
      "Added Subscriber.billingCycle field — run npx prisma migrate dev --name add_billing_cycle",
      "Profile page now shows which plan a subscriber is on, alongside the existing Batch field",
      "Fixed a dangling /#pricing anchor link — the pricing section was missing its id",
    ],
  },
  {
    version: "1.0.18",
    date: "26 Aug 2026, 22:38 IST",
    title: "Editable Subscriber Profile & Admin Logout Under Profile Icon",
    highlights: [
      "Subscribers can edit Name, Phone, Email, and Current Broker from the account dashboard",
      "Profile edits reject an email already used by another account, same guard as registration",
      "Admin nav: Logout moved under the admin's profile icon dropdown instead of a standalone button",
      "Broker selector options shared between registration and profile edit forms",
    ],
  },
  {
    version: "1.0.17",
    date: "26 Aug 2026, 22:11 IST",
    title: "Self-Service Password Registration & Payment Dashboard",
    highlights: [
      "Subscribers set their own password at registration and are logged in immediately",
      "Registration now requires a real email — login is email + password based",
      "Duplicate-email registrations are now rejected (Subscriber.email has no DB-level unique constraint)",
      "Persistent Payment Details card added to the account dashboard, not just a one-time post-registration screen",
      "Admin nav: Messages moved into the Members dropdown",
      "Every changelog entry now shows a full build timestamp, not just a date",
    ],
  },
  {
    version: "1.0.16",
    date: "26 Aug 2026, 21:55 IST",
    title: "Navbar Register vs Login Mutual Exclusion",
    highlights: [
      "Set tga_registered browser cookie after successful registration",
      "Navbar shows Register Premium or Login (never both) based on registration cookie and session state",
      "Removed duplicate Register Premium button from navbar.tsx",
    ],
  },
  {
    version: "1.0.15",
    date: "26 Aug 2026, 20:03 IST",
    title: "Contact Bio Cleanup",
    highlights: [
      "Removed redundant Telegram community link from the founder bio on the contact page",
    ],
  },
  {
    version: "1.0.14",
    date: "26 Aug 2026, 19:59 IST",
    title: "Contact Page Social Channels",
    highlights: [
      "Contact page now shows Instagram, Telegram, and YouTube cards from client config",
      "Founder bio Telegram link reads from clientConfig.telegramUrl instead of a hardcoded URL",
    ],
  },
  {
    version: "1.0.13",
    date: "26 Aug 2026, 19:54 IST",
    title: "Navbar Link Styling & Contact Page Width",
    highlights: [
      "Removed rounded bordered boxes from active public navbar menu items",
      "Contact page section cards now align to the same max-w-7xl width as the navbar",
    ],
  },
  {
    version: "1.0.12",
    date: "26 Aug 2026, 19:24 IST",
    title: "Premium Pricing, AliceBlue Partner & News Panel",
    highlights: [
      "Premium community pricing card live at ₹4,999 with benefits, timings, and refund policy",
      "AliceBlue demat offer card with official logo and 20% brokerage discount",
      "TGA brand asset library added under assets/ for design reference",
      "News & Market Alerts hidden via newsAlertsEnabled until admin UI is built",
      "Removed SignalFlow branding from News & Market Alerts panel title",
      "Changelog backfilled from Git history; commit-time changelog rule added",
    ],
  },
  {
    version: "1.0.11",
    date: "25 Aug 2026, 09:09 IST",
    title: "Navbar Logo & Dropdown Menu Polish",
    highlights: [
      "Updated navbar with latest TGA horizontal logo branding",
      "Replaced white logo background with subtle border in navbar",
      "Removed logo glow effect; kept subtle scale hover animation",
      "Dropdown menus simplified with sharp edges (no rounded item borders)",
    ],
  },
  {
    version: "1.0.10",
    date: "24 Aug 2026, 19:53 IST",
    title: "Contact Page, Social Links & Testimonials",
    highlights: [
      "Founder bio section on contact page featuring Satish Rathod (NISM-certified, 25 years experience)",
      "Full-width contact layout with photo left and biography right",
      "Removed placeholder Support Team section from contact page",
      "Removed WhatsApp contact option; Instagram remains primary channel",
      "Telegram community link added to founder bio",
      "Real Instagram, YouTube, and Telegram URLs in client config",
      "Scrolling subscriber testimonials marquee on landing page",
      "Admin navbar updated to horizontal TGA logo",
    ],
  },
  {
    version: "1.0.9",
    date: "24 Aug 2026, 19:11 IST",
    title: "TGA Logo Assets & Navbar Branding",
    highlights: [
      "Updated site logo and favicon to proper TGA branded assets",
      "Replaced transparent logo with white-background version for consistent display",
      "Horizontal logo (NavbarLogo) added to public navbar",
      "Navbar and footer logos styled with padding, rounded corners, and hover glow",
      "Footer logo cropped tighter to reduce excess white padding",
    ],
  },
  {
    version: "1.0.8",
    // Corrected from "21 Aug 2026" (when the fork was scaffolded) to the
    // actual shipping commit's timestamp — the digest-email feature in
    // this bundle landed 3 days after the fork itself.
    date: "24 Aug 2026, 11:55 IST",
    title: "TGA Fork, Auth Simplification & Email Digest",
    highlights: [
      "Scaffolded Traders Guide Academy as a single-tenant client fork",
      "Replaced Supabase Auth with env-var admin login and password-based subscriber login",
      "Polling-based signal alerts replace Supabase Realtime",
      "Weekly performance email digest for premium subscribers (digestEnabled: false for TGA until Resend domain verified)",
      "EXPIRED signal status, DigestSendLog model, and lotSize snapshot for rupee P&L",
    ],
  },
  {
    version: "1.0.7",
    date: "12 Aug 2026, 08:12 IST",
    title: "Parse Signal Textarea Placeholder Example Only Refinement",
    highlights: [
      "Removed 'Paste raw signal message...' from Parse text input placeholder",
      "Showing strictly 'Example: NIFTY 24450 PE BUY ABOVE 15 SL 1 TARGETS 155,170' as placeholder prompt",
    ],
  },
  {
    version: "1.0.6",
    date: "12 Aug 2026, 08:06 IST",
    title: "Parse Signal Left Link Repositioning & Send Signal Icon Alignment",
    highlights: [
      "Moved Insert Sample Signal link to the left side above Parse textarea",
      "Restored raw signal example prefill text in textarea placeholder",
      "Added Send icon to Send Signal button",
      "Matched Send Signal button height (h-9), padding (px-6), text size (text-xs), and font weight with Parse Signal button",
    ],
  },
  {
    version: "1.0.5",
    date: "12 Aug 2026, 07:59 IST",
    title: "Parse Signal Cleanup & Uniform 3-Column Manual Signal Grid",
    highlights: [
      "Moved Insert Sample Signal link above Parse textarea on the right side",
      "Removed redundant labels, example placeholders, and overlapping instructional text from Parse Signal",
      "Aligned Manual Signal Entry into a uniform 3-column grid with equal column field widths",
      "Widen Instrument dropdown to full column width and resized Target(s) input to normal column width",
      "Renamed visible manual form action from Save Signal to Send Signal (left-aligned)",
    ],
  },
  {
    version: "1.0.4",
    date: "12 Aug 2026, 07:41 IST",
    title: "Official Exchange Contract Expiry Specifications & Holiday Engine",
    highlights: [
      "Updated NSE Nifty 50 weekly options to official Tuesday expiry schedule",
      "Omitted weekly expiries for Bank Nifty and Midcap Nifty per official NSE contract specs (monthly only)",
      "Implemented BSE Sensex Friday weekly option expiry specification",
      "Added exchange trading holiday engine with automatic previous-trading-day adjustment",
      "Added centralized getValidExpiries({ exchange, instrument, stockSymbol, referenceDate }) abstraction",
    ],
  },
  {
    version: "1.0.3",
    date: "12 Aug 2026, 07:35 IST",
    title: "Dynamic Instrument Expiry Engine & Compact Keyboard-First Admin UI",
    highlights: [
      "Added dynamic getNextExpiry service for Nifty, Sensex, Bank Nifty, Midcap Nifty, and Stock derivatives",
      "Automatic instrument-driven expiry calculation and pre-selection on form load and switching",
      "Added Stock category support with derivative stock selector",
      "Integrated automatic expiry recalculation with 'Use Parsed Data' flow",
      "Redesigned Manual Signal Entry to a ultra-fast, compact keyboard-first admin panel",
    ],
  },
  {
    version: "1.0.2",
    date: "12 Aug 2026, 07:13 IST",
    title: "Instrument Detection Fix & Compact Left-Aligned Signal Entry UI",
    highlights: [
      "Fixed NIFTY/SENSEX explicit instrument detection & eliminated false instrument warnings",
      "Implemented Priority 1 explicit name, Priority 2 strike-range, Priority 3 unresolved detection engine",
      "Left-aligned Parse Signal, Use Parsed Data, and Save Signal buttons",
      "Simplified screenshot upload label to SCREENSHOT",
      "Redesigned Manual Signal Entry to compact 3-column desktop grid",
    ],
  },
  {
    version: "1.0.1",
    date: "11 Aug 2026, 23:06 IST",
    title: "Enforce 100% Automatic Customer Parser Resolution",
    highlights: [
      "Removed Customer Parser dropdown UI completely",
      "Enforced 100% automatic internal customer/parser resolution",
      "Aligned Parse Signal and Manual Signal Entry form cards with wireframe layout",
    ],
  },
  {
    version: "1.0.1",
    date: "11 Aug 2026, 22:50 IST",
    title: "Semantic Patch Versioning & Footer Build Alignment",
    highlights: [
      "Replaced sequential build counter with semantic patch versioning (v1.0.1)",
      "Authoritative version source derived directly from package.json",
      "Updated footer display and popover card to v1.0.1 · <SHA>",
      "Standardized Admin Changelog timeline to semantic patch versions",
    ],
  },
  {
    version: "1.0.0",
    date: "11 Aug 2026, 22:39 IST",
    title: "Build Indicator & Admin Navigation Placement",
    highlights: [
      "Moved build indicator strictly to left side of user and admin footers",
      "Created dedicated 'Admin' dropdown menu grouping Changelog and Order Requests",
      "Cleaned build version indicator from top navbars",
    ],
  },
  {
    version: "1.0.0",
    date: "11 Aug 2026, 21:59 IST",
    title: "Build Version Indicator & Admin Changelog",
    highlights: [
      "Added subtle build version indicator with detailed popover modal",
      "Added build-time Git commit SHA and timestamp auto-generation",
      "Added dedicated Admin Changelog timeline UI with active build highlighting",
    ],
  },
  {
    version: "1.0.0",
    date: "11 Aug 2026, 21:34 IST",
    title: "SignalFlow Lifecycle Engine & Validation Suite",
    highlights: [
      "Added lifecycle trade matching & update association engine",
      "Added duplicate signal prevention mechanism",
      "Added end-to-end automated SignalFlow validation suite",
    ],
  },
  {
    version: "1.0.0",
    date: "11 Aug 2026, 20:38 IST",
    title: "Goodwill Signal Parser + Platform Enhancements",
    highlights: [
      "Added customer-specific Goodwill signal parser",
      "Added broad instrument parsing (Index, Stock options, Commodities)",
      "Added TradingView chart image clipboard paste (Ctrl+V) & upload",
      "Added common News & Market Alerts platform section",
      "Added multi-instrument signal parsing support",
      "Preserved 100% SignalFlow parser compatibility",
    ],
  },
];
