/**
 * Centralized server-side admin authorization.
 *
 * Authorization mechanism:
 * ---------------------------------------------------------------------------
 * Admins are identified by the ADMIN_EMAILS environment variable — a
 * comma-separated list of the exact email addresses that are permitted to
 * access admin functionality.  This variable is server-only (no
 * NEXT_PUBLIC_ prefix) so it is never exposed to the browser.
 *
 * Example .env.local entry:
 *   ADMIN_EMAILS="alice@example.com,bob@example.com"
 *
 * If ADMIN_EMAILS is not set the helper ALWAYS fails closed — no one
 * (including authenticated users) can access admin functionality.
 *
 * Why an allow-list instead of app_metadata.role?
 * ---------------------------------------------------------------------------
 * app_metadata.role is not currently configured for any Supabase users in
 * this project.  Deploying an app_metadata check without first setting the
 * role would immediately lock all legitimate admins out of the system.
 * The email allow-list is the minimal, explicit, server-side mechanism that
 * correctly identifies the admins that already exist, requires no database
 * migration, and is trivially auditable.
 *
 * Migration path:
 * ---------------------------------------------------------------------------
 * When ready to switch to Supabase app_metadata roles, set `role: "admin"`
 * on the relevant Supabase users via the dashboard or management API, add
 * the `hasAdminRole` check here, and then remove ADMIN_EMAILS once all
 * admins have been migrated.
 *
 * Security properties:
 * ---------------------------------------------------------------------------
 * - Fail-closed: missing config → denied.
 * - Server-side only: client-provided values are never trusted.
 * - Authentication + authorization: both are required.
 * - No client-side leakage: ADMIN_EMAILS is not prefixed with NEXT_PUBLIC_.
 *
 * Usage:
 * ---------------------------------------------------------------------------
 * In Server Actions:
 *   await requireAdmin();   // throws on failure
 *
 * In API Route handlers:
 *   const result = await getAdminUser();
 *   if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
 *
 * In Server Component layouts/pages:
 *   await requireAdmin();   // redirect or throw on failure
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Returns the normalized (lower-cased, trimmed) set of authorized admin
 * email addresses from the ADMIN_EMAILS env variable.
 * Returns an empty set if the variable is not set or empty (fail-closed).
 */
function getAuthorizedAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? "";
  if (!raw.trim()) return new Set();
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

/**
 * Returns true iff the given email is in the server-side admin allow-list.
 * Comparison is case-insensitive.
 * Fails closed if ADMIN_EMAILS is not configured.
 */
function isAdminEmail(email: string): boolean {
  const authorized = getAuthorizedAdminEmails();
  if (authorized.size === 0) return false;
  return authorized.has(email.trim().toLowerCase());
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type AdminCheckResult =
  | { ok: true; userId: string; email: string }
  | { ok: false; error: string; status: 401 | 403 };

/**
 * Verifies that the current request comes from an authenticated, authorized
 * admin user.
 *
 * - Unauthenticated → { ok: false, status: 401 }
 * - Authenticated but not an admin → { ok: false, status: 403 }
 * - Authorized admin → { ok: true, userId, email }
 *
 * Suitable for use in API Route handlers where you need the status code to
 * build a proper JSON error response rather than throwing.
 */
export async function getAdminUser(): Promise<AdminCheckResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { ok: false, error: "Unauthorized", status: 401 };
  }

  if (!isAdminEmail(user.email)) {
    return { ok: false, error: "Forbidden", status: 403 };
  }

  return { ok: true, userId: user.id, email: user.email };
}

/**
 * Throws if the current caller is not an authenticated, authorized admin.
 *
 * Suitable for use in Server Actions and Server Component
 * layouts/pages where throwing is the idiomatic failure path.
 *
 * Throws Error("Unauthorized") for unauthenticated callers.
 * Throws Error("Forbidden") for authenticated non-admins.
 */
export async function requireAdmin(): Promise<{ userId: string; email: string }> {
  const result = await getAdminUser();
  if (!result.ok) {
    throw new Error(result.error);
  }
  return { userId: result.userId, email: result.email };
}
