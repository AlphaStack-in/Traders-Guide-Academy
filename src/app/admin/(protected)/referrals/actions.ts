"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { denyUnlessAccess } from "@/lib/admin-auth";

export async function deleteReferral(id: string) {
  const denied = await denyUnlessAccess("SUPPORT");
  if (denied) return denied;

  await prisma.referral.delete({ where: { id } });

  revalidatePath("/admin/referrals");

  return { success: true };
}
