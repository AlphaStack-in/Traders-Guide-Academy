"use server";

import { revalidatePath } from "next/cache";
import type { ProductCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { denyUnlessAccess } from "@/lib/admin-auth";

// Server actions for /admin/products — catalog CRUD for the public /products
// page. Kept separate from news-alerts/actions.ts since the two entities
// share nothing beyond denyUnlessAccess() and revalidatePath().
export interface ProductInput {
  name: string;
  category: ProductCategory;
  description: string;
  longDescription: string;
  // Collected from the admin form in rupees (what an admin actually types)
  // and converted to paise — the DB's unit, same convention as every other
  // money field in this schema — at the point of writing. See toPaise().
  priceInRupees: number;
  originalPriceInRupees?: number | null;
  rating?: number | null;
  ratingCount?: number | null;
  imageUrl?: string | null;
  isFeatured?: boolean;
  accessValidityDays?: number | null;
  courseAccessUrl?: string | null;
}

function toPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

function slugify(input: string): string {
  return (
    input
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "product"
  );
}

// Appends -2, -3, … until the slug is free. Only ever called from
// createProduct (never on update — a product's slug is fixed for life once
// published, same reasoning as NewsAlert.productSlug validating against it
// rather than a hard foreign key: changing it after the fact would break
// any link already shared or indexed).
async function uniqueSlug(base: string): Promise<string> {
  let candidate = base;
  let suffix = 2;
  for (;;) {
    const existing = await prisma.product.findUnique({ where: { slug: candidate } });
    if (!existing) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

function normalize(input: ProductInput) {
  const name = input.name.trim();
  const description = input.description.trim();
  const longDescription = input.longDescription.trim() || description;
  return {
    name,
    category: input.category,
    description,
    longDescription,
    priceInPaise: toPaise(input.priceInRupees),
    originalPriceInPaise:
      input.originalPriceInRupees != null ? toPaise(input.originalPriceInRupees) : null,
    rating: input.rating ?? null,
    ratingCount: input.ratingCount != null ? Math.round(input.ratingCount) : null,
    imageUrl: input.imageUrl?.trim() || null,
    isFeatured: Boolean(input.isFeatured),
    accessValidityDays:
      input.accessValidityDays != null ? Math.round(input.accessValidityDays) : null,
    courseAccessUrl: input.courseAccessUrl?.trim() || null,
  };
}

function revalidateProductPaths(slug: string) {
  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath(`/products/${slug}`);
  revalidatePath("/");
}

export async function createProduct(input: ProductInput) {
  const denied = await denyUnlessAccess("ADMIN");
  if (denied) return denied;

  const name = input.name.trim();
  if (!name) {
    return { success: false, error: "Name is required." };
  }
  if (!input.description.trim()) {
    return { success: false, error: "Short description is required." };
  }
  if (!Number.isFinite(input.priceInRupees) || input.priceInRupees < 0) {
    return { success: false, error: "Enter a valid price (0 for free)." };
  }

  const normalized = normalize(input);
  const slug = await uniqueSlug(slugify(name));

  await prisma.product.create({
    data: { ...normalized, slug, isActive: true },
  });

  revalidateProductPaths(slug);

  return { success: true };
}

export async function updateProduct(id: string, input: ProductInput) {
  const denied = await denyUnlessAccess("ADMIN");
  if (denied) return denied;

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    return { success: false, error: "Not found." };
  }

  const name = input.name.trim();
  if (!name) {
    return { success: false, error: "Name is required." };
  }
  if (!Number.isFinite(input.priceInRupees) || input.priceInRupees < 0) {
    return { success: false, error: "Enter a valid price (0 for free)." };
  }

  const normalized = normalize(input);

  // slug is intentionally left out of `data` — a product's slug (its public
  // URL) never changes from this form. See uniqueSlug's comment above.
  await prisma.product.update({
    where: { id },
    data: normalized,
  });

  revalidateProductPaths(product.slug);

  return { success: true };
}

export async function setProductActive(id: string, isActive: boolean) {
  const denied = await denyUnlessAccess("ADMIN");
  if (denied) return denied;

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    return { success: false, error: "Not found." };
  }

  await prisma.product.update({ where: { id }, data: { isActive } });

  revalidateProductPaths(product.slug);

  return { success: true };
}

export async function deleteProduct(id: string) {
  const denied = await denyUnlessAccess("ADMIN");
  if (denied) return denied;

  // Product isn't cascade-deleted from ProductPurchase (unlike Subscriber →
  // Subscription/Payment above) — a real purchase history should never
  // silently disappear because an admin deleted the catalog entry. Guard
  // against the FK violation with a clear message instead of a raw Prisma
  // error, and point the admin at deactivating (setProductActive) instead.
  const product = await prisma.product.findUnique({
    where: { id },
    include: { _count: { select: { purchases: true } } },
  });
  if (!product) {
    return { success: false, error: "Not found." };
  }
  if (product._count.purchases > 0) {
    return {
      success: false,
      error: `Can't delete — ${product._count.purchases} purchase${
        product._count.purchases === 1 ? "" : "s"
      } reference this product. Deactivate it instead.`,
    };
  }

  await prisma.product.delete({ where: { id } });

  revalidateProductPaths(product.slug);

  return { success: true };
}
