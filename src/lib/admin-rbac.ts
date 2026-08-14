/**
 * Centralized server-side admin authorization — RBAC edition.
 *
 * Authorization mechanism:
 * ---------------------------------------------------------------------------
 * Admins are identified by their Supabase Auth user.id (supabaseUserId) —
 * a stable UUID that does not change even if the user's email changes.
 *
 * Onboarding uses email only as a temporary binding key: SUPER_ADMIN creates
 * an AdminUser with email + accessLevel and supabaseUserId = null.  On the
 * user's first successful Google login, getAdminUser() binds supabaseUserId
 * to the authenticated Auth user.id.  After binding, authorization is
 * UUID-based — email is never the permanent auth identity.
 *
 * Authorization decisions are made by joining the Supabase session to the
 * AdminUser table in our Prisma database.  NEVER trust user_metadata or
 * app_metadata for security-sensitive authorization — Supabase explicitly
 * warns that user_metadata is user-editable.
 *
 * Fail-closed behavior:
 * ---------------------------------------------------------------------------
 * - No Supabase session → denied (401)
 * - Supabase session but no AdminUser row → denied (403)
 * - AdminUser.isActive === false → denied (403)
 * - Email match but supabaseUserId already bound to a different Auth id → 403
 * - Access level too low → denied (403)
 *
 * Backward compatibility:
 * ---------------------------------------------------------------------------
 * ADMIN_EMAILS is still checked as a fallback during migration.  Once all
 * admins have an AdminUser row in the database, ADMIN_EMAILS can be removed.
 * The database check always takes priority when an AdminUser row exists.
 *
 * Access level hierarchy (ascending privileges):
 *   VIEWER < SUPPORT < SIGNAL_MANAGER < ADMIN < SUPER_ADMIN
 *
 * Usage:
 * ---------------------------------------------------------------------------
 * In Server Actions (throw on failure):
 *   const admin = await requireAdmin();
 *   const admin = await requireAccessLevel("SIGNAL_MANAGER");
 *
 * In API Route handlers (return status code):
 *   const result = await getAdminUser();
 *   if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
 *
 * Check specific permission:
 *   if (!hasPermission(admin.accessLevel, "SIGNAL_MANAGER")) { ... }
 */

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AdminAccessLevel } from "@prisma/client";

// ---------------------------------------------------------------------------
// Access level ordering — higher index = higher privilege
// ---------------------------------------------------------------------------

const ACCESS_LEVEL_ORDER: AdminAccessLevel[] = [
  "VIEWER",
  "SUPPORT",
  "SIGNAL_MANAGER",
  "ADMIN",
  "SUPER_ADMIN",
];

/**
 * Returns true iff `actual` meets or exceeds the `required` access level.
 */
export function hasPermission(
  actual: AdminAccessLevel,
  required: AdminAccessLevel,
): boolean {
  return ACCESS_LEVEL_ORDER.indexOf(actual) >= ACCESS_LEVEL_ORDER.indexOf(required);
}

// ---------------------------------------------------------------------------
// ADMIN_EMAILS fallback (migration bridge)
// ---------------------------------------------------------------------------

/**
 * Returns the normalized set of admin emails from ADMIN_EMAILS env var.
 * Used only as a fallback when no AdminUser row exists for a given user.
 * Falls closed if ADMIN_EMAILS is not set.
 */
