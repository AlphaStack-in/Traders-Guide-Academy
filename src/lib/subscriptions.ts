/**
 * Data-shaping helper for the subscriber-facing "My Subscriptions" hub
 * (src/app/account/subscriptions/page.tsx). Mirrors the separation already
 * used by src/lib/app-settings.ts / src/lib/products.ts: a plain Prisma read
 * here, no caching (traffic is low), formatting (paise → rupees, dates) left
 * to the page/components that render this data.
 *
 * Pulls together everything a subscriber has ever bought or subscribed to:
 *   - the recurring signals-membership Subscription (Cashfree Autopay)
 *   - every one-time Payment + ProductPurchase, merged into one history list
 *   - COURSE purchases, with computed validity/expiry
 *   - INDICATOR/EBOOK/MEMBERSHIP purchases (simple "you own this" cards)
 *   - PMS purchases, with their admin-entered PmsValuationEntry history and
 *     a computed growth percentage
 */
import type { PaymentStatus, ProductCategory, Subscriber, SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { clientConfig, type PricingPlan } from "@/lib/client-config";
import { formatDateOnly, formatFullTimestamp } from "@/lib/utils";

// Subscriber-facing labels for SubscriptionStatus — identical wording to the
// map already inlined in src/app/account/profile/page.tsx. Duplicated
// rather than imported from there (that page keeps its own local copy) so
// this new page doesn't depend on — or risk destabilizing — an existing,
// already-shipped page.
export const AUTOPAY_STATUS_LABEL: Record<SubscriptionStatus, string> = {
  CREATED: "Checkout started",
  AUTHENTICATED: "Authorized — first charge pending",
  ACTIVE: "Active",
  PENDING: "Payment retrying",
  HALTED: "Halted — renew manually",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
  EXPIRED: "Expired",
};

const CANCELLABLE_STATUSES: SubscriptionStatus[] = [
  "CREATED",
  "AUTHENTICATED",
  "ACTIVE",
  "PENDING",
  "HALTED",
];

export interface MembershipSummary {
  statusLabel: string;
  status: SubscriptionStatus;
  isActive: boolean;
  billingCycleLabel: string;
  currentPeriodEnd: Date | null;
}

export interface PurchaseHistoryItem {
  id: string;
  kind: "membership_payment" | "product_purchase";
  label: string;
  category: ProductCategory | null;
  date: Date;
  amountInPaise: number;
  status: PaymentStatus;
}

export interface CourseEntry {
  purchaseId: string;
  productName: string;
  productSlug: string;
  purchasedAt: Date;
  accessValidityDays: number | null;
  courseAccessUrl: string | null;
  expiresAt: Date | null;
  isExpired: boolean;
}

export interface SimplePurchaseEntry {
  purchaseId: string;
  productName: string;
  productSlug: string;
  category: ProductCategory;
  purchasedAt: Date;
}

export interface PmsValuationPoint {
  id: string;
  asOfDate: Date;
  currentValueInPaise: number;
  note: string | null;
}

export interface PmsAccountEntry {
  purchaseId: string;
  productName: string;
  purchasedAt: Date;
  contributedAmountInPaise: number;
  latestValueInPaise: number | null;
  latestAsOfDate: Date | null;
  /** (latestValue - contributed) / contributed * 100, null with no valuations yet. */
  growthPercent: number | null;
  valuations: PmsValuationPoint[];
}

// Registration tiers, cheapest to priciest — same ordering the old
// profile-edit-form.tsx used to pick what "Upgrade" should default to.
const TIER_ORDER: PricingPlan["id"][] = ["monthly", "quarterly", "yearly"];

export interface PeriodProgress {
  /** 0-100, how far through the current billing period "today" falls. */
  percent: number;
  daysRemaining: number;
  totalDays: number;
}

export interface PlanBillingSummary {
  /** Which pricing tier the subscriber registered under (e.g. "Quarterly"), or "—". */
  planLabel: string;
  /** Pre-formatted registration timestamp. */
  joinedLabel: string;
  /**
   * An *estimated* current-period range projected from registration date +
   * plan length — there's no real renewal tracking on the manual/WhatsApp
   * flow, payment is still manual/off-platform. Both null when the
   * subscriber has no billingCycle on record to project from, or when a
   * real `membership` (Cashfree Autopay) period is available instead.
   */
  periodStartLabel: string | null;
  periodEndLabel: string | null;
  /**
   * Same current-period window as above (real Autopay period when one
   * exists, otherwise the estimated registration-based projection),
   * reduced to a ring percentage + days-remaining for the "My Subscriptions"
   * dashboard's progress ring. Null only when there's no period to project
   * at all (e.g. no billingCycle on record and no Autopay subscription).
   */
  progress: PeriodProgress | null;
  /** For the Upgrade/Extend panels. */
  plans: PricingPlan[];
  currentPlanId?: PricingPlan["id"];
  upgradePlanId?: PricingPlan["id"];
  /** False once already on the top tier — nothing to upgrade to. */
  showUpgrade: boolean;
}

export interface SubscriberSubscriptionsSummary {
  membership: MembershipSummary | null;
  planBilling: PlanBillingSummary;
  purchaseHistory: PurchaseHistoryItem[];
  courses: CourseEntry[];
  indicatorsAndEbooks: SimplePurchaseEntry[];
  memberships: SimplePurchaseEntry[];
  pmsAccounts: PmsAccountEntry[];
}

// Exported so src/lib/product-fulfillment.ts can reuse the exact same
// validity-window math for the "new course purchase" confirmation email
// (start/end validity dates) rather than re-deriving it.
export function computeCourseExpiry(purchasedAt: Date, accessValidityDays: number | null): Date | null {
  if (accessValidityDays == null) return null;
  const expiry = new Date(purchasedAt);
  expiry.setDate(expiry.getDate() + accessValidityDays);
  return expiry;
}

// See the "Period (est.)" doc-comment on PlanBillingSummary above — this is
// the projection math, not a real renewal date.
function addCycleInterval(date: Date, cycle: "MONTHLY" | "QUARTERLY" | "YEARLY"): Date {
  const d = new Date(date);
  if (cycle === "MONTHLY") d.setMonth(d.getMonth() + 1);
  else if (cycle === "QUARTERLY") d.setMonth(d.getMonth() + 3);
  else d.setFullYear(d.getFullYear() + 1);
  return d;
}

// Inverse of addCycleInterval — used to back into a period *start* from a
// real Subscription.currentPeriodEnd, which Cashfree gives us without a
// matching currentPeriodStart on our side.
function subtractCycleInterval(date: Date, cycle: "MONTHLY" | "QUARTERLY" | "YEARLY"): Date {
  const d = new Date(date);
  if (cycle === "MONTHLY") d.setMonth(d.getMonth() - 1);
  else if (cycle === "QUARTERLY") d.setMonth(d.getMonth() - 3);
  else d.setFullYear(d.getFullYear() - 1);
  return d;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function computePeriodProgress(periodStart: Date, periodEnd: Date): PeriodProgress {
  const now = Date.now();
  const totalMs = Math.max(periodEnd.getTime() - periodStart.getTime(), ONE_DAY_MS);
  const percent = Math.min(100, Math.max(0, Math.round(((now - periodStart.getTime()) / totalMs) * 100)));
  const daysRemaining = Math.max(0, Math.ceil((periodEnd.getTime() - now) / ONE_DAY_MS));
  const totalDays = Math.max(1, Math.round(totalMs / ONE_DAY_MS));
  return { percent, daysRemaining, totalDays };
}

export async function getSubscriberSubscriptionsSummary(
  subscriber: Subscriber,
): Promise<SubscriberSubscriptionsSummary> {
  const subscriberId = subscriber.id;
  const [latestSubscription, payments, productPurchases] = await Promise.all([
    prisma.subscription.findFirst({
      where: { subscriberId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.payment.findMany({
      where: { subscriberId },
      orderBy: { createdAt: "desc" },
      include: { subscription: { select: { billingCycle: true } } },
    }),
    prisma.productPurchase.findMany({
      where: { subscriberId, status: "CAPTURED" },
      orderBy: { createdAt: "desc" },
      include: {
        product: true,
        pmsValuationEntries: { orderBy: { asOfDate: "asc" } },
      },
    }),
  ]);

  const membership: MembershipSummary | null = latestSubscription
    ? {
        statusLabel: AUTOPAY_STATUS_LABEL[latestSubscription.status],
        status: latestSubscription.status,
        isActive: CANCELLABLE_STATUSES.includes(latestSubscription.status),
        billingCycleLabel: latestSubscription.billingCycle.charAt(0) +
          latestSubscription.billingCycle.slice(1).toLowerCase(),
        currentPeriodEnd: latestSubscription.currentPeriodEnd,
      }
    : null;

  const membershipPaymentHistory: PurchaseHistoryItem[] = payments.map((p) => ({
    id: p.id,
    kind: "membership_payment",
    label: p.subscription
      ? `Signals Membership (${p.subscription.billingCycle.charAt(0)}${p.subscription.billingCycle.slice(1).toLowerCase()})`
      : "Signals Membership",
    category: null,
    date: p.createdAt,
    amountInPaise: p.amountInPaise,
    status: p.status,
  }));

  const productPurchaseHistory: PurchaseHistoryItem[] = productPurchases.map((pp) => ({
    id: pp.id,
    kind: "product_purchase",
    label: pp.product.name,
    category: pp.product.category,
    date: pp.createdAt,
    amountInPaise: pp.amountInPaise,
    status: pp.status,
  }));

  const purchaseHistory = [...membershipPaymentHistory, ...productPurchaseHistory].sort(
    (a, b) => b.date.getTime() - a.date.getTime(),
  );

  const courses: CourseEntry[] = productPurchases
    .filter((pp) => pp.product.category === "COURSE")
    .map((pp) => {
      const expiresAt = computeCourseExpiry(pp.createdAt, pp.product.accessValidityDays);
      return {
        purchaseId: pp.id,
        productName: pp.product.name,
        productSlug: pp.product.slug,
        purchasedAt: pp.createdAt,
        accessValidityDays: pp.product.accessValidityDays,
        courseAccessUrl: pp.product.courseAccessUrl,
        expiresAt,
        isExpired: expiresAt != null && expiresAt.getTime() < Date.now(),
      };
    });

  const indicatorsAndEbooks: SimplePurchaseEntry[] = productPurchases
    .filter((pp) => pp.product.category === "INDICATOR" || pp.product.category === "EBOOK")
    .map((pp) => ({
      purchaseId: pp.id,
      productName: pp.product.name,
      productSlug: pp.product.slug,
      category: pp.product.category,
      purchasedAt: pp.createdAt,
    }));

  const memberships: SimplePurchaseEntry[] = productPurchases
    .filter((pp) => pp.product.category === "MEMBERSHIP")
    .map((pp) => ({
      purchaseId: pp.id,
      productName: pp.product.name,
      productSlug: pp.product.slug,
      category: pp.product.category,
      purchasedAt: pp.createdAt,
    }));

  const pmsAccounts: PmsAccountEntry[] = productPurchases
    .filter((pp) => pp.product.category === "PMS")
    .map((pp) => {
      const valuations: PmsValuationPoint[] = pp.pmsValuationEntries.map((v) => ({
        id: v.id,
        asOfDate: v.asOfDate,
        currentValueInPaise: v.currentValueInPaise,
        note: v.note,
      }));
      const latest = valuations[valuations.length - 1] ?? null;
      const growthPercent =
        latest != null
          ? ((latest.currentValueInPaise - pp.amountInPaise) / pp.amountInPaise) * 100
          : null;
      return {
        purchaseId: pp.id,
        productName: pp.product.name,
        purchasedAt: pp.createdAt,
        contributedAmountInPaise: pp.amountInPaise,
        latestValueInPaise: latest?.currentValueInPaise ?? null,
        latestAsOfDate: latest?.asOfDate ?? null,
        growthPercent,
        valuations,
      };
    });

  const subscriberPlan = subscriber.billingCycle
    ? clientConfig.pricingPlans.find((p) => p.id === subscriber.billingCycle!.toLowerCase())
    : null;

  const currentTierIndex = subscriberPlan ? TIER_ORDER.indexOf(subscriberPlan.id) : -1;
  const upgradePlanId =
    currentTierIndex >= 0 && currentTierIndex < TIER_ORDER.length - 1
      ? TIER_ORDER[currentTierIndex + 1]
      : undefined;

  // Progress ring for the dashboard: prefer the real Autopay period
  // (back-computing its start from currentPeriodEnd + billingCycle, since
  // Cashfree only gives us the end); fall back to the same estimated
  // registration-based projection the labels below already use.
  let progress: PeriodProgress | null = null;
  if (latestSubscription?.currentPeriodEnd) {
    const periodStart = subtractCycleInterval(latestSubscription.currentPeriodEnd, latestSubscription.billingCycle);
    progress = computePeriodProgress(periodStart, latestSubscription.currentPeriodEnd);
  } else if (subscriber.billingCycle) {
    progress = computePeriodProgress(
      subscriber.createdAt,
      addCycleInterval(subscriber.createdAt, subscriber.billingCycle),
    );
  }

  const planBilling: PlanBillingSummary = {
    planLabel: subscriberPlan ? subscriberPlan.label : "—",
    joinedLabel: formatFullTimestamp(subscriber.createdAt),
    // Only show the estimated period when there's no real Autopay period to
    // show instead (membership.currentPeriodEnd already covers that case).
    periodStartLabel:
      !membership?.currentPeriodEnd && subscriber.billingCycle
        ? formatDateOnly(subscriber.createdAt)
        : null,
    periodEndLabel:
      !membership?.currentPeriodEnd && subscriber.billingCycle
        ? formatDateOnly(addCycleInterval(subscriber.createdAt, subscriber.billingCycle))
        : null,
    progress,
    plans: clientConfig.pricingPlans,
    currentPlanId: subscriberPlan?.id,
    upgradePlanId,
    showUpgrade: currentTierIndex !== TIER_ORDER.length - 1,
  };

  return {
    membership,
    planBilling,
    purchaseHistory,
    courses,
    indicatorsAndEbooks,
    memberships,
    pmsAccounts,
  };
}
