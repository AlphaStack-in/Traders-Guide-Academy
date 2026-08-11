import fs from "fs";
import path from "path";
import { execSync } from "child_process";

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
    return "710ea15";
  }
}

function getFullGitSha(): string {
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA;
  }
  try {
    return execSync("git rev-parse HEAD").toString().trim();
  } catch (e) {
    return "710ea15";
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
  buildNumber: number;
  formattedBuildNumber: string;
  version: string;
  sha: string;
  timestamp: string;
  title: string;
  highlights: string[];
}

const STATIC_CHANGELOG: RawChangelogItem[] = [
  {
    buildNumber: 8,
    formattedBuildNumber: "#008",
    version: "1.0.0",
    sha: "710ea15",
    timestamp: "11 Aug 2026, 22:37 IST",
    title: "Build Indicator, Admin Menu & Build Changelog Refinement",
    highlights: [
      "Moved build indicator strictly to left side of user and admin footers",
      "Created dedicated 'Admin' dropdown menu grouping Changelog and Order Requests",
      "Introduced deterministic sequential build/patch counter (#008)",
      "Standardized all changelog entries to full IST timestamps",
    ],
  },
  {
    buildNumber: 7,
    formattedBuildNumber: "#007",
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
    buildNumber: 6,
    formattedBuildNumber: "#006",
    version: "1.0.0",
    sha: "e723d56",
    timestamp: "11 Aug 2026, 20:41 IST",
    title: "SignalFlow Lifecycle Engine & End-to-End Validation",
    highlights: [
      "Added lifecycle trade matching & update association engine",
      "Added duplicate signal prevention mechanism",
      "Added end-to-end automated SignalFlow validation suite",
    ],
  },
  {
    buildNumber: 5,
    formattedBuildNumber: "#005",
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
  {
    buildNumber: 4,
    formattedBuildNumber: "#004",
    version: "1.0.0",
    sha: "0fc7d58",
    timestamp: "11 Aug 2026, 14:15 IST",
    title: "Database Hardening & Case-Insensitive Email Index",
    highlights: [
      "Executed defensive orphan subscriber record cleanup",
      "Added PostgreSQL case-insensitive unique index on LOWER(email)",
      "Standardized uniform email normalization",
    ],
  },
  {
    buildNumber: 3,
    formattedBuildNumber: "#003",
    version: "1.0.0",
    sha: "0d2ab13",
    timestamp: "11 Aug 2026, 13:45 IST",
    title: "OAuth Subscriber Linking & Auth Hardening",
    highlights: [
      "Fixed Google OAuth HTTP 500 callback error",
      "Hardened subscriber account linking logic",
      "Added race-condition fallback and user error boundaries",
    ],
  },
  {
    buildNumber: 2,
    formattedBuildNumber: "#002",
    version: "1.0.0",
    sha: "4a83707",
    timestamp: "11 Aug 2026, 12:30 IST",
    title: "Subscriber Google OAuth & Password Auth",
    highlights: [
      "Integrated Google OAuth login for subscribers",
      "Added password authentication & account linking",
    ],
  },
  {
    buildNumber: 1,
    formattedBuildNumber: "#001",
    version: "1.0.0",
    sha: "cafead3",
    timestamp: "10 Aug 2026, 18:20 IST",
    title: "Referral Rewards & Social Promotion Module",
    highlights: [
      "Expanded referral rewards tracking and ledger",
      "Added social promotion share verification and rewards",
    ],
  },
];

export function generateBuildInfo() {
  const gitSha = getGitSha();
  const fullSha = getFullGitSha();
  const now = new Date();
  const buildTime = now.toISOString();
  const formattedBuildTime = formatISTDate(now);

  // Find matching build item or default to latest
  const matchedItem = STATIC_CHANGELOG.find(item => item.sha === gitSha) || STATIC_CHANGELOG[0];
  const buildNumber = matchedItem.buildNumber;
  const formattedBuildNumber = matchedItem.formattedBuildNumber;

  const buildInfo = {
    application: "SignalFlow",
    version: "1.0.0",
    buildNumber,
    formattedBuildNumber,
    gitSha,
    fullSha,
    buildTime,
    formattedBuildTime,
    changelog: STATIC_CHANGELOG,
  };

  const targetPath = path.join(process.cwd(), "src", "lib", "build-info.json");
  fs.writeFileSync(targetPath, JSON.stringify(buildInfo, null, 2), "utf-8");
  console.log(`Generated build info: SignalFlow v1.0.0 · build ${formattedBuildNumber} · ${gitSha}`);
}

generateBuildInfo();
