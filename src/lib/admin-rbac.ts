/**
 * Centralized server-side admin authentication + authorization.
 *
 * Three kinds of admin identity:
 *
 *   1. Owner — the primary admin, defined by the ADMIN_EMAIL /
 *      ADMIN_PASSWORD_HASH env vars. Always SUPER_ADMIN. Can sign in with
 *      password or Google. Can't be edited or removed from the UI, so the
 *      site can never be locked out of its own admin area.
 *   2. Env extras — ADDITIONAL_ADMIN_EMAILS (optional, comma-separated).
 *      SUPER_ADMIN, Google sign-in only. Kept for backward compatibility;
 *      prefer adding staff on /admin/admins instead.
 *   3. Staff — rows in the AdminUser table, managed on /admin/admins by any
 *      SUPER_ADMIN. Each has its own role (VIEWER → SUPER_ADMIN, see
 *      src/lib/admin-roles.ts), an optional password (null = Google only),
 *      and an isActive flag. Deactivating a row revokes access on the
 *      admin's very next request.
 *
 * Session mechanism: an HMAC-signed, httpOnly cookie holding the admin's
 * email (see src/lib/session-cookie.ts). Every check re-resolves that email
 * to a live identity + role, so role changes and removals apply immediately.
 *
 * Usage:
 * ---------------------------------------------------------------------------
 * Server Actions returning { success, error }:
 *   const denied = await denyUnlessAccess("SIGNAL_MANAGER");
 *   if (denied) return denied;
 *
 * Server Actions / layouts that should throw:
 *   const admin = await requireAdmin();                    // any admin
 *   const admin = await requireAccessLevel("ADMIN");       // ADMIN or above
 *
 * API Route handlers:
 *   const result = await getAdminUser();
 *   if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
 */

import { cookies } from "next/headers";
import type { AdminAccessLevel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createSessionToken, verifySessionToken } from "@/lib/session-cookie";
import { verifyPassword } from "@/lib/password";
import { ACCESS_LEVEL_LABELS, hasPermission } from "@/lib/admin-roles";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-session-cookie";

export { ADMIN_SESSION_COOKIE } from "@/lib/admin-session-cookie";
export { hasPermission } from "@/lib/admin-roles";

const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

interface AdminSessionPayload {
  role: "admin";
  email: string;
  exp: number;
}

export type AdminKind = "owner" | "env" | "staff";

export interface AdminIdentity {
  email: string;
  name: string | null;
  accessLevel: AdminAccessLevel;
  kind: AdminKind;
  /** AdminUser.id for staff admins, null for owner / env admins. */
  staffId: string | null;
}

export type AdminCheckResult =
  | {
      ok: true;
      userId: string;
      email: string;
      name: string | null;
      accessLevel: AdminAccessLevel;
      kind: AdminKind;
      /** AdminUser.id for staff admins; the email for owner / env admins. */
      adminUserId: string;
      staffId: string | null;
      source: "database" | "env_fallback";
    }
  | { ok: false; error: string; status: 401 | 403 };

export type AuthorizedAdmin = Extract<AdminCheckResult, { ok: true }>;

function normalize(email: string): string {
  return email.trim().toLowerCase();
}

// ---------------------------------------------------------------------------
// Env-defined admins
// ---------------------------------------------------------------------------

export function getOwnerAdminEmail(): string | null {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return email || null;
}

/** ADDITIONAL_ADMIN_EMAILS, lowercased, de-duplicated, excluding the owner. */
export function getEnvExtraAdminEmails(): string[] {
  const owner = getOwnerAdminEmail();
  const extra = (process.env.ADDITIONAL_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => normalize(e))
    .filter((e) => e && e !== owner);
  return Array.from(new Set(extra));
}

/** Emails that are admins by env var (owner + ADDITIONAL_ADMIN_EMAILS). */
export function getEnvAdminEmails(): string[] {
  const owner = getOwnerAdminEmail();
  return [...(owner ? [owner] : []), ...getEnvExtraAdminEmails()];
}

// ---------------------------------------------------------------------------
// Identity resolution
// ---------------------------------------------------------------------------

/**
 * Resolves an email to a live admin identity, or null if it isn't (or is no
 * longer) an admin. Env identities are checked first, without touching the
 * database, so the owner can always get in even if the DB is unreachable.
 */
export async function resolveAdminIdentity(rawEmail: string): Promise<AdminIdentity | null> {
  const email = normalize(rawEmail);
  if (!email) return null;

  if (email === getOwnerAdminEmail()) {
    return { email, name: null, accessLevel: "SUPER_ADMIN", kind: "owner", staffId: null };
  }
  if (getEnvExtraAdminEmails().includes(email)) {
    return { email, name: null, accessLevel: "SUPER_ADMIN", kind: "env", staffId: null };
  }

  try {
    const staff = await prisma.adminUser.findUnique({ where: { email } });
    if (!staff || !staff.isActive) return null;
    return {
      email,
      name: staff.name,
      accessLevel: staff.accessLevel,
      kind: "staff",
      staffId: staff.id,
    };
  } catch (err) {
    console.error("resolveAdminIdentity: AdminUser lookup failed:", err);
    return null;
  }
}

