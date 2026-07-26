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

export async function replyToMessage(id: string, replyText: string) {
  await requireAdmin();

  const reply = replyText.trim();
  if (!reply) {
    return { success: false, error: "Reply cannot be empty." };
  }

  await prisma.contactMessage.update({
    where: { id },
    data: { replyText: reply, status: "REPLIED", repliedAt: new Date() },
  });

  revalidatePath("/admin/messages");

  return { success: true };
}

export async function deleteMessage(id: string) {
  await requireAdmin();

  await prisma.contactMessage.delete({ where: { id } });

  revalidatePath("/admin/messages");

  return { success: true };
}
