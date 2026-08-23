"use server";

import { verifyAdminCredentials, createAdminSession } from "@/lib/admin-rbac";

export async function loginAdmin(
  email: string,
  password: string,
): Promise<{ success: boolean; error?: string }> {
  if (!email || !password) {
    return { success: false, error: "Email and password are required." };
  }

  if (!verifyAdminCredentials(email, password)) {
    return { success: false, error: "Invalid email or password." };
  }

  await createAdminSession(email);
  return { success: true };
}
