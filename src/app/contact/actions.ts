"use server";

import { prisma } from "@/lib/prisma";

export interface ReferralInput {
  referrerName: string;
  referrerPhone: string;
  referredName: string;
  referredPhone: string;
}

export async function submitReferral(input: ReferralInput) {
  const referrerName = input.referrerName.trim();
  const referrerPhone = input.referrerPhone.trim();
  const referredName = input.referredName.trim();
  const referredPhone = input.referredPhone.trim();

  if (!referrerName || !referrerPhone || !referredName || !referredPhone) {
    return { success: false, error: "All fields are required." };
  }

  await prisma.referral.create({
    data: { referrerName, referrerPhone, referredName, referredPhone },
  });

  return { success: true };
}

export async function getReferralsByPhone(phone: string) {
  const referrerPhone = phone.trim();
  if (!referrerPhone) {
    return { success: false, error: "Enter your phone number.", referrals: [] };
  }

  const referrals = await prisma.referral.findMany({
    where: { referrerPhone },
    orderBy: { createdAt: "desc" },
  });

  return {
    success: true,
    referrals: referrals.map((r) => ({
      id: r.id,
      referredName: r.referredName,
      referredPhone: r.referredPhone,
      createdAt: r.createdAt.toISOString(),
    })),
  };
}

export interface ContactMessageInput {
  name: string;
  phone: string;
  email?: string;
  message: string;
}

export async function submitContactMessage(input: ContactMessageInput) {
  const name = input.name.trim();
  const phone = input.phone.trim();
  const email = input.email?.trim() ?? "";
  const message = input.message.trim();

  if (!name || !phone || !message) {
    return { success: false, error: "Name, phone, and message are required." };
  }

  await prisma.contactMessage.create({
    data: { name, phone, email: email || null, message },
  });

  return { success: true };
}
