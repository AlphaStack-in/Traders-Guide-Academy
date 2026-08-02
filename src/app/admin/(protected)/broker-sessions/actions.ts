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
