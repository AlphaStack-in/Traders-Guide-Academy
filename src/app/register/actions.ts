"use server";

import { prisma } from "@/lib/prisma";
import { clientConfig } from "@/lib/client-config";

export interface RegisterInput {
  name: string;
  phone: string;
  email: string | null;
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

  if (!name || !phone) {
    return { success: false, error: "Name and phone are required." };
  }

  // TODO(payments): once a paid tier exists, hook Razorpay/Stripe checkout in
  // here before persisting the subscriber as PREMIUM.
  await prisma.subscriber.create({
    data: { name, phone, email, batchNumber: clientConfig.batchInfo.batchNumber },
  });

  return { success: true };
}