export async function isAdminEmail(email: string): Promise<boolean> {
  return (await resolveAdminIdentity(email)) !== null;
}

// ---------------------------------------------------------------------------
// Credential verification + session issuance
// ---------------------------------------------------------------------------

/**
 * Checks a submitted email/password. The owner is checked against
 * ADMIN_PASSWORD_HASH; staff admins against AdminUser.passwordHash (null =
 * Google sign-in only). ADDITIONAL_ADMIN_EMAILS admins have no password.
 */
export async function verifyAdminCredentials(rawEmail: string, password: string): Promise<boolean> {
  const email = normalize(rawEmail);
  if (!email || !password) return false;

  const owner = getOwnerAdminEmail();
  if (email === owner) {
    return verifyPassword(password, process.env.ADMIN_PASSWORD_HASH);
  }
  if (getEnvExtraAdminEmails().includes(email)) return false;

  try {
    const staff = await prisma.adminUser.findUnique({ where: { email } });
    if (!staff || !staff.isActive) return false;
    return verifyPassword(password, staff.passwordHash);
  } catch (err) {
    console.error("verifyAdminCredentials: AdminUser lookup failed:", err);
    return false;
  }
}

export async function createAdminSession(rawEmail: string): Promise<void> {
  const email = normalize(rawEmail);
  const cookieStore = await cookies();
  const token = await createSessionToken({ role: "admin", email }, ADMIN_SESSION_MAX_AGE_SECONDS);
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  });

  // Best-effort "last login" stamp for staff admins (shown on /admin/admins).
  if (!getEnvAdminEmails().includes(email)) {
    await prisma.adminUser
      .update({ where: { email }, data: { lastLoginAt: new Date() } })
      .catch(() => undefined);
  }
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

// ---------------------------------------------------------------------------
// Core: getAdminUser()
// ---------------------------------------------------------------------------

/**
 * Verifies the current request's admin session cookie and re-resolves its
 * email to a live identity, so a removed / deactivated admin (or one whose
 * env var entry was deleted) is rejected on the very next request.
 */
export async function getAdminUser(): Promise<AdminCheckResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const session = await verifySessionToken<AdminSessionPayload>(token);

  if (!session || session.role !== "admin" || typeof session.email !== "string") {
    return { ok: false, error: "Unauthorized", status: 401 };
  }

  const identity = await resolveAdminIdentity(session.email);
  if (!identity) {
    return { ok: false, error: "Forbidden", status: 403 };
  }

  return {
    ok: true,
    userId: identity.email,
    email: identity.email,
    name: identity.name,
    accessLevel: identity.accessLevel,
    kind: identity.kind,
    adminUserId: identity.staffId ?? identity.email,
    staffId: identity.staffId,
    source: identity.kind === "staff" ? "database" : "env_fallback",
  };
}

function permissionError(actual: AdminAccessLevel, required: AdminAccessLevel): string {
  return `Your role (${ACCESS_LEVEL_LABELS[actual]}) can't do this — it needs ${ACCESS_LEVEL_LABELS[required]} or above.`;
}

// ---------------------------------------------------------------------------
// Non-throwing check — for Server Actions that return { success, error }
// ---------------------------------------------------------------------------

export async function checkAccessLevel(
  required: AdminAccessLevel,
): Promise<{ ok: true; admin: AuthorizedAdmin } | { ok: false; error: string }> {
  const result = await getAdminUser();
  if (!result.ok) {
    return { ok: false, error: "Your admin session has expired. Please sign in again." };
  }
  if (!hasPermission(result.accessLevel, required)) {
    return { ok: false, error: permissionError(result.accessLevel, required) };
  }
  return { ok: true, admin: result };
}

/**
 * Returns null when the current admin has `required` or above, otherwise a
 * ready-to-return `{ success: false, error }` result.
 */
export async function denyUnlessAccess(
  required: AdminAccessLevel,
): Promise<{ success: false; error: string } | null> {
  const check = await checkAccessLevel(required);
  return check.ok ? null : { success: false, error: check.error };
}

// ---------------------------------------------------------------------------
// Throwing checks — for layouts / Server Actions without a result shape
// ---------------------------------------------------------------------------

export async function requireAdmin(): Promise<AuthorizedAdmin> {
  const result = await getAdminUser();
  if (!result.ok) {
    throw new Error(result.error);
  }
  return result;
}

export async function requireAccessLevel(required: AdminAccessLevel): Promise<AuthorizedAdmin> {
  const admin = await requireAdmin();
  if (!hasPermission(admin.accessLevel, required)) {
    throw new Error(permissionError(admin.accessLevel, required));
  }
  return admin;
}
