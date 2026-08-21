"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { clientConfig } from "@/lib/client-config";

export async function revokeBrokerConnection(subscriberId: string) {
  if (!clientConfig.dhanConnectEnabled) {
    return { success: false, error: "Broker connect isn't available on this platform." };
  }

  await requireAdmin();

  await prisma.brokerConnection.updateMany({
    where: { subscriberId },
    data: { status: "REVOKED", lastError: "Force-revoked by admin." },
  });

  revalidatePath("/admin/broker-sessions");

  return { success: true };
}
