import type { BillingCycle } from "@prisma/client";
import { clientConfig } from "@/lib/client-config";

/**
 * Unlike Razorpay, Cashfree Subscriptions don't require a pre-created Plan
 * object — `plan_details` are sent inline on every Create Subscription call
 * (see src/app/account/billing/actions.ts), so there's no plan-id
 * bookkeeping or setup script needed here. If TGA's pricing in
 * clientConfig.pricingPlans changes, the very next checkout just uses the
 * new numbers — nothing to re-provision.
 */
export const BILLING_CYCLE_TO_CASHFREE_INTERVAL: Record<
  BillingCycle,
  { plan_interval_type: "MONTH" | "YEAR"; plan_intervals: number }
> = {
  MONTHLY: { plan_interval_type: "MONTH", plan_intervals: 1 },
  QUARTERLY: { plan_interval_type: "MONTH", plan_intervals: 3 },
  YEARLY: { plan_interval_type: "YEAR", plan_intervals: 1 },
};

// Cashfree PERIODIC plans require a bounded `plan_max_cycles` (there's no
// "forever" option) — 100 years' worth per cycle is the standard
// workaround for "keep charging until the subscriber cancels".
export const BILLING_CYCLE_MAX_CYCLES: Record<BillingCycle, number> = {
  MONTHLY: 1200, // 100 years * 12
  QUARTERLY: 400, // 100 years * 4
  YEARLY: 100, // 100 years * 1
};

/** clientConfig.pricingPlans uses lowercase ids ("monthly"/"quarterly"/"yearly"); Prisma's
 * BillingCycle enum is uppercase. Small helpers to move between the two. */
export function billingCycleToPlanId(cycle: BillingCycle): (typeof clientConfig.pricingPlans)[number]["id"] {
  return cycle.toLowerCase() as (typeof clientConfig.pricingPlans)[number]["id"];
}

export function planIdToBillingCycle(id: string): BillingCycle {
  return id.toUpperCase() as BillingCycle;
}

export function getPricingPlanForCycle(cycle: BillingCycle) {
  const id = billingCycleToPlanId(cycle);
  return clientConfig.pricingPlans.find((p) => p.id === id) ?? null;
}
