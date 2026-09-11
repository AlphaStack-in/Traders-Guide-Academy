"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export interface NewsAlertInput {
  title: string;
  // Defaults to "Webinar" from the form — free text, matches the flexible
  // string category NewsAlert already used for text-only market alerts.
  category: string;
  summary: string;
  // Optional — falls back to `summary` so a poster-only entry (image +
  // title + one-line caption) doesn't need a separate long write-up.
  content?: string | null;
  // Base64 data: URL (pasted/uploaded via the admin form) or a /public
  // path. Required in practice for a poster entry, but kept optional at
  // the DB level so this model still covers plain text alerts too.
  imageUrl?: string | null;
  // Registration / WhatsApp / Zoom link shown as a CTA under the poster.
  sourceUrl?: string | null;
  // Slug of a /products catalog entry this poster promotes — when set, the
  // poster links to that product's page ("View & Buy") instead of just
  // expanding in place. See NewsAlert.productSlug in schema.prisma.
  productSlug?: string | null;
  isBreaking?: boolean;
}

function normalize(input: NewsAlertInput) {
  const title = input.title.trim();
  const summary = input.summary.trim();
  return {
    title,
    category: input.category.trim() || "Webinar",
    severity: input.isBreaking ? "BREAKING" : "INFO",
    summary,
    content: (input.content?.trim() || summary) || title,
    imageUrl: input.imageUrl?.trim() || null,
    sourceUrl: input.sourceUrl?.trim() || null,
    productSlug: input.productSlug?.trim() || null,
    isBreaking: Boolean(input.isBreaking),
  };
}

export async function createNewsAlert(input: NewsAlertInput) {
  await requireAdmin();

  const title = input.title.trim();
  const summary = input.summary.trim();
  if (!title) {
    return { success: false, error: "Title is required." };
  }
  if (!summary) {
    return { success: false, error: "Summary/caption is required." };
  }

  const normalized = normalize(input);

  await prisma.newsAlert.create({
    data: {
      ...normalized,
      affectedInstruments: [],
      isActive: true,
    },
  });

  // Backfill the linked product's own thumbnail from this poster — only
  // when the product doesn't already have one, so a later admin-chosen
  // image on the product itself is never clobbered by an older poster.
  if (normalized.productSlug && normalized.imageUrl) {
    const product = await prisma.product.findUnique({ where: { slug: normalized.productSlug } });
    if (product && !product.imageUrl) {
      await prisma.product.update({
        where: { slug: normalized.productSlug },
        data: { imageUrl: normalized.imageUrl },
      });
      revalidatePath(`/products/${normalized.productSlug}`);
      revalidatePath("/products");
    }
  }

  revalidatePath("/admin/news-alerts");
  revalidatePath("/");

  return { success: true };
}

export async function setNewsAlertActive(id: string, isActive: boolean) {
  await requireAdmin();

  const alert = await prisma.newsAlert.findUnique({ where: { id } });
  if (!alert) {
    return { success: false, error: "Not found." };
  }

  await prisma.newsAlert.update({ where: { id }, data: { isActive } });

  revalidatePath("/admin/news-alerts");
  revalidatePath("/");

  return { success: true };
}

export async function deleteNewsAlert(id: string) {
  await requireAdmin();

  const alert = await prisma.newsAlert.findUnique({ where: { id } });
  if (!alert) {
    return { success: false, error: "Not found." };
  }

  await prisma.newsAlert.delete({ where: { id } });

  revalidatePath("/admin/news-alerts");
  revalidatePath("/");

  return { success: true };
}
