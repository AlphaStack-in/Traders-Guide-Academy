"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { checkAccessLevel } from "@/lib/admin-rbac";

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
 * comment). Requires the ADMIN role or above (see src/lib/admin-rbac.ts).
 */
export async function addPmsValuationEntry(input: AddPmsValuationInput) {
  const access = await checkAccessLevel("ADMIN");
  if (!access.ok) return { success: false as const, error: access.error };
  const admin = access.admin;

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
