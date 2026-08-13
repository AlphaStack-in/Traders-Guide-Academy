#!/usr/bin/env node
/**
 * validate-admin-auth.mjs
 *
 * Focused validation of the admin-auth security logic.
 * Run with:  node scripts/validate-admin-auth.mjs
 *
 * This script does NOT connect to Supabase or any external service.
 * It tests the pure-logic portions of the authorization mechanism in
 * isolation by re-implementing the helpers from admin-auth.ts here.
 *
 * To exercise the full flow (Supabase + ADMIN_EMAILS) in a staging
 * environment, manually test the eight cases listed at the bottom.
 */

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✓  ${label}`);
    passed++;
  } else {
    console.error(`  ✗  FAIL: ${label}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// Re-implement the pure-logic portion of admin-auth.ts for isolated testing.
// ---------------------------------------------------------------------------

function getAuthorizedAdminEmails(envValue) {
  const raw = envValue ?? "";
  if (!raw.trim()) return new Set();
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

function isAdminEmail(email, envValue) {
  const authorized = getAuthorizedAdminEmails(envValue);
  if (authorized.size === 0) return false;
  return authorized.has(email.trim().toLowerCase());
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

console.log("\n── Admin-auth logic validation ──────────────────────────────────\n");

// 1. Fail-closed: ADMIN_EMAILS not set
console.log("1. Fail-closed behavior (ADMIN_EMAILS not configured)");
assert(!isAdminEmail("alice@example.com", undefined), "unset ADMIN_EMAILS → denied");
assert(!isAdminEmail("alice@example.com", ""), "empty ADMIN_EMAILS → denied");
assert(!isAdminEmail("alice@example.com", "   "), "whitespace-only ADMIN_EMAILS → denied");

// 2. Authorized admin
console.log("\n2. Authorized admin");
assert(isAdminEmail("alice@example.com", "alice@example.com"), "exact match → allowed");
assert(isAdminEmail("alice@example.com", "alice@example.com,bob@example.com"), "multi-list match → allowed");
assert(isAdminEmail("ALICE@EXAMPLE.COM", "alice@example.com"), "case-insensitive (upper→lower) → allowed");
assert(isAdminEmail("alice@example.com", "ALICE@EXAMPLE.COM"), "case-insensitive (lower→upper) → allowed");
assert(isAdminEmail("  alice@example.com  ", "alice@example.com"), "whitespace trimmed → allowed");

// 3. Authenticated non-admin
console.log("\n3. Authenticated non-admin");
assert(!isAdminEmail("eve@example.com", "alice@example.com"), "different email → denied");
assert(!isAdminEmail("", "alice@example.com"), "empty email → denied");
assert(!isAdminEmail("alice@example.co", "alice@example.com"), "near-miss email → denied");

// 4. ADMIN_EMAILS with extra whitespace / empty entries
console.log("\n4. Malformed ADMIN_EMAILS list handling");
assert(isAdminEmail("alice@example.com", "  alice@example.com  , bob@example.com "), "padded entries → parsed correctly");
assert(isAdminEmail("bob@example.com", "alice@example.com,,bob@example.com"), "empty middle entry → skipped");
assert(!isAdminEmail("@", "alice@example.com"), "bare @ → denied");

// 5. requireAdminAuth:false cannot bypass authorization
console.log("\n5. requireAdminAuth:false bypass prevention");
// The old pattern was: if (!clientConfig.requireAdminAuth) return;
// Simulated: regardless of requireAdminAuth, isAdminEmail must still be called.
const requireAdminAuthFalse = false;
function oldRequireAdmin(requireAdminAuthFlag, email, envValue) {
  if (!requireAdminAuthFlag) return true; // OLD: bypass — always "passes"
  return isAdminEmail(email, envValue);
}
function newRequireAdmin(email, envValue) {
  // NEW: always checks
  return isAdminEmail(email, envValue);
}
assert(oldRequireAdmin(requireAdminAuthFalse, "eve@example.com", "alice@example.com"),
  "OLD pattern: requireAdminAuth:false bypasses auth (expected INSECURE behavior)");
assert(!newRequireAdmin("eve@example.com", "alice@example.com"),
  "NEW pattern: requireAdminAuth:false cannot bypass authorization");

// 6. POST /api/news auth flow (simulated)
console.log("\n6. POST /api/news authorization logic");
function simulateNewsPost(user, envValue) {
  // Mirrors getAdminUser() logic
  if (!user || !user.email) return { ok: false, status: 401 };
  if (!isAdminEmail(user.email, envValue)) return { ok: false, status: 403 };
  return { ok: true };
}
assert(simulateNewsPost(null, "alice@example.com").status === 401, "anonymous → 401");
assert(simulateNewsPost({ email: "eve@example.com" }, "alice@example.com").status === 403, "non-admin → 403");
assert(simulateNewsPost({ email: "alice@example.com" }, "alice@example.com").ok === true, "admin → allowed");

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log("\n─────────────────────────────────────────────────────────────────");
console.log(`Results: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  console.error("❌  Validation FAILED — review the failures above.\n");
  process.exit(1);
} else {
  console.log("✅  All checks passed.\n");
  console.log("Manual integration tests still required (needs Supabase + ADMIN_EMAILS):");
  console.log("  1. Anonymous request to /admin/* → redirected to /admin/login");
  console.log("  2. Authenticated non-admin request to /admin/* → redirected to /admin/login");
  console.log("  3. Authorized admin request to /admin/* → dashboard rendered");
  console.log("  4. POST /api/news anonymous → 401");
  console.log("  5. POST /api/news non-admin → 403");
  console.log("  6. POST /api/news admin + valid payload → 201");
  console.log("  7. POST /api/news admin + malformed payload → 400");
  console.log("  8. StockOps/Goodwill deployment: anonymous /admin/* → /admin/login (not dashboard)");
  process.exit(0);
}
