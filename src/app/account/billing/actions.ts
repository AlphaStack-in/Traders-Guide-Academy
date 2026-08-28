"use server";

import { randomUUID } from "crypto";
import type { BillingCycle } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSubscriber } from "@/lib/subscriber-auth";
import { cashfreeRequest, CashfreeApiError, getCashfreeCheckoutMode, isCashfreeConfigured } from "@/lib/cashfree";
import {
  BILLING_CYCLE_MAX_CYCLES,
  BILLING_CYCLE_TO_CASHFREE_INTERVAL,
  getPricingPlanForCycle,
} from "@/lib/cashfree-plans";
import { clientConfig } from "@/lib/client-config";
import { sendTelegramMessage } from "@/lib/telegram";

interface CashfreeCreateSubscriptionResponse {
  subscription_id: string;
  cf_subscription_id?: string;
  subscription_session_id?: string;
  subscription_status?: string;
}

/**
 * Starts a real self-service checkout for the logged-in subscriber: creates
 * a Cashfree Subscription (UPI Autopay-eligible, PERIODIC plan sent inline —
 * see cashfree-plans.ts) and a local Subscription row, then hands the
 * client just enough to open Cashfree's hosted checkout.
 * The subscriber must already be authenticated (see subscriber-auth.ts) —
 * this intentionally does NOT accept a subscriberId/phone from the client,
 * so nobody can start a billing mandate against someone else's account.
 *
 * Local DB state here is optimistic (status "CREATED"); the webhook handler
 * (src/app/api/webhooks/cashfree/route.ts) is the source of truth once
 * Cashfree confirms the mandate/charge.
 */
export async function createSubscriptionCheckout(billingCycle: BillingCycle) {
  if (!isCashfreeConfigured()) {
    return {
      success: false as const,
      error: "Online checkout isn't set up yet — use the WhatsApp option below instead.",
    };
  }

  const pricingPlan = getPricingPlanForCycle(billingCycle);
  if (!pricingPlan) {
    return {
      success: false as const,
      error: "This plan isn't available for online checkout yet — use the WhatsApp option below instead.",
    };
  }

  const subscriber = await requireSubscriber();

  if (!subscriber.email) {
    return {
      success: false as const,
      error: "Add an email to your profile first (needed for the payment receipt), or use the WhatsApp option below.",
    };
  }

  const { plan_interval_type, plan_intervals } = BILLING_CYCLE_TO_CASHFREE_INTERVAL[billingCycle];
  // Existing members renew at the discounted existing-member price (see
  // clientConfig.pricingPlans), not the fresh-registration price — this
  // flow (ContinuePremiumPanel) is only ever used by an already-confirmed
  // member, never for a brand-new signup.
  const amount = pricingPlan.existingMemberPriceInr;
  const subscriptionId = `sub_${subscriber.id.replace(/-/g, "")}_${Date.now()}`;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  let response: CashfreeCreateSubscriptionResponse;
  try {
    response = await cashfreeRequest<CashfreeCreateSubscriptionResponse>({
      method: "POST",
      path: "/subscriptions",
      body: {
        subscription_id: subscriptionId,
        customer_details: {
          customer_name: subscriber.name,
          customer_email: subscriber.email,
          customer_phone: subscriber.phone,
        },
        plan_details: {
          plan_name: `${clientConfig.siteName} — ${pricingPlan.label}`,
          plan_type: "PERIODIC",
          plan_currency: "INR",
          plan_amount: amount,
          plan_max_amount: amount,
          plan_max_cycles: BILLING_CYCLE_MAX_CYCLES[billingCycle],
          plan_intervals,
          plan_interval_type,
        },
        authorization_details: {
          authorization_amount: amount,
          authorization_amount_refund: false,
          payment_methods: ["upi"],
        },
        subscription_meta: {
          return_url: `${baseUrl}/account/profile?autopay=started`,
          notification_channel: ["SMS", "EMAIL"],
        },
      },
    });
  } catch (err) {
    const message = err instanceof CashfreeApiError ? err.message : "Couldn't start checkout.";
    return { success: false as const, error: `${message} — try again, or use the WhatsApp option below.` };
  }

  if (!response.subscription_session_id) {
    return {
      success: false as const,
      error: "Cashfree didn't return a checkout session — try again, or use the WhatsApp option below.",
    };
  }

  await prisma.subscription.create({
    data: {
      subscriberId: subscriber.id,
      billingCycle,
      providerSubscriptionId: subscriptionId,
      status: "CREATED",
    },
  });

  return {
    success: true as const,
    subscriptionSessionId: response.subscription_session_id,
    checkoutMode: getCashfreeCheckoutMode(),
    siteName: clientConfig.siteName,
  };
}

/**
 * Cancels the subscriber's own active/pending Subscription — Cashfree-side
 * immediately (no more Autopay charges), local row updated optimistically;
 * the webhook's SUBSCRIPTION_STATUS_CHANGE event confirms it. Deliberately
 * scoped to the caller's own subscriptions (looked up by subscriberId, not
 * an arbitrary subscriptionId) for the same reason as above.
 */
export async function cancelMySubscription() {
  const subscriber = await requireSubscriber();

  const active = await prisma.subscription.findFirst({
    where: {
      subscriberId: subscriber.id,
      status: { in: ["CREATED", "AUTHENTICATED", "ACTIVE", "PENDING", "HALTED"] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!active) {
    return { success: false as const, error: "No active autopay subscription found." };
  }

  try {
    await cashfreeRequest({
      method: "POST",
      path: `/subscriptions/${encodeURIComponent(active.providerSubscriptionId)}/manage`,
      body: { subscription_id: active.providerSubscriptionId, action: "CANCEL" },
    });
  } catch (err) {
    const message = err instanceof CashfreeApiError ? err.message : "Couldn't cancel autopay.";
    return { success: false as const, error: message };
  }

  await prisma.subscription.update({
    where: { id: active.id },
    data: { status: "CANCELLED" },
  });

  await sendTelegramMessage(
    `🔕 ${subscriber.name} (${subscriber.phone}) cancelled Autopay for their ${active.billingCycle.toLowerCase()} plan.`,
  );

  return { success: true as const };
}
