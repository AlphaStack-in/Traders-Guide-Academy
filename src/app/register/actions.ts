"use server";

import { prisma } from "@/lib/prisma";
import { clientConfig } from "@/lib/client-config";

export interface RegisterInput {
  name: string;
  phone: string;
  email: string | null;
  currentBroker?: string | null;
  batchNumber?: number | null;
  invitationToken?: string | null;
}

export async function checkExistingMember(phone: string) {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length < 8) {
    return { found: false, name: null };
  }

  const subscriber = await prisma.subscriber.findFirst({
    where: { phone: { endsWith: cleaned.slice(-10) } },
    orderBy: { createdAt: "desc" },
  });

  return { found: !!subscriber, name: subscriber?.name ?? null };
}

export async function registerSubscriber(input: RegisterInput) {
  const name = input.name.trim();
  const phone = input.phone.trim();
  const email = input.email?.trim() || null;
  const currentBroker = input.currentBroker?.trim() || null;
  const batchNumber = input.batchNumber ?? clientConfig.batchInfo.batchNumber;
  const token = input.invitationToken?.trim() || null;

  if (!name || !phone) {
    return { success: false, error: "Name and phone are required." };
  }

  if (token) {
    const invitedSubscriber = await prisma.subscriber.findUnique({
      where: { invitationToken: token },
    });

    if (invitedSubscriber) {
      await prisma.subscriber.update({
        where: { id: invitedSubscriber.id },
        data: {
          name,
          phone,
          email: email || invitedSubscriber.email,
          currentBroker: currentBroker || invitedSubscriber.currentBroker,
          batchNumber: batchNumber || invitedSubscriber.batchNumber,
          referralStatus: "JOINED",
          invitationToken: null,
        },
      });
      return { success: true };
    }
  }

  // Standard registration without valid referral token defaults to NOT_JOINED
  await prisma.subscriber.create({
    data: {
      name,
      phone,
      email,
      currentBroker,
      batchNumber,
      referralStatus: "NOT_JOINED",
    },
  });

  return { success: true };
}
