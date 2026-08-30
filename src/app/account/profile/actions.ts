"use server";

import { prisma } from "@/lib/prisma";
import { requireSubscriber } from "@/lib/subscriber-auth";
import { normalizeEmail } from "@/lib/utils";

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
  const email = normalizeEmail(input.email);
  const currentBroker = input.currentBroker?.trim() || null;

  if (!name || !phone) {
    return { success: false, error: "Name and phone are required." };
  }

  if (!email || !email.includes("@")) {
    return { success: false, error: "A valid email is required — it's also your login." };
  }

  // Same duplicate-email guard as registration (src/app/register/actions.ts)
  // — Subscriber.email is DB-unique, and login looks accounts up by email,
  // so a changed email must still be unique. This check returns a friendly
  // error for the common case; the update below also catches P2002 in case
  // a concurrent request races past this check.
  const existingByEmail = await prisma.subscriber.findFirst({
    where: {
      email: { equals: email, mode: "insensitive" },
      id: { not: subscriber.id },
    },
  });

  if (existingByEmail) {
    return { success: false, error: "That email is already in use by another account." };
  }

  try {
    await prisma.subscriber.update({
      where: { id: subscriber.id },
      data: { name, phone, email, currentBroker },
    });
  } catch (err: any) {
    if (err.code === "P2002" && err.meta?.target?.includes?.("email")) {
      return { success: false, error: "That email is already in use by another account." };
    }
    throw err;
  }

  return { success: true };
}
