/**
 * Build-time metadata accessor.
 *
 * All values are baked into the bundle by next.config.ts at `next build` /
 * `next dev` time — there is no JSON file to read or commit.
 *
 * CHANGELOG data lives separately in src/lib/changelog.ts.
 */

export interface BuildInfo {
  /** Application display name. */
  application: string;
  /** Semantic version from package.json, injected by next.config.ts. */
  version: string;
  /** Short (7-char) Git commit SHA, or "unknown". */
  gitSha: string;
  /** Full Git commit SHA, or "unknown". */
  fullSha: string;
  /** ISO 8601 build timestamp. */
  buildTime: string;
  /** Human-readable build timestamp in IST. */
  formattedBuildTime: string;
}

export function getBuildInfo(): BuildInfo {
  return {
    application: "SignalFlow",
    // next.config.ts injects the package.json version via npm_package_version
    // which Next.js makes available as process.env.npm_package_version during
    // the build. We also fall back to the literal injected by env: in
    // next.config.ts (no-op on Vercel since npm_package_version is set).
    version: process.env.npm_package_version ?? "0.0.0",
    gitSha: process.env.NEXT_GIT_SHA_SHORT ?? "unknown",
    fullSha: process.env.NEXT_GIT_SHA_FULL ?? "unknown",
    buildTime: process.env.NEXT_BUILD_TIME ?? new Date().toISOString(),
    formattedBuildTime: process.env.NEXT_BUILD_TIME_FORMATTED ?? "unknown",
  };
}
