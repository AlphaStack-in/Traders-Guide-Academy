"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { verifyAdminCredentials } from "@/lib/admin-rbac";
import { hashPassword, MIN_PASSWORD_LENGTH } from "@/lib/password";
import {
  updateAppSettings,
  type ActiveBroker,
  type AppSettingsData,
} from "@/lib/app-settings";

export async function saveAppSettings(
  partial: Partial<AppSettingsData>,
): Promise<{ success: boolean; error?: string }> {
  const admin = await requireAdmin();

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
 * TGA's admin account has no DB row — its credentials are ADMIN_EMAIL /
 * ADMIN_PASSWORD_HASH env vars (see src/lib/admin-rbac.ts), which this
 * server action cannot write to. So this does NOT change the live password:
 * it verifies the current one and returns a freshly generated hash for the
 * new one. The admin still has to paste that value into
 * ADMIN_PASSWORD_HASH in Vercel (and locally in .env) and redeploy — see
 * the UI copy in components/admin/change-password-form.tsx.
 */
export async function generateAdminPasswordHash(
  input: GenerateAdminPasswordHashInput,
): Promise<{ success: boolean; error?: string; newHash?: string }> {
  const admin = await requireAdmin();

  if (admin.email !== process.env.ADMIN_EMAIL?.trim().toLowerCase()) {
    return {
      success: false,
      error: "Only the primary admin has a password. Additional admins sign in with Google.",
    };
  }

  if (input.newPassword !== input.confirmPassword) {
    return { success: false, error: "New password and confirmation don't match." };
  }

  if (input.newPassword.length < MIN_PASSWORD_LENGTH) {
    return { success: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }

  if (!verifyAdminCredentials(admin.email, input.currentPassword)) {
    return { success: false, error: "Current password is incorrect." };
  }

  const newHash = hashPassword(input.newPassword);
  return { success: true, newHash };
}
