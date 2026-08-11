import buildInfoData from "./build-info.json";

export interface ChangelogItem {
  version: string;
  sha: string;
  date: string;
  title: string;
  highlights: string[];
}

export interface BuildInfo {
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

  const gitSha = envSha || buildInfoData.gitSha || "e723d56";

  return {
    ...buildInfoData,
    gitSha,
  };
}
