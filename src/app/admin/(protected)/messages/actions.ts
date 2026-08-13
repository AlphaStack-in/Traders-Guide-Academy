"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

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
