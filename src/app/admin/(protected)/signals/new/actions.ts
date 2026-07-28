"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { calcPnlPercent, deriveStatus } from "@/lib/signal-metrics";
import {
  formatNewSignalMessage,
  formatSignalUpdateMessage,
  sendTelegramMessage,
} from "@/lib/telegram";
import { clientConfig } from "@/lib/client-config";
import type { InstrumentLiteral } from "@/lib/instruments";

export interface SignalInput {
  strike: number;
  optionType: "CE" | "PE";
  instrument: InstrumentLiteral;
  entryPrice: number;
  stopLoss: number;
  targets: number[];
  priceAtSignal: number;
  sellPrice: number | null;
  rawMessage: string;
  expiry: string;
}

async function requireAdmin() {
  if (!clientConfig.requireAdminAuth) return;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    throw new Error("Not authenticated");
  }
}

function toSignalCreateData(input: SignalInput) {
  const status = deriveStatus({
    entryPrice: input.entryPrice,
    stopLoss: input.stopLoss,
    targets: input.targets,
    sellPrice: input.sellPrice,
  });
  const pnlPercent =
    input.sellPrice != null ? calcPnlPercent(input.entryPrice, input.sellPrice) : null;

  return {
    strike: input.strike,
    optionType: input.optionType,
    instrument: input.instrument,
    entryPrice: input.entryPrice,
    stopLoss: input.stopLoss,
    targets: input.targets,
    priceAtSignal: input.priceAtSignal,
    sellPrice: input.sellPrice,
    rawMessage: input.rawMessage,
    status,
    pnlPercent,
    closedTime: input.sellPrice != null ? new Date() : null,
    expiry: new Date(input.expiry),
  };
}

export async function createSignals(inputs: SignalInput[]) {
  await requireAdmin();

  if (inputs.length === 0) {
    return { success: false, error: "No signals to save." };
  }

  if (inputs.some((input) => !input.expiry || Number.isNaN(new Date(input.expiry).getTime()))) {
    return { success: false, error: "Every signal needs a valid expiry date." };
  }

  // Created one at a time (not createMany) so each new signal's id is known
  // immediately — needed to post its "new signal" AdminUpdate row.
  for (const input of inputs) {
    const signal = await prisma.signal.create({ data: toSignalCreateData(input) });

    if (input.sellPrice != null) {
      const pnlPercent = calcPnlPercent(input.entryPrice, input.sellPrice);
      const status = deriveStatus({
        entryPrice: input.entryPrice,
        stopLoss: input.stopLoss,
        targets: input.targets,
        sellPrice: input.sellPrice,
      });
      await sendTelegramMessage(
        formatSignalUpdateMessage({ ...input, sellPrice: input.sellPrice, pnlPercent, status }),
      );
    } else {
      await sendTelegramMessage(formatNewSignalMessage(input));
      // So a brand-new ongoing trade shows up in the notification panel
      // immediately, not only once the admin sends a status update for it.
      await prisma.adminUpdate.create({
        data: {
          signalId: signal.id,
          strike: signal.strike,
          optionType: signal.optionType,
          instrument: signal.instrument,
          message: `New signal — Entry ${input.entryPrice} | SL ${input.stopLoss} | Target ${input.targets.join(", ")}`,
        },
      });
    }
  }

  revalidatePath("/signals");
  revalidatePath("/dashboard");
  revalidatePath("/admin/dashboard");
  revalidatePath("/");

  return { success: true };
}
