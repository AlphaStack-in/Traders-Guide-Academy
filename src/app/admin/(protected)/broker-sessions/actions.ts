"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { denyUnlessAccess } from "@/lib/admin-auth";
import { getActiveBroker } from "@/lib/app-settings";

export async function revokeBrokerConnection(subscriberId: string) {
  const activeBroker = await getActiveBroker();
  if (activeBroker !== "dhan") {
    return { success: false, error: "Broker connect isn't available on this platform." };
  }

  const denied = await denyUnlessAccess("ADMIN");
  if (denied) return denied;

  await prisma.brokerConnection.updateMany({
    where: { subscriberId },
    data: { status: "REVOKED", lastError: "Force-revoked by admin." },
  });

  revalidatePath("/admin/broker-sessions");

  return { success: true };
}
