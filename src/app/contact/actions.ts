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