function getFallbackAdminEmailSet(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? "";
  if (!raw.trim()) return new Set();
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type AdminCheckResult =
  | {
      ok: true;
      userId: string; // Supabase Auth user.id
      email: string;
      accessLevel: AdminAccessLevel;
      adminUserId: string; // AdminUser.id (DB primary key)
      source: "database" | "env_fallback";
    }
  | { ok: false; error: string; status: 401 | 403 };

// ---------------------------------------------------------------------------
// Core: getAdminUser()
// ---------------------------------------------------------------------------

/**
 * Verifies that the current request comes from an authenticated, authorized
 * admin user.
 *
 * Resolution order:
 *  1. Get Supabase Auth user (authentication)
 *  2. Look up AdminUser by supabaseUserId (primary authorization)
 *  3. If no UUID match: look up active AdminUser by normalized email
 *     - supabaseUserId null → bind to authenticated user.id, then authorize
 *     - supabaseUserId already set to a different Auth id → deny
 *     - supabaseUserId already equals this Auth id → authorize
 *  4. If no AdminUser row: check ADMIN_EMAILS fallback for migration bridge
 *     (treated as ADMIN access level — still fail-closed if unset)
 *  5. Check isActive flag (on database rows)
 *
 * Suitable for API Route handlers where you need the status code.
 */
export async function getAdminUser(): Promise<AdminCheckResult> {
  // 1. Authenticate via Supabase
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { ok: false, error: "Unauthorized", status: 401 };
  }

  const normalizedEmail = user.email.trim().toLowerCase();

  // 2. Primary authorization — look up AdminUser row by supabaseUserId
  const adminUser = await prisma.adminUser.findUnique({
    where: { supabaseUserId: user.id },
  });

  if (adminUser) {
    if (!adminUser.isActive) {
      return { ok: false, error: "Forbidden: account deactivated", status: 403 };
    }
    return {
      ok: true,
      userId: user.id,
      email: adminUser.email,
      accessLevel: adminUser.accessLevel,
      adminUserId: adminUser.id,
      source: "database",
    };
  }

  // 3. Email onboarding bind — pending AdminUser (supabaseUserId still null)
  const pendingOrMismatched = await prisma.adminUser.findUnique({
    where: { email: normalizedEmail },
  });

  if (pendingOrMismatched) {
    if (!pendingOrMismatched.isActive) {
      return { ok: false, error: "Forbidden: account deactivated", status: 403 };
    }

    if (pendingOrMismatched.supabaseUserId == null) {
      // First successful login: bind permanent Auth UUID, then authorize by UUID path.
      // updateMany + null guard so a concurrent bind cannot overwrite an existing UUID.
      try {
        const bindResult = await prisma.adminUser.updateMany({
          where: {
            id: pendingOrMismatched.id,
            supabaseUserId: null,
            isActive: true,
          },
          data: { supabaseUserId: user.id },
        });

        if (bindResult.count === 1) {
          return {
            ok: true,
            userId: user.id,
            email: pendingOrMismatched.email,
            accessLevel: pendingOrMismatched.accessLevel,
            adminUserId: pendingOrMismatched.id,
            source: "database",
          };
        }

        // Lost race — another request may have bound this row; re-check by UUID
        const raced = await prisma.adminUser.findUnique({
          where: { supabaseUserId: user.id },
        });
        if (raced && raced.isActive) {
          return {
            ok: true,
            userId: user.id,
            email: raced.email,
            accessLevel: raced.accessLevel,
            adminUserId: raced.id,
            source: "database",
          };
        }
        return {
          ok: false,
          error: "Forbidden: admin identity conflict",
          status: 403,
        };
      } catch {
        // Unique conflict on supabaseUserId (Auth id already linked elsewhere)
        return {
          ok: false,
          error: "Forbidden: admin identity conflict",
          status: 403,
        };
      }
    }

    // Email matches but UUID is already bound to a different Auth user
    if (pendingOrMismatched.supabaseUserId !== user.id) {
      return {
        ok: false,
        error: "Forbidden: admin identity conflict",
        status: 403,
      };
    }

    // Same UUID (should normally have been found in step 2)
    return {
      ok: true,
      userId: user.id,
      email: pendingOrMismatched.email,
      accessLevel: pendingOrMismatched.accessLevel,
      adminUserId: pendingOrMismatched.id,
      source: "database",
    };
  }

  // 4. Migration fallback — ADMIN_EMAILS env var
  const fallbackEmails = getFallbackAdminEmailSet();
  if (fallbackEmails.size > 0 && fallbackEmails.has(normalizedEmail)) {
    // Treat env-fallback admins as ADMIN level (not SUPER_ADMIN)
    return {
      ok: true,
      userId: user.id,
      email: user.email,
      accessLevel: "ADMIN" as AdminAccessLevel,
      adminUserId: "", // no DB row yet
      source: "env_fallback",
    };
  }

  return { ok: false, error: "Forbidden", status: 403 };
}

// ---------------------------------------------------------------------------
// requireAdmin() — throws on failure (for Server Actions + layouts)
// ---------------------------------------------------------------------------

/**
 * Throws if the current caller is not an authenticated, authorized admin.
 * Grants any access level (minimum VIEWER).
 *
 * Suitable for Server Actions and Server Component layouts/pages.
 */
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
// requireAccessLevel() — access-level-gated version of requireAdmin()
// ---------------------------------------------------------------------------

/**
 * Throws if the caller is not authenticated, authorized, and at or above
 * the required access level.
 *
 * Usage:
 *   await requireAccessLevel("SIGNAL_MANAGER"); // SIGNAL_MANAGER, ADMIN, SUPER_ADMIN pass
 *   await requireAccessLevel("SUPER_ADMIN");    // only SUPER_ADMIN passes
 */
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
