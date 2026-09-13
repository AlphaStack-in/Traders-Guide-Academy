"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSubscriber } from "@/lib/subscriber-auth";
import { hashPassword, verifyPassword, MIN_PASSWORD_LENGTH } from "@/lib/password";

export interface SubscriberPreferences {
  emailDigestOptOut: boolean;
  notificationsEnabled: boolean;
}

export async function getSubscriberPreferences(): Promise<SubscriberPreferences> {
  const subscriber = await requireSubscriber();
  const row = await prisma.subscriber.findUniqueOrThrow({
    where: { id: subscriber.id },
    select: { emailDigestOptOut: true, notificationsEnabled: true },
  });
  return row;
}

export async function updateSubscriberPreferences(
  partial: Partial<SubscriberPreferences>,
): Promise<{ success: boolean; error?: string }> {
  const subscriber = await requireSubscriber();

  await prisma.subscriber.update({
    where: { id: subscriber.id },
    data: partial,
  });

  revalidatePath("/account/settings");

  return { success: true };
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Changes (or, for a Google-only subscriber with no passwordHash yet, sets)
 * the subscriber's own login password. Does not touch the current session
 * cookie — the subscriber stays logged in after this succeeds.
 */
export async function changeSubscriberPassword(
  input: ChangePasswordInput,
): Promise<{ success: boolean; error?: string }> {
  const subscriber = await requireSubscriber();

  if (input.newPassword !== input.confirmPassword) {
    return { success: false, error: "New password and confirmation don't match." };
  }

  if (input.newPassword.length < MIN_PASSWORD_LENGTH) {
    return { success: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }

  // Subscribers who registered normally always have a passwordHash. A
  // subscriber who only ever signed in via Google (see src/lib/google-oauth.ts)
  // may have none yet — in that case this is "set a password", not "change",
  // so there's no current password to verify.
  if (subscriber.passwordHash) {
    if (!input.currentPassword || !verifyPassword(input.currentPassword, subscriber.passwordHash)) {
      return { success: false, error: "Current password is incorrect." };
    }
  }

  const passwordHash = hashPassword(input.newPassword);
  await prisma.subscriber.update({
    where: { id: subscriber.id },
    data: { passwordHash },
  });

  revalidatePath("/account/settings");

  return { success: true };
}
