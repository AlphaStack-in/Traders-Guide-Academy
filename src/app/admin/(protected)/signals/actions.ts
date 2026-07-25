"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { calcPnlPercent, deriveStatus } from "@/lib/signal-metrics";
import { formatSignalUpdateMessage, sendTelegramMessage } from "@/lib/telegram";
import { clientConfig } from "@/lib/client-config";
import type { InstrumentLiteral } from "@/lib/instruments";

async function requireAdmin() {
  if (!clientConfig.requireAdminAuth) return;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    throw new Error("Not authenticated");
  }
}

export interface SignalUpdateInput {
  strike: number;
  optionType: "CE" | "PE";
  instrument: InstrumentLiteral;
  entryPrice: number;
  stopLoss: number;
  targets: number[];
  sellPrice: number | null;
  signalTime: Date;
  adminNote: string | null;
}

export async function updateSignal(id: string, input: SignalUpdateInput) {
  await requireAdmin();

  const signal = await prisma.signal.findUnique({ where: { id } });
  if (!signal) {
    return { success: false, error: "Signal not found." };
  }

  const pnlPercent =
    input.sellPrice != null ? calcPnlPercent(input.entryPrice, input.sellPrice) : null;
  const status = deriveStatus({
    entryPrice: input.entryPrice,
    stopLoss: input.stopLoss,
    targets: input.targets,
    sellPrice: input.sellPrice,
  });

  await prisma.signal.update({
    where: { id },
    data: {
      strike: input.strike,
      optionType: input.optionType,
      instrument: input.instrument,
      entryPrice: input.entryPrice,
      stopLoss: input.stopLoss,
      targets: input.targets,
      sellPrice: input.sellPrice,
      signalTime: input.signalTime,
      adminNote: input.adminNote,
      pnlPercent,
      status,
      closedTime: input.sellPrice != null ? (signal.closedTime ?? new Date()) : null,
      silentUpdateAt: new Date(),
    },
  });

  revalidatePath("/admin/signals");
  revalidatePath("/signals");
  revalidatePath("/dashboard");
  revalidatePath("/admin/dashboard");
  revalidatePath("/");

  return { success: true };
}

export async function updateAdminNote(id: string, adminNote: string | null) {
  await requireAdmin();

  const signal = await prisma.signal.findUnique({ where: { id } });
  if (!signal) {
    return { success: false, error: "Signal not found." };
  }

  await prisma.signal.update({
    where: { id },
    data: { adminNote },
  });

  if (adminNote) {
    await prisma.adminUpdate.create({
      data: {
        signalId: id,
        strike: signal.strike,
        optionType: signal.optionType,
        message: adminNote,
      },
    });
  }

  revalidatePath("/admin/signals");
  revalidatePath("/admin/signals/new");
  revalidatePath("/signals");

  return { success: true };
}

export async function getRecentAdminUpdates(limit = 50) {
  const updates = await prisma.adminUpdate.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return updates.map((u) => ({
    id: u.id,
    strike: u.strike,
    optionType: u.optionType,
    message: u.message,
    createdAt: u.createdAt.toISOString(),
  }));
}

export async function deleteSignal(id: string) {
  await requireAdmin();

  const signal = await prisma.signal.findUnique({ where: { id } });
  if (!signal) {
    return { success: false, error: "Signal not found." };
  }

  await prisma.signal.delete({ where: { id } });

  revalidatePath("/admin/signals");
  revalidatePath("/signals");
  revalidatePath("/dashboard");
  revalidatePath("/admin/dashboard");
  revalidatePath("/");

  return { success: true };
}

export async function closeSignal(id: string, sellPrice: number) {
  await requireAdmin();

  const signal = await prisma.signal.findUnique({ where: { id } });
  if (!signal) {
    return { success: false, error: "Signal not found." };
  }

  const pnlPercent = calcPnlPercent(signal.entryPrice, sellPrice);
  const status = deriveStatus({
    entryPrice: signal.entryPrice,
    stopLoss: signal.stopLoss,
    targets: signal.targets,
    sellPrice,
  });

  await prisma.signal.update({
    where: { id },
    data: { sellPrice, pnlPercent, status, closedTime: new Date() },
  });

  await sendTelegramMessage(
    formatSignalUpdateMessage({
      strike: signal.strike,
      optionType: signal.optionType,
      instrument: signal.instrument,
      sellPrice,
      pnlPercent,
      status,
    }),
  );

  revalidatePath("/admin/signals");
  revalidatePath("/signals");
  revalidatePath("/dashboard");
  revalidatePath("/admin/dashboard");
  revalidatePath("/");

  return { success: true };
}
