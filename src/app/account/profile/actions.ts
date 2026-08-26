"use server";

import { prisma } from "@/lib/prisma";
import { requireSubscriber } from "@/lib/subscriber-auth";

export interface UpdateProfileInput {
  name: string;
  phone: string;
  email: string;
  currentBroker?: string | null;
}

export async function updateSubscriberProfile(input: UpdateProfileInput) {
  const subscriber = await requireSubscriber();

  const name = input.name.trim();
  const phone = input.phone.trim();
  const email = input.email.trim();
  const currentBroker = input.currentBroker?.trim() || null;

  if (!name || !phone) {
    return { success: false, error: "Name and phone are required." };
  }

  if (!email || !email.includes("@")) {
    return { success: false, error: "A valid email is required — it's also your login." };
  }

  // Same duplicate-email guard as registration (src/app/register/actions.ts)
  // — Subscriber.email has no DB-level unique constraint, and login looks
  // accounts up by email, so a changed email must still be unique.
  const existingByEmail = await prisma.subscriber.findFirst({
    where: {
      email: { equals: email, mode: "insensitive" },
      id: { not: subscriber.id },
    },
  });

  if (existingByEmail) {
    return { success: false, error: "That email is already in use by another account." };
  }

  await prisma.subscriber.update({
    where: { id: subscriber.id },
    data: { name, phone, email, currentBroker },
  });

  return { success: true };
}
