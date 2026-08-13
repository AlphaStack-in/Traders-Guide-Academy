import type { NextConfig } from "next";
import { execSync } from "child_process";

/**
 * Resolve the Git commit SHA at build time.
 *
 * Priority order:
 *   1. VERCEL_GIT_COMMIT_SHA   — set by Vercel for every production/preview build
 *   2. git rev-parse HEAD       — available in any local or CI environment with Git
 *   3. "unknown"                — safe explicit fallback; never a fake SHA
 */
function resolveGitSha(): string {
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA;
  }
  try {
    return execSync("git rev-parse HEAD", { stdio: ["pipe", "pipe", "pipe"] })
      .toString()
      .trim();
  } catch {
    return "unknown";
  }
}

const fullSha = resolveGitSha();
const shortSha = fullSha === "unknown" ? "unknown" : fullSha.slice(0, 7);

const buildTime = new Date().toISOString();

const formattedBuildTime = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
  hour12: false,
}).format(new Date(buildTime)) + " IST";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "i.ytimg.com" }],
  },

  /**
   * Build-time metadata baked into the JS bundle via webpack DefinePlugin.
   * These are resolved ONCE when `next build` (or `next dev`) runs.
   *
   * Consumers: src/lib/build-info.ts → getBuildInfo()
   */
  env: {
    NEXT_BUILD_TIME: buildTime,
    NEXT_BUILD_TIME_FORMATTED: formattedBuildTime,
    NEXT_GIT_SHA_SHORT: shortSha,
    NEXT_GIT_SHA_FULL: fullSha,
  },
};

export default nextConfig;
