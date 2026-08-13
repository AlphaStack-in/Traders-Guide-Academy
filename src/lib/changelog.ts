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
  /** Human-readable release date, e.g. "12 Aug 2026". */
  date: string;
  /** Short title summarising the release. */
  title: string;
  /** Bullet-point highlights for this release. */
  highlights: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.0.7",
    date: "12 Aug 2026",
    title: "Parse Signal Textarea Placeholder Example Only Refinement",
    highlights: [
      "Removed 'Paste raw signal message...' from Parse text input placeholder",
      "Showing strictly 'Example: NIFTY 24450 PE BUY ABOVE 15 SL 1 TARGETS 155,170' as placeholder prompt",
    ],
  },
  {
    version: "1.0.6",
    date: "12 Aug 2026",
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
    date: "12 Aug 2026",
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
    date: "12 Aug 2026",
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
    date: "12 Aug 2026",
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
    date: "12 Aug 2026",
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
    date: "11 Aug 2026",
    title: "Enforce 100% Automatic Customer Parser Resolution",
    highlights: [
      "Removed Customer Parser dropdown UI completely",
      "Enforced 100% automatic internal customer/parser resolution",
      "Aligned Parse Signal and Manual Signal Entry form cards with wireframe layout",
    ],
  },
  {
    version: "1.0.1",
    date: "11 Aug 2026",
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
    date: "11 Aug 2026",
    title: "Build Indicator & Admin Navigation Placement",
    highlights: [
      "Moved build indicator strictly to left side of user and admin footers",
      "Created dedicated 'Admin' dropdown menu grouping Changelog and Order Requests",
      "Cleaned build version indicator from top navbars",
    ],
  },
  {
    version: "1.0.0",
    date: "11 Aug 2026",
    title: "Build Version Indicator & Admin Changelog",
    highlights: [
      "Added subtle build version indicator with detailed popover modal",
      "Added build-time Git commit SHA and timestamp auto-generation",
      "Added dedicated Admin Changelog timeline UI with active build highlighting",
    ],
  },
  {
    version: "1.0.0",
    date: "11 Aug 2026",
    title: "SignalFlow Lifecycle Engine & Validation Suite",
    highlights: [
      "Added lifecycle trade matching & update association engine",
      "Added duplicate signal prevention mechanism",
      "Added end-to-end automated SignalFlow validation suite",
    ],
  },
  {
    version: "1.0.0",
    date: "11 Aug 2026",
    title: "Goodwill Signal Parser + Platform Enhancements",
    highlights: [
      "Added customer-specific Goodwill signal parser",
      "Added broad instrument parsing (Index, Stock options, Commodities)",
      "Added TradingView chart image clipboard paste (Ctrl+V) & upload",
      "Added common News & Market Alerts platform section",
      "Added multi-instrument signal parsing support",
      "Preserved 100% THC parser compatibility",
    ],
  },
];
