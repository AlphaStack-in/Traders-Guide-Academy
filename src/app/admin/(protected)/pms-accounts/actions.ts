"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-rbac";

export interface AddPmsValuationInput {
  productPurchaseId: string;
  /** ISO date string (yyyy-mm-dd from a date input). */
  asOfDate: string;
  /** Rupees, not paise — converted here so the form stays human-friendly. */
  currentValueInRupees: number;
  note?: string | null;
}

/**
 * Logs a new PmsValuationEntry for a subscriber's PMS purchase — the only
 * way this data gets created (see prisma/schema.prisma's PmsValuationEntry
 * comment). Gated the same way every other admin action in this app is
 * (requireAdmin() — a single hardcoded admin account, see
 * src/lib/admin-rbac.ts), not a new access level.
 */
export async function addPmsValuationEntry(input: AddPmsValuationInput) {
  const admin = await requireAdmin();

  const asOfDate = new Date(input.asOfDate);
  if (Number.isNaN(asOfDate.getTime())) {
    return { success: false as const, error: "Enter a valid date." };
  }
  if (!Number.isFinite(input.currentValueInRupees) || input.currentValueInRupees < 0) {
    return { success: false as const, error: "Enter a valid value." };
  }

  const purchase = await prisma.productPurchase.findUnique({
    where: { id: input.productPurchaseId },
  });
  if (!purchase) {
    return { success: false as const, error: "PMS purchase not found." };
  }

  try {
    await prisma.pmsValuationEntry.create({
      data: {
        productPurchaseId: input.productPurchaseId,
        asOfDate,
        currentValueInPaise: Math.round(input.currentValueInRupees * 100),
        note: input.note?.trim() || null,
        enteredBy: admin.email,
      },
    });
  } catch (err: unknown) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return { success: false as const, error: "A valuation for that date already exists." };
    }
    throw err;
  }

  revalidatePath("/admin/pms-accounts");
  revalidatePath("/account/subscriptions");

  return { success: true as const };
}
