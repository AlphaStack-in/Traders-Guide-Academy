"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSubscriber } from "@/lib/subscriber-auth";

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
