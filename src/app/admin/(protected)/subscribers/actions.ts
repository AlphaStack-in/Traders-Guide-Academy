"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { sendAnnouncementEmail, sendReferralInviteEmail } from "@/lib/email";
import { hashPassword } from "@/lib/password";
import { normalizeEmail } from "@/lib/utils";

export interface SubscriberInput {
  name: string;
  phone: string;
  email: string | null;
  batchNumber: number | null;
  currentBroker?: string | null;
}

export async function createSubscriber(input: SubscriberInput) {
  await requireAdmin();

  const name = input.name.trim();
  const phone = input.phone.trim();
  const email = input.email ? normalizeEmail(input.email) : null;
  const currentBroker = input.currentBroker?.trim() || null;

  if (!name || !phone) {
    return { success: false, error: "Name and phone are required." };
  }

  // Subscriber.email is DB-unique — this app-level check gives a friendly
  // error for the common case (this path previously had no duplicate-email
  // guard at all, unlike register/profile); the create below also catches
  // P2002 in case a concurrent request races past this check.
  if (email) {
    const existingByEmail = await prisma.subscriber.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });
    if (existingByEmail) {
      return { success: false, error: "That email is already in use by another member." };
    }
  }

  try {
    await prisma.subscriber.create({
      data: { name, phone, email, batchNumber: input.batchNumber, currentBroker },
    });
  } catch (err: any) {
    if (err.code === "P2002" && err.meta?.target?.includes?.("email")) {
      return { success: false, error: "That email is already in use by another member." };
    }
    throw err;
  }

  revalidatePath("/admin/subscribers");

  return { success: true };
}

export async function updateSubscriber(id: string, input: SubscriberInput) {
  await requireAdmin();

  const name = input.name.trim();
  const phone = input.phone.trim();
  const email = input.email ? normalizeEmail(input.email) : null;
  const currentBroker = input.currentBroker?.trim() || null;

  if (!name || !phone) {
    return { success: false, error: "Name and phone are required." };
  }

  if (email) {
    const existingByEmail = await prisma.subscriber.findFirst({
      where: { email: { equals: email, mode: "insensitive" }, id: { not: id } },
    });
    if (existingByEmail) {
      return { success: false, error: "That email is already in use by another member." };
    }
  }

  try {
    await prisma.subscriber.update({
      where: { id },
      data: { name, phone, email, batchNumber: input.batchNumber, currentBroker },
    });
  } catch (err: any) {
    if (err.code === "P2002" && err.meta?.target?.includes?.("email")) {
      return { success: false, error: "That email is already in use by another member." };
    }
    throw err;
  }

  revalidatePath("/admin/subscribers");

  return { success: true };
}

/**
 * Sets (or resets) a subscriber's login password. There is currently no
 * self-service "forgot password" email flow (see src/lib/subscriber-auth.ts
 * for why) — this is how a subscriber's login gets enabled or recovered:
 * the admin sets a password here and shares it with them directly (phone/
 * WhatsApp, consistent with how batch numbers etc. are already communicated
 * for this business).
 *
 * TODO(follow-up, not yet wired into the UI): add a "Set Password" action
 * to subscribers-table.tsx's per-row menu that calls this. The action is
 * ready; only the dialog/button in that 800+ line table component is
 * missing, deliberately skipped here to avoid a rushed edit to an unfamiliar
 * file under time pressure.
 */
export async function setSubscriberPassword(id: string, newPassword: string) {
  await requireAdmin();

  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: "Password must be at least 6 characters long." };
  }

  const passwordHash = hashPassword(newPassword);
  await prisma.subscriber.update({
    where: { id },
    data: { passwordHash },
  });

  revalidatePath("/admin/subscribers");

  return { success: true };
}

export async function deleteSubscriber(id: string) {
  await requireAdmin();

  await prisma.subscriber.delete({ where: { id } });

  revalidatePath("/admin/subscribers");

  return { success: true };
}

