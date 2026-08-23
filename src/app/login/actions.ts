"use server";

import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/utils";
import { verifyPassword } from "@/lib/password";
import { createSubscriberSession } from "@/lib/subscriber-auth";

export async function loginSubscriber(
  emailInput: string,
  password: string,
): Promise<{ success: boolean; error?: string }> {
  const email = normalizeEmail(emailInput);

  if (!email || !email.includes("@")) {
    return { success: false, error: "Please enter a valid email address." };
  }

  if (!password) {
    return { success: false, error: "Please enter your password." };
  }

  const subscriber = await prisma.subscriber.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });

  if (!subscriber) {
    return {
      success: false,
      error: "This email is not registered as a premium subscriber. Please check your email or register first.",
    };
  }

  if (!subscriber.passwordHash) {
    return {
      success: false,
      error: "Login isn't set up for this account yet — contact support to get your password set.",
    };
  }

  if (!verifyPassword(password, subscriber.passwordHash)) {
    return { success: false, error: "Invalid email or password." };
  }

  await createSubscriberSession(subscriber.id);
  return { success: true };
}
