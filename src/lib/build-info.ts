import buildInfoData from "./build-info.json";

export interface ChangelogItem {
  buildNumber: number;
  formattedBuildNumber: string;
  version: string;
  sha: string;
  timestamp: string;
  title: string;
  highlights: string[];
}

export interface BuildInfo {
  application: string;
  version: string;
  buildNumber: number;
  formattedBuildNumber: string;
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

  const gitSha = envSha || buildInfoData.gitSha || "710ea15";

  // Find matching item in changelog or default to current data
  const matchedItem = buildInfoData.changelog.find((c) => c.sha === gitSha) || buildInfoData.changelog[0];

  return {
    ...buildInfoData,
    buildNumber: matchedItem ? matchedItem.buildNumber : buildInfoData.buildNumber,
    formattedBuildNumber: matchedItem ? matchedItem.formattedBuildNumber : buildInfoData.formattedBuildNumber,
    gitSha,
  };
}
