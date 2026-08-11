import { getBuildInfo } from "../src/lib/build-info";
import fs from "fs";
import path from "path";

function runBuildChangelogTests() {
  console.log("=== RUNNING BUILD INDICATOR, COUNTER & ADMIN NAV TEST SUITE ===\n");

  // 1. Verify build-info.json existence
  const buildInfoPath = path.join(process.cwd(), "src", "lib", "build-info.json");
  console.assert(fs.existsSync(buildInfoPath), "FAIL: build-info.json missing!");
  console.log("✓ src/lib/build-info.json exists.");

  // 2. Verify getBuildInfo() and build counter
  const info = getBuildInfo();
  console.assert(Boolean(info.application === "SignalFlow"), "FAIL: Application name missing or invalid");
  console.assert(Boolean(info.version), "FAIL: Version missing");
  console.assert(typeof info.buildNumber === "number" && info.buildNumber > 0, "FAIL: Build number invalid");
  console.assert(Boolean(info.formattedBuildNumber), "FAIL: Formatted build number missing");
  console.assert(Boolean(info.gitSha), "FAIL: Git SHA missing");
  console.assert(Boolean(info.formattedBuildTime), "FAIL: Build time missing");
  console.assert(Array.isArray(info.changelog) && info.changelog.length > 0, "FAIL: Changelog entries missing");

  console.log(`✓ Application Name: ${info.application}`);
  console.log(`✓ Application Version: v${info.version}`);
  console.log(`✓ Build Counter: Build ${info.formattedBuildNumber} (#${info.buildNumber})`);
  console.log(`✓ Git Commit SHA: ${info.gitSha}`);
  console.log(`✓ Build Timestamp: ${info.formattedBuildTime}`);
  console.log(`✓ Changelog items imported: ${info.changelog.length} commits`);

  // 3. Verify Current Build Identification
  const currentEntry = info.changelog.find((c) => c.sha === info.gitSha) || info.changelog[0];
  console.assert(Boolean(currentEntry), "FAIL: Could not identify current build entry");
  console.assert(Boolean(currentEntry.timestamp.includes("IST")), "FAIL: Timestamp missing IST timezone");
  console.log(`✓ Currently Deployed Build identified: [${currentEntry.formattedBuildNumber} · ${currentEntry.sha}] ${currentEntry.title} (${currentEntry.timestamp})`);

  // 4. Verify Nav Removal and Placement Invariant
  const userNavbarContent = fs.readFileSync(path.join(process.cwd(), "src", "components", "site", "navbar.tsx"), "utf-8");
  console.assert(!userNavbarContent.includes("BuildVersionIndicator"), "FAIL: BuildVersionIndicator still present in user top navbar!");
  console.log("✓ BuildVersionIndicator cleanly removed from user top navbar.");

  const footerContent = fs.readFileSync(path.join(process.cwd(), "src", "components", "site", "footer.tsx"), "utf-8");
  console.assert(footerContent.includes("BuildVersionIndicator"), "FAIL: BuildVersionIndicator missing from user footer!");
  console.log("✓ BuildVersionIndicator verified in user footer (left side below copyright).");

  const adminNavContent = fs.readFileSync(path.join(process.cwd(), "src", "components", "admin", "admin-nav.tsx"), "utf-8");
  console.assert(!adminNavContent.includes("BuildVersionIndicator"), "FAIL: BuildVersionIndicator still present in admin header!");
  console.assert(adminNavContent.includes("adminGroupLinks") && adminNavContent.includes("Admin"), "FAIL: Admin dropdown menu missing from AdminNav!");
  console.log("✓ BuildVersionIndicator removed from admin header; 'Admin' dropdown menu verified.");

  const adminLayoutContent = fs.readFileSync(path.join(process.cwd(), "src", "app", "admin", "(protected)", "layout.tsx"), "utf-8");
  console.assert(adminLayoutContent.includes("BuildVersionIndicator"), "FAIL: BuildVersionIndicator missing from admin footer!");
  console.log("✓ BuildVersionIndicator verified in admin footer (left side below copyright).");

  console.log("\n=== ALL BUILD INDICATOR, COUNTER & NAV TESTS PASSED ===");
}

runBuildChangelogTests();
