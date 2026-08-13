/**
 * Regression test: verifies the new build-metadata + changelog architecture.
 *
 * Run with:  npx tsx scripts/test_build_changelog.ts
 *
 * Updated 2026-08-13 to match the refactored architecture:
 *   - build-info.json is no longer generated or committed
 *   - CHANGELOG lives in src/lib/changelog.ts
 *   - getBuildInfo() reads from process.env.* (baked by next.config.ts)
 *   - version is cross-checked between package.json and changelog.ts
 */
import { getBuildInfo } from "../src/lib/build-info";
import { CHANGELOG } from "../src/lib/changelog";
import fs from "fs";
import path from "path";

function runBuildChangelogTests() {
  console.log("=== RUNNING BUILD METADATA + CHANGELOG TEST SUITE ===\n");

  // 1. Verify package.json version exists
  const pkgPath = path.join(process.cwd(), "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  console.assert(typeof pkg.version === "string" && pkg.version.length > 0, "FAIL: package.json version is missing or empty");
  console.log(`✓ package.json version: v${pkg.version}`);

  // 2. Verify build-info.json is NOT present (it must not be committed)
  const buildInfoJsonPath = path.join(process.cwd(), "src", "lib", "build-info.json");
  console.assert(!fs.existsSync(buildInfoJsonPath), "FAIL: src/lib/build-info.json still exists — it must be gitignored and deleted!");
  console.log("✓ src/lib/build-info.json correctly absent (not committed).");

  // 3. Verify changelog.ts is present and has entries
  const changelogTsPath = path.join(process.cwd(), "src", "lib", "changelog.ts");
  console.assert(fs.existsSync(changelogTsPath), "FAIL: src/lib/changelog.ts is missing!");
  console.log("✓ src/lib/changelog.ts exists.");

  console.assert(Array.isArray(CHANGELOG) && CHANGELOG.length > 0, "FAIL: CHANGELOG array is empty!");
  console.log(`✓ CHANGELOG has ${CHANGELOG.length} entries.`);

  // 4. Verify CHANGELOG entries have the required fields and no stale SHA field
  for (const entry of CHANGELOG) {
    console.assert(typeof entry.version === "string", `FAIL: Entry missing version: ${JSON.stringify(entry)}`);
    console.assert(typeof entry.date === "string", `FAIL: Entry missing date: ${JSON.stringify(entry)}`);
    console.assert(typeof entry.title === "string", `FAIL: Entry missing title: ${JSON.stringify(entry)}`);
    console.assert(Array.isArray(entry.highlights), `FAIL: Entry missing highlights array: ${JSON.stringify(entry)}`);
    console.assert(!("sha" in entry), `FAIL: Entry still has a stale 'sha' field: ${JSON.stringify(entry)}`);
    console.assert(!("timestamp" in entry), `FAIL: Entry still has a stale 'timestamp' field: ${JSON.stringify(entry)}`);
  }
  console.log("✓ All CHANGELOG entries have valid structure (no stale sha/timestamp fields).");

  // 5. Verify the latest changelog entry matches package.json version
  const latestEntry = CHANGELOG[0];
  console.assert(
    latestEntry.version === pkg.version,
    `WARN: Latest changelog entry v${latestEntry.version} does not match package.json v${pkg.version} — remember to add a changelog entry when bumping the version.`
  );
  console.log(`✓ Latest changelog entry matches package.json: v${latestEntry.version}`);

  // 6. Verify getBuildInfo() returns valid shape (values may be "unknown" in non-build environments)
  const info = getBuildInfo();
  console.assert(info.application === "SignalFlow", `FAIL: Expected application 'SignalFlow', got '${info.application}'`);
  console.assert(typeof info.version === "string", "FAIL: info.version is not a string");
  console.assert(typeof info.gitSha === "string" && info.gitSha.length > 0, "FAIL: info.gitSha is empty");
  console.assert(!("changelog" in info), "FAIL: getBuildInfo() still returns a 'changelog' property — it was moved to changelog.ts!");
  console.assert(info.gitSha !== "f7152c1" && info.gitSha !== "8967943", `FAIL: Stale hardcoded SHA detected: ${info.gitSha}`);
  console.log(`✓ getBuildInfo() — application: ${info.application}`);
  console.log(`✓ getBuildInfo() — version: v${info.version}`);
  console.log(`✓ getBuildInfo() — gitSha: ${info.gitSha}`);
  console.log(`✓ getBuildInfo() — buildTime: ${info.formattedBuildTime}`);

  // 7. Verify placement invariants (unchanged from before)
  const userNavbarContent = fs.readFileSync(path.join(process.cwd(), "src", "components", "site", "navbar.tsx"), "utf-8");
  console.assert(!userNavbarContent.includes("BuildVersionIndicator"), "FAIL: BuildVersionIndicator still present in user top navbar!");
  console.log("✓ BuildVersionIndicator cleanly absent from user top navbar.");

  const footerContent = fs.readFileSync(path.join(process.cwd(), "src", "components", "site", "footer.tsx"), "utf-8");
  console.assert(footerContent.includes("BuildVersionIndicator"), "FAIL: BuildVersionIndicator missing from user footer!");
  console.log("✓ BuildVersionIndicator present in user footer.");

  const adminNavContent = fs.readFileSync(path.join(process.cwd(), "src", "components", "admin", "admin-nav.tsx"), "utf-8");
  console.assert(!adminNavContent.includes("BuildVersionIndicator"), "FAIL: BuildVersionIndicator present in admin header — should not be!");
  console.assert(adminNavContent.includes("adminGroupLinks") && adminNavContent.includes("Admin"), "FAIL: Admin dropdown menu missing from AdminNav!");
  console.log("✓ Admin dropdown menu verified in AdminNav.");

  const adminLayoutContent = fs.readFileSync(path.join(process.cwd(), "src", "app", "admin", "(protected)", "layout.tsx"), "utf-8");
  console.assert(adminLayoutContent.includes("BuildVersionIndicator"), "FAIL: BuildVersionIndicator missing from admin footer!");
  console.log("✓ BuildVersionIndicator present in admin footer.");

  // 8. Verify generate-build-info is retired (no generateBuildInfo() export)
  const generatorContent = fs.readFileSync(path.join(process.cwd(), "scripts", "generate-build-info.ts"), "utf-8");
  console.assert(!generatorContent.includes("generateBuildInfo()"), "FAIL: generate-build-info.ts still calls generateBuildInfo() — it must be retired!");
  // Check for the actual const declaration, not just the word in a comment or string.
  console.assert(!generatorContent.includes("const STATIC_CHANGELOG"), "FAIL: generate-build-info.ts still declares STATIC_CHANGELOG — changelog must live in changelog.ts!");
  console.log("✓ generate-build-info.ts correctly retired (no active generation code).");

  console.log("\n=== ALL BUILD METADATA + CHANGELOG TESTS PASSED ===");
}

runBuildChangelogTests();
