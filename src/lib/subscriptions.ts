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
import type { PaymentStatus, ProductCategory, SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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

export interface SubscriberSubscriptionsSummary {
  membership: MembershipSummary | null;
  purchaseHistory: PurchaseHistoryItem[];
  courses: CourseEntry[];
  indicatorsAndEbooks: SimplePurchaseEntry[];
  memberships: SimplePurchaseEntry[];
  pmsAccounts: PmsAccountEntry[];
}

function computeCourseExpiry(purchasedAt: Date, accessValidityDays: number | null): Date | null {
  if (accessValidityDays == null) return null;
  const expiry = new Date(purchasedAt);
  expiry.setDate(expiry.getDate() + accessValidityDays);
  return expiry;
}

export async function getSubscriberSubscriptionsSummary(
  subscriberId: string,
): Promise<SubscriberSubscriptionsSummary> {
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

  return { membership, purchaseHistory, courses, indicatorsAndEbooks, memberships, pmsAccounts };
}
