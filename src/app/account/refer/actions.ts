"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentSubscriber } from "@/lib/subscriber-auth";
import { REFERRAL_CONFIG } from "@/lib/referral-config";

/**
 * Server action to claim daily social promotion reward (₹10/day).
 * Strictly idempotent per IST calendar day per subscriber via database unique constraint.
 */
export async function claimSocialRewardAction(platform: string = "SHARE_INITIATED") {
  const subscriber = await getCurrentSubscriber();
  if (!subscriber) {
    return { success: false, error: "You must be logged in to claim rewards." };
  }

  // Calculate IST date string (YYYY-MM-DD)
  const todayIST = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

  try {
    // Check if social reward was already claimed today
    const existingEvent = await prisma.socialPromotionEvent.findUnique({
      where: {
        subscriberId_shareDate: {
          subscriberId: subscriber.id,
          shareDate: todayIST,
        },
      },
    });

    if (existingEvent) {
      return {
        success: false,
        alreadyClaimed: true,
        error: "Today's social promotion reward (₹10) has already been claimed!",
      };
    }

    // Atomic transaction: record event + add reward transaction
    await prisma.$transaction([
      prisma.socialPromotionEvent.create({
        data: {
          subscriberId: subscriber.id,
          platform,
          shareDate: todayIST,
          rewardAmount: REFERRAL_CONFIG.SOCIAL_PROMOTION_DAILY_REWARD,
        },
      }),
      prisma.rewardTransaction.create({
        data: {
          subscriberId: subscriber.id,
          type: "SOCIAL_PROMOTION",
          amount: REFERRAL_CONFIG.SOCIAL_PROMOTION_DAILY_REWARD,
          status: "CREDITED",
          description: `Social Promotion Reward (Share Initiated - ${todayIST})`,
          referenceId: todayIST,
        },
      }),
    ]);

    revalidatePath("/account/refer");
    return { success: true, rewardAmount: REFERRAL_CONFIG.SOCIAL_PROMOTION_DAILY_REWARD };
  } catch (err: any) {
    if (err.code === "P2002") {
      return {
        success: false,
        alreadyClaimed: true,
        error: "Today's social promotion reward (₹10) has already been claimed!",
      };
    }
    console.error("Failed to claim social promotion reward:", err);
    return { success: false, error: "Failed to process reward. Please try again." };
  }
}

/**
 * Server action to queue redemption of subscription credit toward next renewal.
 */
export async function redeemCreditAction(amount: number) {
  const subscriber = await getCurrentSubscriber();
  if (!subscriber) {
    return { success: false, error: "You must be logged in to redeem credits." };
  }

  if (amount <= 0) {
    return { success: false, error: "Invalid redemption amount." };
  }

  // Calculate available credit from ledger
  const txs = await prisma.rewardTransaction.findMany({
    where: { subscriberId: subscriber.id },
  });

  const availableCredit = txs.reduce((acc, tx) => {
    if (tx.status === "CREDITED") return acc + tx.amount;
    if (tx.type === "SUBSCRIPTION_REDEMPTION") return acc - Math.abs(tx.amount);
    return acc;
  }, 0);

  if (amount > availableCredit) {
    return { success: false, error: "Insufficient subscription credit balance." };
  }

  await prisma.rewardTransaction.create({
    data: {
      subscriberId: subscriber.id,
      type: "SUBSCRIPTION_REDEMPTION",
      amount: amount,
      status: "REDEEMED",
      description: `Redemption applied toward next subscription renewal`,
    },
  });

  revalidatePath("/account/refer");
  return { success: true };
}

/**
 * Idempotently qualifies a referral reward when a referred subscriber completes an eligible paid subscription.
 */
export async function qualifyReferralReward(referredSubscriberId: string) {
  const referred = await prisma.subscriber.findUnique({
    where: { id: referredSubscriberId },
  });

  if (!referred || !referred.invitedBy) {
    return { success: false, reason: "No referring member found." };
  }

  // Self-referral protection
  if (referred.invitedBy === referred.id) {
    return { success: false, reason: "Self-referral is not allowed." };
  }

  const referrer = await prisma.subscriber.findUnique({
    where: { id: referred.invitedBy },
  });

  if (!referrer) {
    return { success: false, reason: "Referrer does not exist." };
  }

  // Anti-abuse: same phone / same email
  if (
    referrer.phone === referred.phone ||
    (referrer.email && referred.email && referrer.email.toLowerCase() === referred.email.toLowerCase())
  ) {
    return { success: false, reason: "Same contact information." };
  }

  // IDEMPOTENCY CHECK: Check if reward transaction already exists
  const existingTx = await prisma.rewardTransaction.findFirst({
    where: {
      subscriberId: referrer.id,
      type: "REFERRAL_REWARD",
      referenceId: referred.id,
    },
  });

  if (existingTx) {
    return { success: true, alreadyCredited: true };
  }

  // Transactionally update referred status to REWARD_CREDITED and add ₹1,000 RewardTransaction
  await prisma.$transaction([
    prisma.subscriber.update({
      where: { id: referred.id },
      data: { referralStatus: "REWARD_CREDITED" },
    }),
    prisma.rewardTransaction.create({
      data: {
        subscriberId: referrer.id,
        type: "REFERRAL_REWARD",
        amount: REFERRAL_CONFIG.SUCCESSFUL_REFERRAL_REWARD,
        status: "CREDITED",
        description: `Subscription Credit for successful referral: ${referred.name}`,
        referenceId: referred.id,
      },
    }),
  ]);

  return { success: true, credited: true };
}