export async function inviteSubscriber(id: string, origin?: string) {
  await requireAdmin();

  const subscriber = await prisma.subscriber.findUnique({ where: { id } });
  if (!subscriber) {
    return { success: false, error: "Member not found." };
  }

  if (!subscriber.email) {
    return { success: false, error: "Member does not have an email address." };
  }

  const token = subscriber.invitationToken || randomUUID();
  const updated = await prisma.subscriber.update({
    where: { id },
    data: {
      invitationToken: token,
      referralStatus: "INVITED",
      invitedAt: new Date(),
    },
  });

  const baseUrl = origin || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const inviteUrl = `${baseUrl}/register?ref=${token}`;

  const emailResult = await sendReferralInviteEmail({
    toEmail: updated.email!,
    memberName: updated.name,
    inviteUrl,
  });

  revalidatePath("/admin/subscribers");

  if (!emailResult.success) {
    return {
      success: false,
      error: emailResult.error || "Failed to send invitation email.",
    };
  }

  return { success: true };
}

export interface SendAnnouncementInput {
  message: string;
  subject: string;
  postInApp: boolean;
  sendEmail: boolean;
  // "all" or an explicit list of Subscriber ids. Only used for the email
  // channel -- the in-app post always goes out to every member via the
  // existing site-wide AdminUpdate broadcast (see notification-bell.tsx),
  // there is no per-subscriber targeting for that channel yet.
  subscriberIds: string[] | "all";
}

export interface SendAnnouncementResult {
  success: boolean;
  error?: string;
  inAppPosted?: boolean;
  email?: {
    attempted: number;
    sent: number;
    failed: number;
    skippedNoEmail: number;
    failedNames: string[];
  };
}

/**
 * Real send behind the admin Subscribers "Announcement" button (previously
 * just `toast.info(...)` with no actual delivery). Two independent,
 * honestly-reported channels:
 *  - In-app: one AdminUpdate row, broadcast to everyone (reuses
 *    postGeneralAdminUpdate's exact mechanism from signals/actions.ts).
 *  - Email: real Resend send to each targeted subscriber's registered
 *    email, looped sequentially so the caller gets a true sent/failed
 *    count back instead of a blind success toast.
 */
export async function sendAnnouncement(
  input: SendAnnouncementInput,
): Promise<SendAnnouncementResult> {
  await requireAdmin();

  const message = input.message.trim();
  if (!message) {
    return { success: false, error: "Message can't be empty." };
  }
  if (!input.postInApp && !input.sendEmail) {
    return { success: false, error: "Choose at least one channel to send through." };
  }

  let inAppPosted: boolean | undefined;
  if (input.postInApp) {
    await prisma.adminUpdate.create({ data: { message } });
    revalidatePath("/admin/signals");
    revalidatePath("/signals");
    inAppPosted = true;
  }

  let emailSummary: SendAnnouncementResult["email"];
  if (input.sendEmail) {
    const subject = input.subject.trim();
    if (!subject) {
      return { success: false, error: "Subject is required to send email." };
    }

    const recipients = await prisma.subscriber.findMany({
      where: input.subscriberIds === "all" ? {} : { id: { in: input.subscriberIds } },
      select: { id: true, name: true, email: true },
    });
    const withEmail = recipients.filter((r) => r.email);
    const skippedNoEmail = recipients.length - withEmail.length;

    let sent = 0;
    const failedNames: string[] = [];
    for (const r of withEmail) {
      const result = await sendAnnouncementEmail({
        toEmail: r.email!,
        memberName: r.name,
        subject,
        message,
      });
      if (result.success) {
        sent += 1;
      } else {
        failedNames.push(r.name);
      }
    }

    emailSummary = {
      attempted: withEmail.length,
      sent,
      failed: failedNames.length,
      skippedNoEmail,
      failedNames,
    };
  }

  return { success: true, inAppPosted, email: emailSummary };
}
