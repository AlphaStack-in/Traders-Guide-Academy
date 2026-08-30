/**
 * Centralized server-side admin authorization.
 *
 * TGA has exactly one admin account, defined entirely by environment
 * variables (ADMIN_EMAIL, ADMIN_PASSWORD_HASH, SESSION_SECRET) — there is no
 * database-backed multi-admin system. This replaced the previous Supabase
 * Auth (Google OAuth) + AdminUser-table RBAC when TGA moved its database off
 * Supabase onto Neon. Google sign-in returned later (see
 * src/lib/google-oauth.ts + src/app/api/auth/google/), but only as an
 * alternate credential for this same single env-var-defined identity — it
 * still just calls createAdminSession() below once the Google email matches
 * ADMIN_EMAIL, not a separate OAuth-backed account system.
 *
 * Session mechanism: an HMAC-signed, httpOnly cookie (see
 * src/lib/session-cookie.ts), verified server-side on every check — no
 * external session store, no new npm dependencies.
 *
 * `accessLevel` is always "SUPER_ADMIN" and `source` is always "env_fallback"
 * — both fields are kept in the return shape purely so existing call sites
 * (which check `accessLevel`, call `requireAccessLevel()`, or destructure
 * `source`) keep working unchanged. The AdminUser/AdminUserAuditLog Prisma
 * models are no longer read here; they're unused dead schema now (left in
 * place rather than risking an unnecessary migration — see handoff notes).
 *
 * Usage:
 * ---------------------------------------------------------------------------
 * In Server Actions (throw on failure):
 *   const admin = await requireAdmin();
 *   const admin = await requireAccessLevel("SIGNAL_MANAGER"); // always passes
 *
 * In API Route handlers (return status code):
 *   const result = await getAdminUser();
 *   if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
 */

import { cookies } from "next/headers";
import type { AdminAccessLevel } from "@prisma/client";
import { createSessionToken, verifySessionToken } from "@/lib/session-cookie";
import { verifyPassword } from "@/lib/password";

export const ADMIN_SESSION_COOKIE = "admin_session";
const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

interface AdminSessionPayload {
  role: "admin";
  email: string;
  exp: number;
}

// ---------------------------------------------------------------------------
// Access level ordering — kept for API compatibility with existing callers.
// With a single hardcoded admin, every authenticated session is SUPER_ADMIN,
// so hasPermission()/requireAccessLevel() always pass once authenticated.
// ---------------------------------------------------------------------------

const ACCESS_LEVEL_ORDER: AdminAccessLevel[] = [
  "VIEWER",
  "SUPPORT",
  "SIGNAL_MANAGER",
  "ADMIN",
  "SUPER_ADMIN",
];

export function hasPermission(
  actual: AdminAccessLevel,
  required: AdminAccessLevel,
): boolean {
  return ACCESS_LEVEL_ORDER.indexOf(actual) >= ACCESS_LEVEL_ORDER.indexOf(required);
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type AdminCheckResult =
  | {
      ok: true;
      userId: string;
      email: string;
      accessLevel: AdminAccessLevel;
      adminUserId: string;
      source: "database" | "env_fallback";
    }
  | { ok: false; error: string; status: 401 | 403 };

// ---------------------------------------------------------------------------
// Credential verification + session issuance (used by the login action)
// ---------------------------------------------------------------------------

/**
 * Checks a submitted email/password against ADMIN_EMAIL/ADMIN_PASSWORD_HASH.
 * Fails closed (returns false) if either env var is unset.
 */
export function verifyAdminCredentials(email: string, password: string): boolean {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (!adminEmail || !passwordHash) return false;
  if (email.trim().toLowerCase() !== adminEmail) return false;
  return verifyPassword(password, passwordHash);
}

export async function createAdminSession(email: string): Promise<void> {
  const cookieStore = await cookies();
  const token = await createSessionToken(
    { role: "admin", email: email.trim().toLowerCase() },
    ADMIN_SESSION_MAX_AGE_SECONDS,
  );
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

// ---------------------------------------------------------------------------
// Core: getAdminUser()
// ---------------------------------------------------------------------------

/**
 * Verifies that the current request carries a valid admin session cookie
 * whose email still matches the current ADMIN_EMAIL env var (so rotating
 * ADMIN_EMAIL invalidates any old session immediately, without needing a
 * session-store purge).
 *
 * Suitable for API Route handlers where you need the status code.
 */
export async function getAdminUser(): Promise<AdminCheckResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const session = await verifySessionToken<AdminSessionPayload>(token);

  if (!session || session.role !== "admin") {
    return { ok: false, error: "Unauthorized", status: 401 };
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail || session.email.toLowerCase() !== adminEmail) {
    // ADMIN_EMAIL changed since the session was issued, or a stale/forged cookie.
    return { ok: false, error: "Forbidden", status: 403 };
  }

  return {
    ok: true,
    userId: adminEmail,
    email: adminEmail,
    accessLevel: "SUPER_ADMIN",
    adminUserId: adminEmail,
    source: "env_fallback",
  };
}

// ---------------------------------------------------------------------------
// requireAdmin() — throws on failure (for Server Actions + layouts)
// ---------------------------------------------------------------------------

export async function requireAdmin(): Promise<{
  userId: string;
  email: string;
  accessLevel: AdminAccessLevel;
  adminUserId: string;
  source: "database" | "env_fallback";
}> {
  const result = await getAdminUser();
  if (!result.ok) {
    throw new Error(result.error);
  }
  return {
    userId: result.userId,
    email: result.email,
    accessLevel: result.accessLevel,
    adminUserId: result.adminUserId,
    source: result.source,
  };
}

// ---------------------------------------------------------------------------
// requireAccessLevel() — kept for API compatibility; always passes once
// authenticated, since the single hardcoded admin is always SUPER_ADMIN.
// ---------------------------------------------------------------------------

export async function requireAccessLevel(
  required: AdminAccessLevel,
): Promise<{
  userId: string;
  email: string;
  accessLevel: AdminAccessLevel;
  adminUserId: string;
  source: "database" | "env_fallback";
}> {
  const result = await getAdminUser();
  if (!result.ok) {
    throw new Error(result.error);
  }
  if (!hasPermission(result.accessLevel, required)) {
    throw new Error(`Forbidden: requires ${required} or above`);
  }
  return {
    userId: result.userId,
    email: result.email,
    accessLevel: result.accessLevel,
    adminUserId: result.adminUserId,
    source: result.source,
  };
}
