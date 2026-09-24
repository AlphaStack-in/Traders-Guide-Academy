"use server";

import { revalidatePath } from "next/cache";
import type { AdminAccessLevel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { checkAccessLevel, getEnvAdminEmails, type AuthorizedAdmin } from "@/lib/admin-rbac";
import { isAdminAccessLevel } from "@/lib/admin-roles";
import { hashPassword, MIN_PASSWORD_LENGTH } from "@/lib/password";
import { normalizeEmail } from "@/lib/utils";

/**
 * Staff admin management for /admin/admins. Every action requires
 * SUPER_ADMIN. The owner admin (ADMIN_EMAIL) and ADDITIONAL_ADMIN_EMAILS
 * admins are env-var defined and can't be changed here. An admin can't
 * change their own role or deactivate themselves (prevents self-lockout).
 */

type Result = { success: true } | { success: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function requireSuperAdmin(): Promise<
  { ok: true; admin: AuthorizedAdmin } | { ok: false; result: Result }
> {
  const access = await checkAccessLevel("SUPER_ADMIN");
  if (!access.ok) return { ok: false, result: { success: false, error: access.error } };
  return { ok: true, admin: access.admin };
}

function actor(admin: AuthorizedAdmin) {
  return { changedById: admin.staffId, changedByEmail: admin.email };
}

function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}

export interface CreateStaffAdminInput {
  email: string;
  name?: string | null;
  accessLevel: AdminAccessLevel;
  /** Optional. Leave blank for a Google-sign-in-only admin. */
  password?: string | null;
}

export async function createStaffAdmin(input: CreateStaffAdminInput): Promise<Result> {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return auth.result;

  const email = normalizeEmail(input.email);
  const name = input.name?.trim() || null;
  const password = input.password?.trim() ? input.password : null;

  if (!EMAIL_RE.test(email)) return { success: false, error: "Enter a valid email address." };
  if (!isAdminAccessLevel(input.accessLevel)) return { success: false, error: "Pick a role." };
  if (getEnvAdminEmails().includes(email)) {
    return {
      success: false,
      error: "That email is already an admin via an environment variable (ADMIN_EMAIL / ADDITIONAL_ADMIN_EMAILS).",
    };
  }
  if (password) {
    const err = validatePassword(password);
    if (err) return { success: false, error: err };
  }

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    return {
      success: false,
      error: existing.isActive
        ? "That email is already an admin."
        : "That email is already in the list (removed). Use Restore on its row instead.",
    };
  }

  await prisma.$transaction(async (tx) => {
    const created = await tx.adminUser.create({
      data: {
        email,
        name,
        accessLevel: input.accessLevel,
        passwordHash: password ? hashPassword(password) : null,
        isActive: true,
      },
    });
    await tx.adminUserAuditLog.create({
      data: {
        ...actor(auth.admin),
        targetAdminId: created.id,
        action: "CREATE",
        newValue: input.accessLevel,
      },
    });
  });

  revalidatePath("/admin/admins");
  return { success: true };
}

export async function updateStaffAdmin(
  id: string,
  input: { name?: string | null; accessLevel?: AdminAccessLevel },
): Promise<Result> {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return auth.result;

  const target = await prisma.adminUser.findUnique({ where: { id } });
  if (!target) return { success: false, error: "Admin not found." };

  const logs: { action: string; previousValue: string | null; newValue: string | null }[] = [];
  const data: { name?: string | null; accessLevel?: AdminAccessLevel } = {};

  if (input.accessLevel !== undefined && input.accessLevel !== target.accessLevel) {
    if (!isAdminAccessLevel(input.accessLevel)) return { success: false, error: "Pick a role." };
    if (auth.admin.staffId === id) {
      return { success: false, error: "You can't change your own role. Ask another Super Admin." };
    }
    data.accessLevel = input.accessLevel;
    logs.push({ action: "SET_ACCESS_LEVEL", previousValue: target.accessLevel, newValue: input.accessLevel });
  }

  if (input.name !== undefined) {
    const name = input.name?.trim() || null;
    if (name !== target.name) {
      data.name = name;
      logs.push({ action: "UPDATE_NAME", previousValue: target.name, newValue: name });
    }
  }

  if (logs.length === 0) return { success: true };

  await prisma.$transaction([
    prisma.adminUser.update({ where: { id }, data }),
    ...logs.map((log) =>
      prisma.adminUserAuditLog.create({ data: { ...actor(auth.admin), targetAdminId: id, ...log } }),
    ),
  ]);

  revalidatePath("/admin/admins");
  return { success: true };
}

/** Remove (isActive=false) or restore (isActive=true) an admin's access. */
export async function setStaffAdminActive(id: string, isActive: boolean): Promise<Result> {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return auth.result;

  if (auth.admin.staffId === id && !isActive) {
    return { success: false, error: "You can't remove your own access." };
  }

  const target = await prisma.adminUser.findUnique({ where: { id } });
  if (!target) return { success: false, error: "Admin not found." };
  if (target.isActive === isActive) return { success: true };

  await prisma.$transaction([
    prisma.adminUser.update({ where: { id }, data: { isActive } }),
    prisma.adminUserAuditLog.create({
      data: {
        ...actor(auth.admin),
        targetAdminId: id,
        action: isActive ? "ACTIVATE" : "DEACTIVATE",
        previousValue: String(target.isActive),
        newValue: String(isActive),
      },
    }),
  ]);

  revalidatePath("/admin/admins");
  return { success: true };
}

/** Set a new password for an admin, or pass null to make them Google-only. */
export async function setStaffAdminPassword(id: string, password: string | null): Promise<Result> {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return auth.result;

  if (password !== null) {
    const err = validatePassword(password);
    if (err) return { success: false, error: err };
  }

  const target = await prisma.adminUser.findUnique({ where: { id } });
  if (!target) return { success: false, error: "Admin not found." };

  await prisma.$transaction([
    prisma.adminUser.update({
      where: { id },
      data: { passwordHash: password === null ? null : hashPassword(password) },
    }),
    prisma.adminUserAuditLog.create({
      data: {
        ...actor(auth.admin),
        targetAdminId: id,
        action: "SET_PASSWORD",
        newValue: password === null ? "removed (Google only)" : "reset",
      },
    }),
  ]);

  revalidatePath("/admin/admins");
  return { success: true };
}
