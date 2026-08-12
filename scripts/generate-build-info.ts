import fs from "fs";
import path from "path";
import { execSync } from "child_process";

function getAppVersion(): string {
  try {
    const pkgPath = path.join(process.cwd(), "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    return pkg.version || "1.0.6";
  } catch (e) {
    return "1.0.6";
  }
}

function getGitSha(): string {
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7);
  }
  if (process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA) {
    return process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA.slice(0, 7);
  }
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch (e) {
    return "95dbbaf";
  }
}

function getFullGitSha(): string {
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA;
  }
  try {
    return execSync("git rev-parse HEAD").toString().trim();
  } catch (e) {
    return "95dbbaf";
  }
}

function formatISTDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
    hour12: false,
  };
  return new Intl.DateTimeFormat("en-GB", options).format(date) + " IST";
}

export interface RawChangelogItem {
  version: string;
  sha: string;
  timestamp: string;
  title: string;
  highlights: string[];
}

const STATIC_CHANGELOG: RawChangelogItem[] = [
  {
    version: "1.0.6",
    sha: "pending",
    timestamp: "12 Aug 2026, 08:10 IST",
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
    sha: "95dbbaf",
    timestamp: "12 Aug 2026, 08:00 IST",
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
    sha: "2efb220",
    timestamp: "12 Aug 2026, 07:45 IST",
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
    sha: "df9dbe6",
    timestamp: "12 Aug 2026, 07:35 IST",
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
    sha: "3d6b8b9",
    timestamp: "12 Aug 2026, 07:15 IST",
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
    sha: "995a026",
    timestamp: "11 Aug 2026, 23:05 IST",
    title: "Enforce 100% Automatic Customer Parser Resolution",
    highlights: [
      "Removed Customer Parser dropdown UI completely",
      "Enforced 100% automatic internal customer/parser resolution",
      "Aligned Parse Signal and Manual Signal Entry form cards with wireframe layout",
    ],
  },
  {
    version: "1.0.1",
    sha: "22e78cb",
    timestamp: "11 Aug 2026, 22:50 IST",
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
    sha: "f7152c1",
    timestamp: "11 Aug 2026, 22:37 IST",
    title: "Build Indicator & Admin Navigation Placement",
    highlights: [
      "Moved build indicator strictly to left side of user and admin footers",
      "Created dedicated 'Admin' dropdown menu grouping Changelog and Order Requests",
      "Cleaned build version indicator from top navbars",
    ],
  },
  {
    version: "1.0.0",
    sha: "6d02ece",
    timestamp: "11 Aug 2026, 22:00 IST",
    title: "Build Version Indicator & Admin Changelog",
    highlights: [
      "Added subtle build version indicator with detailed popover modal",
      "Added build-time Git commit SHA and timestamp auto-generation",
      "Added dedicated Admin Changelog timeline UI with active build highlighting",
    ],
  },
  {
    version: "1.0.0",
    sha: "e723d56",
    timestamp: "11 Aug 2026, 20:41 IST",
    title: "SignalFlow Lifecycle Engine & Validation Suite",
    highlights: [
      "Added lifecycle trade matching & update association engine",
      "Added duplicate signal prevention mechanism",
      "Added end-to-end automated SignalFlow validation suite",
    ],
  },
  {
    version: "1.0.0",
    sha: "506bbb0",
    timestamp: "11 Aug 2026, 19:48 IST",
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

export function generateBuildInfo() {
  const version = getAppVersion();
  const gitSha = getGitSha();
  const fullSha = getFullGitSha();
  const now = new Date();
  const buildTime = now.toISOString();
  const formattedBuildTime = formatISTDate(now);

  // Set top changelog entry sha to gitSha if pending
  const changelog = STATIC_CHANGELOG.map((item) => {
    if (item.sha === "pending") {
      return { ...item, version, sha: gitSha };
    }
    return item;
  });

  const buildInfo = {
    application: "SignalFlow",
    version,
    gitSha,
    fullSha,
    buildTime,
    formattedBuildTime,
    changelog,
  };

  const targetPath = path.join(process.cwd(), "src", "lib", "build-info.json");
  fs.writeFileSync(targetPath, JSON.stringify(buildInfo, null, 2), "utf-8");
  console.log(`Generated build info: SignalFlow v${version} · ${gitSha}`);
}

generateBuildInfo();
