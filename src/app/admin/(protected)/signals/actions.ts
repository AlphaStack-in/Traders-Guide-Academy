"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { calcPnlPercent, deriveStatus, inferHitTargetLabel } from "@/lib/signal-metrics";
import {
  formatNewSignalMessage,
  formatSignalUpdateMessage,
  sendTelegramMessage,
} from "@/lib/telegram";
import type { InstrumentValue } from "@/lib/instruments";
import { resolveDhanContract } from "@/lib/broker/dhan-contract-resolver";

export interface SignalInput {
  strike: number;
  optionType: "CE" | "PE";
  instrument: InstrumentValue;
  entryPrice: number;
  stopLoss: number;
  targets: number[];
  priceAtSignal: number;
  sellPrice: number | null;
  rawMessage: string;
  expiry: string;
  chartImageUrl?: string | null;
  entryLow?: number | null;
  entryHigh?: number | null;
  target1?: number | null;
  target2?: number | null;
  contextTags?: string[];
  confidence?: string;
  parserName?: string;
  // The typed stock symbol when instrument === "STOCK" (see
  // manual-signal-form.tsx) — null for index/commodity signals. The
  // `instrument` enum only says "this is a stock", not which one, so the
  // real ticker lives here and is also offered back as an "already used"
  // suggestion.
  stockSymbol?: string | null;
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
    chartImageUrl: input.chartImageUrl ?? null,
    entryLow: input.entryLow ?? null,
    entryHigh: input.entryHigh ?? null,
    target1: input.target1 ?? (input.targets[0] || null),
    target2: input.target2 ?? (input.targets[1] || null),
    contextTags: input.contextTags ?? [],
    confidence: input.confidence ?? "HIGH",
    parserName: input.parserName ?? "SIGNALFLOW",
    stockSymbol: input.stockSymbol ?? null,
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
    // Snapshot lot size from DhanInstrument cache (best-effort). Skipped
    // for STOCK signals — that cache only ever syncs index (OPTIDX)
    // contracts, never individual-stock (OPTSTK) ones, so it would always
    // miss (see dhan-instrument-sync.ts).
    let lotSize: number | null = null;
    if (input.instrument !== "STOCK") {
      try {
        const contract = await resolveDhanContract({
          instrument: input.instrument,
          strike: input.strike,
          optionType: input.optionType,
          expiry: new Date(input.expiry),
        });
        if (contract) lotSize = contract.lotSize;
      } catch {
        // Non-critical -- lot size is optional
      }
    }

    const signal = await prisma.signal.create({
      data: { ...toSignalCreateData(input), lotSize },
    });

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
      await sendTelegramMessage(formatNewSignalMessage({ ...input, stockSymbol: input.stockSymbol }));
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

  revalidatePath("/admin/signals");
  revalidatePath("/signals");
  revalidatePath("/dashboard");
  revalidatePath("/admin/dashboard");
  revalidatePath("/");

  return { success: true };
}

export interface SignalUpdateInput {
  strike: number;
  optionType: "CE" | "PE";
  instrument: InstrumentValue;
  // Present only when instrument === "STOCK" — see SignalInput.stockSymbol.
  stockSymbol?: string | null;
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
      stockSymbol: input.instrument === "STOCK" ? (input.stockSymbol?.trim().toUpperCase() || null) : null,
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
        instrument: signal.instrument,
        message: adminNote,
      },
    });
  }

  revalidatePath("/admin/signals");
  revalidatePath("/signals");

  return { success: true };
}

export interface AdminUpdateItem {
  id: string;
  message: string;
  createdAt: string;
}

export async function getRecentAdminUpdates(limit = 200) {
  // Full history, newest first — the notification panel groups these by
  // signal itself (most-recently-active signal's group first, messages
  // within a group newest first too).
  const updates = await prisma.adminUpdate.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return updates.map((u) => ({
    id: u.id,
    signalId: u.signalId,
    strike: u.strike,
    optionType: u.optionType,
    instrument: u.instrument,
    message: u.message,
    createdAt: u.createdAt.toISOString(),
  }));
}

