"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAccessLevel } from "@/lib/admin-rbac";
import type { AdminAccessLevel } from "@prisma/client";

// ---------------------------------------------------------------------------
// List admin users — SUPER_ADMIN only
// ---------------------------------------------------------------------------

export async function listAdminUsers() {
  await requireAccessLevel("SUPER_ADMIN");

  return prisma.adminUser.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      supabaseUserId: true,
      email: true,
      accessLevel: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

// ---------------------------------------------------------------------------
// Create admin user — SUPER_ADMIN only
// ---------------------------------------------------------------------------

export async function createAdminUser(input: {
  supabaseUserId: string;
  email: string;
  accessLevel: AdminAccessLevel;
}) {
  const actor = await requireAccessLevel("SUPER_ADMIN");

  const supabaseUserId = input.supabaseUserId.trim();
  const email = input.email.trim().toLowerCase();

  if (!supabaseUserId || !email) {
    return { success: false, error: "supabaseUserId and email are required." };
  }

  // SUPER_ADMIN cannot be created via this action — must be bootstrapped via SQL.
  if (input.accessLevel === "SUPER_ADMIN") {
    return {
      success: false,
      error: "SUPER_ADMIN accounts must be bootstrapped via the database migration script.",
    };
  }

  // Prevent duplicate
  const existing = await prisma.adminUser.findUnique({ where: { supabaseUserId } });
  if (existing) {
    return { success: false, error: "An AdminUser with that Supabase user ID already exists." };
  }

  const newUser = await prisma.adminUser.create({
    data: {
      supabaseUserId,
      email,
      accessLevel: input.accessLevel,
      isActive: true,
    },
  });

  // Audit log — note: actor.adminUserId may be "" for env_fallback admins,
  // but a SUPER_ADMIN env-fallback cannot create other admins (no DB row = no
  // changedById FK).  Guard here.
  if (actor.adminUserId) {
    await prisma.adminUserAuditLog.create({
      data: {
        changedById: actor.adminUserId,
        targetAdminId: newUser.id,
        action: "CREATE",
        previousValue: null,
        newValue: input.accessLevel,
      },
    });
  }

  revalidatePath("/admin/admin-users");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Update access level — SUPER_ADMIN only; cannot modify another SUPER_ADMIN
// ---------------------------------------------------------------------------

export async function setAdminAccessLevel(targetId: string, accessLevel: AdminAccessLevel) {
  const actor = await requireAccessLevel("SUPER_ADMIN");

  const target = await prisma.adminUser.findUnique({ where: { id: targetId } });
  if (!target) return { success: false, error: "AdminUser not found." };

  // Protect SUPER_ADMIN accounts from being demoted by another admin
  if (target.accessLevel === "SUPER_ADMIN") {
    return {
      success: false,
      error: "SUPER_ADMIN access level cannot be changed via the UI.",
    };
  }

  const previous = target.accessLevel;
  await prisma.adminUser.update({ where: { id: targetId }, data: { accessLevel } });

  if (actor.adminUserId) {
    await prisma.adminUserAuditLog.create({
      data: {
        changedById: actor.adminUserId,
        targetAdminId: targetId,
        action: "SET_ACCESS_LEVEL",
        previousValue: previous,
        newValue: accessLevel,
      },
    });
  }

  revalidatePath("/admin/admin-users");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Activate / deactivate — SUPER_ADMIN only; cannot deactivate a SUPER_ADMIN
// ---------------------------------------------------------------------------

export async function setAdminUserActive(targetId: string, isActive: boolean) {
  const actor = await requireAccessLevel("SUPER_ADMIN");

  const target = await prisma.adminUser.findUnique({ where: { id: targetId } });
  if (!target) return { success: false, error: "AdminUser not found." };

  if (target.accessLevel === "SUPER_ADMIN") {
    return {
      success: false,
      error: "Cannot deactivate a SUPER_ADMIN account via the UI.",
    };
  }

  // Prevent a SUPER_ADMIN from accidentally deactivating themselves
  // (they can only deactivate others with a lower level)
  if (actor.adminUserId && actor.adminUserId === targetId) {
    return { success: false, error: "You cannot deactivate your own account." };
  }

  await prisma.adminUser.update({ where: { id: targetId }, data: { isActive } });

  if (actor.adminUserId) {
    await prisma.adminUserAuditLog.create({
      data: {
        changedById: actor.adminUserId,
        targetAdminId: targetId,
        action: isActive ? "ACTIVATE" : "DEACTIVATE",
        previousValue: String(!isActive),
        newValue: String(isActive),
      },
    });
  }

  revalidatePath("/admin/admin-users");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Audit log — SUPER_ADMIN only
// ---------------------------------------------------------------------------

export async function getAdminAuditLog(limit = 100) {
  await requireAccessLevel("SUPER_ADMIN");

  const logs = await prisma.adminUserAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      changedBy: { select: { email: true } },
      targetAdmin: { select: { email: true } },
    },
  });

  return logs.map((l) => ({
    id: l.id,
    changedByEmail: l.changedBy.email,
    targetEmail: l.targetAdmin.email,
    action: l.action,
    previousValue: l.previousValue,
    newValue: l.newValue,
    createdAt: l.createdAt.toISOString(),
  }));
}
