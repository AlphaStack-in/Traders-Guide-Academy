import buildInfoData from "./build-info.json";

export interface ChangelogItem {
  version: string;
  sha: string;
  timestamp: string;
  title: string;
  highlights: string[];
}

export interface BuildInfo {
  application: string;
  version: string;
  gitSha: string;
  fullSha: string;
  buildTime: string;
  formattedBuildTime: string;
  changelog: ChangelogItem[];
}

export function getBuildInfo(): BuildInfo {
  const envSha =
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7);

  const gitSha = envSha || buildInfoData.gitSha || "f7152c1";

  return {
    ...buildInfoData,
    gitSha,
  };
}
