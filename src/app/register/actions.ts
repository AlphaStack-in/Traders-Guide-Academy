"use server";

import { prisma } from "@/lib/prisma";
import { clientConfig } from "@/lib/client-config";
import { createSubscriberSession, setRegisteredBrowserCookie } from "@/lib/subscriber-auth";
import { hashPassword } from "@/lib/password";
import { normalizeEmail } from "@/lib/utils";
import type { BillingCycle } from "@prisma/client";

const MIN_PASSWORD_LENGTH = 6;
const VALID_BILLING_CYCLES: BillingCycle[] = ["MONTHLY", "QUARTERLY", "YEARLY"];

export interface RegisterInput {
  name: string;
  phone: string;
  email: string;
  password: string;
  currentBroker?: string | null;
  // Which pricing tier the visitor picked on the register form (see
  // clientConfig.pricingPlans). Optional so existing callers/tests that
  // predate this field don't break — falls back to MONTHLY.
  billingCycle?: BillingCycle | null;
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
  const email = normalizeEmail(input.email);
  const password = input.password ?? "";
  const currentBroker = input.currentBroker?.trim() || null;
  const billingCycle: BillingCycle = VALID_BILLING_CYCLES.includes(input.billingCycle as BillingCycle)
    ? (input.billingCycle as BillingCycle)
    : "MONTHLY";
  const batchNumber = input.batchNumber ?? clientConfig.batchInfo.batchNumber;
  const token = input.invitationToken?.trim() || null;

  if (!name || !phone) {
    return { success: false, error: "Name and phone are required." };
  }

  if (!email || !email.includes("@")) {
    // Login is email + password based (see src/app/login/actions.ts), so a
    // real email is required at registration — otherwise the account the
    // subscriber just created would be unreachable.
    return { success: false, error: "A valid email is required — you'll use it to log in." };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return { success: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }

  // Subscriber.email is DB-unique (prisma/schema.prisma), but this check
  // still runs first to return a friendly error instead of a raw P2002 for
  // the common case — the create/update below also catches P2002 as a
  // fallback in case a concurrent request races past this check.
  const existingByEmail = await prisma.subscriber.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });

  const passwordHash = hashPassword(password);

  if (token) {
    const invitedSubscriber = await prisma.subscriber.findUnique({
      where: { invitationToken: token },
    });

    if (invitedSubscriber) {
      if (existingByEmail && existingByEmail.id !== invitedSubscriber.id) {
        return {
          success: false,
          error: "That email is already registered. Try logging in instead.",
        };
      }

      let subscriber;
      try {
        subscriber = await prisma.subscriber.update({
          where: { id: invitedSubscriber.id },
          data: {
            name,
            phone,
            email: email || invitedSubscriber.email,
            passwordHash,
            currentBroker: currentBroker || invitedSubscriber.currentBroker,
            billingCycle,
            batchNumber: batchNumber || invitedSubscriber.batchNumber,
            referralStatus: "JOINED",
            invitationToken: null,
          },
        });
      } catch (err: any) {
        if (err.code === "P2002" && err.meta?.target?.includes?.("email")) {
          return {
            success: false,
            error: "That email is already registered. Try logging in instead.",
          };
        }
        throw err;
      }
      await setRegisteredBrowserCookie();
      await createSubscriberSession(subscriber.id);
      return { success: true };
    }
  }

  if (existingByEmail) {
    return {
      success: false,
      error: "That email is already registered. Try logging in instead.",
    };
  }

  // Standard registration without valid referral token defaults to NOT_JOINED
  let subscriber;
  try {
    subscriber = await prisma.subscriber.create({
      data: {
        name,
        phone,
        email,
        passwordHash,
        currentBroker,
        billingCycle,
        batchNumber,
        referralStatus: "NOT_JOINED",
      },
    });
  } catch (err: any) {
    if (err.code === "P2002" && err.meta?.target?.includes?.("email")) {
      return {
        success: false,
        error: "That email is already registered. Try logging in instead.",
      };
    }
    throw err;
  }

  await setRegisteredBrowserCookie();
  await createSubscriberSession(subscriber.id);
  return { success: true };
}
