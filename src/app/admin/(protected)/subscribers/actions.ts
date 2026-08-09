"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { clientConfig } from "@/lib/client-config";
import { sendReferralInviteEmail } from "@/lib/email";

async function requireAdmin() {
  if (!clientConfig.requireAdminAuth) return;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    throw new Error("Not authenticated");
  }
}

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
  const email = input.email?.trim() || null;
  const currentBroker = input.currentBroker?.trim() || null;

  if (!name || !phone) {
    return { success: false, error: "Name and phone are required." };
  }

  await prisma.subscriber.create({
    data: { name, phone, email, batchNumber: input.batchNumber, currentBroker },
  });

  revalidatePath("/admin/subscribers");

  return { success: true };
}

export async function updateSubscriber(id: string, input: SubscriberInput) {
  await requireAdmin();

  const name = input.name.trim();
  const phone = input.phone.trim();
  const email = input.email?.trim() || null;
  const currentBroker = input.currentBroker?.trim() || null;

  if (!name || !phone) {
    return { success: false, error: "Name and phone are required." };
  }

  await prisma.subscriber.update({
    where: { id },
    data: { name, phone, email, batchNumber: input.batchNumber, currentBroker },
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