export async function getAdminUpdatesForSignals(
  signalIds: string[],
): Promise<Record<string, AdminUpdateItem[]>> {
  if (signalIds.length === 0) return {};

  const updates = await prisma.adminUpdate.findMany({
    where: { signalId: { in: signalIds } },
    orderBy: { createdAt: "desc" },
  });

  const map: Record<string, AdminUpdateItem[]> = {};
  for (const u of updates) {
    // Guaranteed non-null here — the where clause only ever matches rows
    // whose signalId is one of the real ids passed in — but signalId is
    // nullable at the schema level now (see postGeneralAdminUpdate), so TS
    // needs the guard.
    if (!u.signalId) continue;
    if (!map[u.signalId]) {
      map[u.signalId] = [];
    }
    map[u.signalId].push({
      id: u.id,
      message: u.message,
      createdAt: u.createdAt.toISOString(),
    });
  }
  return map;
}

// General broadcast updates — posted independent of any signal (see
// postGeneralAdminUpdate below) — for the "Admin Updates" panel shown on
// both the admin Manage Signals page and the public Trade Log page, so
// admin can message subscribers even when there's no ongoing trade to
// attach a note to.
export async function getGeneralAdminUpdates(limit = 50): Promise<AdminUpdateItem[]> {
  const updates = await prisma.adminUpdate.findMany({
    where: { signalId: null },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return updates.map((u) => ({
    id: u.id,
    message: u.message,
    createdAt: u.createdAt.toISOString(),
  }));
}

export async function postGeneralAdminUpdate(message: string) {
  await requireAdmin();

  const trimmed = message.trim();
  if (!trimmed) {
    return { success: false, error: "Message can't be empty." };
  }

  // signalId/strike/optionType/instrument are left null on purpose — this
  // is a general note to subscribers, not tied to any specific trade (see
  // the AdminUpdate model comment in schema.prisma).
  await prisma.adminUpdate.create({
    data: { message: trimmed },
  });

  revalidatePath("/admin/signals");
  revalidatePath("/signals");

  return { success: true };
}

// Latest AdminUpdate.createdAt per signal — used by the Ongoing Trades
// tables (Trade Log + Manage Signals) to timestamp the note shown there,
// since Signal.adminNote is just a string with no timestamp of its own.
export async function getLatestAdminUpdateTimestamps(
  signalIds: string[],
): Promise<Record<string, string>> {
  const updatesMap = await getAdminUpdatesForSignals(signalIds);
  const latest: Record<string, string> = {};
  for (const [id, list] of Object.entries(updatesMap)) {
    if (list.length > 0) {
      latest[id] = list[0].createdAt;
    }
  }
  return latest;
}

export async function deleteSignal(id: string) {
  await requireAdmin();

  const signal = await prisma.signal.findUnique({ where: { id } });
  if (!signal) {
    return { success: false, error: "Signal not found." };
  }

  // AdminUpdate.signalId isn't a DB foreign key (see schema comment — it's
  // an independent audit log), so this has to be deleted explicitly rather
  // than relying on cascade — otherwise a deleted signal's notifications
  // would keep showing in the panel forever.
  await prisma.adminUpdate.deleteMany({ where: { signalId: id } });
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

  // Additive panel entry for Target Hit only — the celebration animation
  // itself is driven separately (client-side, off the Signal realtime
  // update) so it fires even before this row lands. SL Hit intentionally
  // gets no panel entry, matching the low-key toast-only treatment there.
  if (status === "TARGET_HIT") {
    const targetLabel = inferHitTargetLabel(signal.targets, sellPrice);
    const pnlText = `${pnlPercent > 0 ? "+" : ""}${pnlPercent.toFixed(1)}%`;
    await prisma.adminUpdate.create({
      data: {
        signalId: id,
        strike: signal.strike,
        optionType: signal.optionType,
        instrument: signal.instrument,
        message: `Target Hit${targetLabel ? ` (${targetLabel})` : ""} — ${pnlText} gain.`,
      },
    });
  }

  await sendTelegramMessage(
    formatSignalUpdateMessage({
      strike: signal.strike,
      optionType: signal.optionType,
      instrument: signal.instrument,
      stockSymbol: signal.stockSymbol,
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
