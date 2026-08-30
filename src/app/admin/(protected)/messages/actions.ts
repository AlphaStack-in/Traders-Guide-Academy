"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { sendContactReplyEmail } from "@/lib/email";

export async function replyToMessage(id: string, replyText: string) {
  await requireAdmin();

  const reply = replyText.trim();
  if (!reply) {
    return { success: false, error: "Reply cannot be empty." };
  }

  const existing = await prisma.contactMessage.findUnique({ where: { id } });
  if (!existing) {
    return { success: false, error: "Message not found." };
  }

  // Only actually email the submitter when they left an email address --
  // the public contact form only requires phone, so this is frequently
  // absent and the admin must fall back to WhatsApp/call instead.
  let emailed = false;
  if (existing.email) {
    const result = await sendContactReplyEmail({
      toEmail: existing.email,
      memberName: existing.name,
      originalMessage: existing.message,
      replyText: reply,
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error ?? "Failed to send the reply email. Nothing was saved.",
      };
    }
    emailed = true;
  }

  await prisma.contactMessage.update({
    where: { id },
    data: { replyText: reply, status: "REPLIED", repliedAt: new Date() },
  });

  revalidatePath("/admin/messages");

  return { success: true, emailed };
}

export async function deleteMessage(id: string) {
  await requireAdmin();

  await prisma.contactMessage.delete({ where: { id } });

  revalidatePath("/admin/messages");

  return { success: true };
}
