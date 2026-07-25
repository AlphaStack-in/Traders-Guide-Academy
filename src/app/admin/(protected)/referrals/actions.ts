"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { clientConfig } from "@/lib/client-config";

async function requireAdmin() {
  if (!clientConfig.requireAdminAuth) return;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    throw new Error("Not authenticated");
  }
}

export async function deleteReferral(id: string) {
  await requireAdmin();

  await prisma.referral.delete({ where: { id } });

  revalidatePath("/admin/referrals");

  return { success: true };
}
