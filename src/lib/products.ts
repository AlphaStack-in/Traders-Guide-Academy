import type { Product, ProductCategory } from "@prisma/client";
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

export async function getActiveProducts(): Promise<Product[]> {
  return prisma.product.findMany({
    where: { isActive: true },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "asc" }],
  });
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return prisma.product.findUnique({ where: { slug } });
}
