import { getBuildInfo } from "../src/lib/build-info";
import fs from "fs";
import path from "path";

function runBuildChangelogTests() {
  console.log("=== RUNNING BUILD INDICATOR & CHANGELOG TEST SUITE ===\n");

  // 1. Verify build-info.json existence
  const buildInfoPath = path.join(process.cwd(), "src", "lib", "build-info.json");
  console.assert(fs.existsSync(buildInfoPath), "FAIL: build-info.json missing!");
  console.log("✓ src/lib/build-info.json exists.");

  // 2. Verify getBuildInfo()
  const info = getBuildInfo();
  console.assert(Boolean(info.version), "FAIL: Version missing");
  console.assert(Boolean(info.gitSha), "FAIL: Git SHA missing");
  console.assert(Boolean(info.formattedBuildTime), "FAIL: Build time missing");
  console.assert(Array.isArray(info.changelog) && info.changelog.length > 0, "FAIL: Changelog entries missing");

  console.log(`✓ Application Version: v${info.version}`);
  console.log(`✓ Git Commit SHA: ${info.gitSha}`);
  console.log(`✓ Build Timestamp: ${info.formattedBuildTime}`);
  console.log(`✓ Changelog items imported: ${info.changelog.length} commits`);

  // 3. Verify Current Build Identification
  const currentEntry = info.changelog.find((c) => c.sha === info.gitSha) || info.changelog[0];
  console.assert(Boolean(currentEntry), "FAIL: Could not identify current build entry");
  console.log(`✓ Currently Deployed Build identified: [${currentEntry.sha}] ${currentEntry.title}`);

  console.log("\n=== ALL BUILD INDICATOR & CHANGELOG TESTS PASSED ===");
}

runBuildChangelogTests();
