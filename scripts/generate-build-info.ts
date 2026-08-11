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
    return "e723d56";
  }
}

function getFullGitSha(): string {
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA;
  }
  try {
    return execSync("git rev-parse HEAD").toString().trim();
  } catch (e) {
    return "e723d56";
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

const STATIC_CHANGELOG = [
  {
    version: "1.0.0",
    sha: "e723d56",
    date: "11 Aug 2026",
    title: "SignalFlow Lifecycle Engine & End-to-End Validation",
    highlights: [
      "Added lifecycle trade matching & update association engine",
      "Added duplicate signal prevention mechanism",
      "Added end-to-end automated SignalFlow validation suite",
    ],
  },
  {
    version: "1.0.0",
    sha: "506bbb0",
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
  {
    version: "1.0.0",
    sha: "0fc7d58",
    date: "11 Aug 2026",
    title: "Database Hardening & Case-Insensitive Email Index",
    highlights: [
      "Executed defensive orphan subscriber record cleanup",
      "Added PostgreSQL case-insensitive unique index on LOWER(email)",
      "Standardized uniform email normalization",
    ],
  },
  {
    version: "1.0.0",
    sha: "0d2ab13",
    date: "11 Aug 2026",
    title: "OAuth Subscriber Linking & Auth Hardening",
    highlights: [
      "Fixed Google OAuth HTTP 500 callback error",
      "Hardened subscriber account linking logic",
      "Added race-condition fallback and user error boundaries",
    ],
  },
  {
    version: "1.0.0",
    sha: "4a83707",
    date: "11 Aug 2026",
    title: "Subscriber Google OAuth & Password Auth",
    highlights: [
      "Integrated Google OAuth login for subscribers",
      "Added password authentication & account linking",
    ],
  },
  {
    version: "1.0.0",
    sha: "cafead3",
    date: "10 Aug 2026",
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

  const buildInfo = {
    version: "1.0.0",
    gitSha,
    fullSha,
    buildTime,
    formattedBuildTime,
    changelog: STATIC_CHANGELOG,
  };

  const targetPath = path.join(process.cwd(), "src", "lib", "build-info.json");
  fs.writeFileSync(targetPath, JSON.stringify(buildInfo, null, 2), "utf-8");
  console.log(`Generated build info: version 1.0.0 · build ${gitSha}`);
}

generateBuildInfo();
