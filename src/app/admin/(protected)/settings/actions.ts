"use server";

import { revalidatePath } from "next/cache";
import { checkAccessLevel, requireAdmin, verifyAdminCredentials } from "@/lib/admin-rbac";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword, MIN_PASSWORD_LENGTH } from "@/lib/password";
import {
  updateAppSettings,
  type ActiveBroker,
  type AppSettingsData,
} from "@/lib/app-settings";

export async function saveAppSettings(
  partial: Partial<AppSettingsData>,
): Promise<{ success: boolean; error?: string }> {
  const access = await checkAccessLevel("ADMIN");
  if (!access.ok) return { success: false, error: access.error };
  const admin = access.admin;

  // Dhan and Goodwill are mutually exclusive (see client-config.ts's old
  // comment on goodwillBrokerEnabled) — guard it here too, not just in the
  // form, since this is the actual trust boundary.
  const broker = partial.activeBroker as ActiveBroker | undefined;
  if (broker !== undefined && broker !== null && broker !== "dhan" && broker !== "goodwill") {
    return { success: false, error: "Unknown broker." };
  }

  await updateAppSettings(partial, admin.email);

  // Revalidate every page whose nav or content depends on these flags.
  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");

  return { success: true };
}

export interface GenerateAdminPasswordHashInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Changes the signed-in admin's own password.
 *
 * - Owner (ADMIN_EMAIL): its password lives in the ADMIN_PASSWORD_HASH env
 *   var, which a server action can't write. So this verifies the current
 *   password and returns a freshly generated hash (`newHash`) that the owner
 *   pastes into Vercel and redeploys — see components/admin/change-password-form.tsx.
 * - Staff admins (AdminUser rows): the new password is saved to the
 *   database immediately (`updated: true`). If they had no password yet
 *   (Google-only), the current-password field isn't required.
 * - ADDITIONAL_ADMIN_EMAILS admins have no password (Google sign-in only).
 */
export async function generateAdminPasswordHash(
  input: GenerateAdminPasswordHashInput,
): Promise<{ success: boolean; error?: string; newHash?: string; updated?: boolean }> {
  const admin = await requireAdmin();

  if (admin.kind === "env") {
    return {
      success: false,
      error: "This admin account signs in with Google only. Ask a Super Admin to add you on the Admins page if you need a password.",
    };
  }

  if (input.newPassword !== input.confirmPassword) {
    return { success: false, error: "New password and confirmation don't match." };
  }

  if (input.newPassword.length < MIN_PASSWORD_LENGTH) {
    return { success: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }

  if (admin.kind === "owner") {
    if (!(await verifyAdminCredentials(admin.email, input.currentPassword))) {
      return { success: false, error: "Current password is incorrect." };
    }
    return { success: true, newHash: hashPassword(input.newPassword) };
  }

  const staff = admin.staffId
    ? await prisma.adminUser.findUnique({ where: { id: admin.staffId } })
    : null;
  if (!staff) return { success: false, error: "Admin account not found." };

  if (staff.passwordHash && !verifyPassword(input.currentPassword, staff.passwordHash)) {
    return { success: false, error: "Current password is incorrect." };
  }

  await prisma.$transaction([
    prisma.adminUser.update({
      where: { id: staff.id },
      data: { passwordHash: hashPassword(input.newPassword) },
    }),
    prisma.adminUserAuditLog.create({
      data: {
        changedById: staff.id,
        changedByEmail: staff.email,
        targetAdminId: staff.id,
        action: "SET_PASSWORD",
        newValue: "self",
      },
    }),
  ]);

  return { success: true, updated: true };
}
