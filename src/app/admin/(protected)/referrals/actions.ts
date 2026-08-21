"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function deleteReferral(id: string) {
  await requireAdmin();

  await prisma.referral.delete({ where: { id } });

  revalidatePath("/admin/referrals");

  return { success: true };
}
