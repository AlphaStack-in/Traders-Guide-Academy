import type { Product, ProductCategory } from "@prisma/client";
import type { LucideIcon } from "lucide-react";
import { GraduationCap, LineChart, BookOpen, Briefcase, Crown } from "lucide-react";
import { prisma } from "@/lib/prisma";

/** Display order + label for each category — used by the catalog sidebar
 * filters and the category badge on every product row. */
export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  COURSE: "Course",
  INDICATOR: "Indicator",
  EBOOK: "E-book",
  PMS: "PMS",
  MEMBERSHIP: "Membership Plan",
};

export const PRODUCT_CATEGORY_ORDER: ProductCategory[] = [
  "COURSE",
  "INDICATOR",
  "EBOOK",
  "PMS",
  "MEMBERSHIP",
];

/** Icon shown on the category badge/filter row for each category — shared by
 * product-row.tsx and product-filters.tsx so the same icon always represents
 * the same category everywhere on the catalog. */
export const PRODUCT_CATEGORY_ICONS: Record<ProductCategory, LucideIcon> = {
  COURSE: GraduationCap,
  INDICATOR: LineChart,
  EBOOK: BookOpen,
  PMS: Briefcase,
  MEMBERSHIP: Crown,
};

/** CSS custom-property name (see globals.css) used to tint each category's
 * badge, icon and accents — kept as a single lookup so the color for a
 * category never drifts between the row, the drawer and the filters. */
export const PRODUCT_CATEGORY_COLOR_VAR: Record<ProductCategory, string> = {
  COURSE: "--signalflow-text-accent-start",
  INDICATOR: "--signalflow-ce",
  EBOOK: "--signalflow-gold-start",
  PMS: "--signalflow-gold-start",
  MEMBERSHIP: "--signalflow-pe",
};

/** What-you-get bullets shown in the expanded catalog row and on the /products/[slug]
 * detail page — generic per category since the migrated Graphy data doesn't include
 * structured feature lists. Swap for real per-product bullets once the client supplies
 * them. Centralized here so the catalog row and the detail page never drift apart. */
export const PRODUCT_CATEGORY_FEATURES: Record<ProductCategory, string[]> = {
  COURSE: ["Lifetime access to recorded modules", "Practical, example-driven lessons"],
  INDICATOR: ["Installs on your own charting platform", "Ongoing updates included"],
  EBOOK: ["Instant download after enrolling", "Reference material you keep"],
  PMS: [
    "₹30,000 contribution joins a 50-member group (₹15,00,000 pooled capital)",
    "Free 1-year mentorship, premium indicators & study notes",
    "Loss covered by us, plus a minimum 15% return guaranteed in year 1",
  ],
  MEMBERSHIP: ["Priority access and updates", "Direct onboarding after purchase"],
};

/** Whether a category's fulfillment is "digital delivery" (email + internal
 * ops alert + manual WhatsApp handoff) rather than course/e-book LMS access.
 * See src/lib/product-fulfillment.ts. */
export function isHighTouchCategory(category: ProductCategory): boolean {
  return category === "INDICATOR" || category === "PMS" || category === "MEMBERSHIP";
}

export function formatPriceInPaise(priceInPaise: number): string {
  if (priceInPaise === 0) return "Free";
  return `₹${Math.round(priceInPaise / 100).toLocaleString("en-IN")}`;
}

/** Whole-percent discount vs. the struck-through original price, e.g. ₹35,000 →
 * ₹25,000 is 29%. Returns null when there's no original price to compare against,
 * or the product isn't actually discounted — callers should skip the "SAVE" badge
 * in that case rather than show a 0%/negative figure. */
export function computeSavingsPercent(
  originalPriceInPaise: number | null | undefined,
  priceInPaise: number,
): number | null {
  if (!originalPriceInPaise || originalPriceInPaise <= priceInPaise) return null;
  return Math.round(((originalPriceInPaise - priceInPaise) / originalPriceInPaise) * 100);
}

export async function getActiveProducts(): Promise<Product[]> {
  return prisma.product.findMany({
    where: { isActive: true },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "asc" }],
  });
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return prisma.product.findUnique({ where: { slug } });
}
