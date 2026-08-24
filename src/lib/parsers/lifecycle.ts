import { prisma } from "@/lib/prisma";
import type { CanonicalSignalDraft } from "./types";
import { calcPnlPercent, deriveStatus } from "@/lib/signal-metrics";
import { sendTelegramMessage, formatSignalUpdateMessage } from "@/lib/telegram";
import { resolveDhanContract } from "@/lib/broker/dhan-contract-resolver";
import type { InstrumentLiteral } from "@/lib/instruments";

export interface LifecycleProcessResult {
  actionTaken: "CREATED" | "UPDATED" | "SKIPPED_DUPLICATE";
  signalId?: string;
  matchedSignalId?: string;
  message: string;
}

export async function processSignalDraftLifecycle(
  draft: CanonicalSignalDraft,
  expiryDate?: string
): Promise<LifecycleProcessResult> {
  // 1. Duplicate Check: Ignore if exact same rawMessage was saved within the last 5 minutes
  const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
  const recentDuplicate = await prisma.signal.findFirst({
    where: {
      rawMessage: draft.rawMessage,
      createdAt: { gte: fiveMinsAgo },
    },
  });

  if (recentDuplicate) {
    return {
      actionTaken: "SKIPPED_DUPLICATE",
      signalId: recentDuplicate.id,
      message: "Skipped duplicate signal received within 5 minutes.",
    };
  }

  // 2. Lookup matching trade for lifecycle update if applicable (prefer OPEN, fallback to recently updated trade created today)
  const candidateInstrument = draft.mappedInstrument || draft.instrument;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const matchWhere: any = {
    signalTime: { gte: todayStart },
  };

  if (draft.strike != null) {
    matchWhere.strike = draft.strike;
  }
  if (draft.optionType != null) {
    matchWhere.optionType = draft.optionType;
  }
  if (candidateInstrument) {
    matchWhere.instrument = candidateInstrument;
  }

  // First try finding an open signal
  let existingOpenSignal = (draft.isUpdate || draft.action !== "BUY") && (draft.strike != null || candidateInstrument)
    ? await prisma.signal.findFirst({
        where: { ...matchWhere, status: "OPEN" },
        orderBy: { signalTime: "desc" },
      })
    : null;

  // Fallback: If no OPEN signal found but this is a follow-up update/exit, match the most recent signal for this contract today
  if (!existingOpenSignal && (draft.isUpdate || draft.action === "EXIT" || draft.action === "UPDATE" || draft.action === "HOLD") && (draft.strike != null || candidateInstrument)) {
    existingOpenSignal = await prisma.signal.findFirst({
      where: matchWhere,
      orderBy: { signalTime: "desc" },
    });
  }

  // 3. Update Existing Trade
  if (existingOpenSignal) {
    let newStatus = existingOpenSignal.status;
    let sellPrice = existingOpenSignal.sellPrice;
    let closedTime = existingOpenSignal.closedTime;
    let updateNote = "";

    if (draft.updateType === "TARGET_HIT" || draft.status === "TARGET_HIT") {
      newStatus = "TARGET_HIT";
      sellPrice = draft.cmp ?? draft.target1 ?? existingOpenSignal.targets[0] ?? existingOpenSignal.entryPrice * 1.1;
      closedTime = new Date();
      updateNote = `Target Hit update — CMP: ${sellPrice}`;
    } else if (draft.updateType === "EXIT" || draft.action === "EXIT") {
      newStatus = "CLOSED_MANUAL";
      sellPrice = draft.cmp ?? draft.entryPrice ?? existingOpenSignal.entryPrice;
      closedTime = new Date();
      updateNote = `Exit call — CMP: ${sellPrice}`;
    } else if (draft.updateType === "AVERAGE_UPDATE" || draft.averagePrice != null) {
      updateNote = `Average price updated to ₹${draft.averagePrice}`;
    } else if (draft.updateType === "HOLD" || draft.action === "HOLD") {
      updateNote = `Hold till next update`;
    } else if (draft.cmp != null) {
      updateNote = `CMP update: ₹${draft.cmp}`;
    } else {
      updateNote = `Update received: ${draft.rawMessage}`;
    }

    const pnlPercent = sellPrice != null ? calcPnlPercent(existingOpenSignal.entryPrice, sellPrice) : null;

    const updated = await prisma.signal.update({
      where: { id: existingOpenSignal.id },
      data: {
        status: newStatus,
        sellPrice,
        pnlPercent,
        closedTime,
        priceAtSignal: draft.cmp ?? existingOpenSignal.priceAtSignal,
        adminNote: updateNote,
        silentUpdateAt: new Date(),
      },
    });

    await prisma.adminUpdate.create({
      data: {
        signalId: updated.id,
        strike: updated.strike,
        optionType: updated.optionType,
        instrument: updated.instrument,
        message: updateNote,
      },
    });

    if (sellPrice != null && newStatus !== "OPEN") {
      await sendTelegramMessage(
        formatSignalUpdateMessage({
          strike: updated.strike,
          optionType: updated.optionType,
          instrument: updated.instrument,
          sellPrice,
          pnlPercent: pnlPercent ?? 0,
          status: newStatus,
        })
      );
    }

    return {
      actionTaken: "UPDATED",
      signalId: updated.id,
      matchedSignalId: existingOpenSignal.id,
      message: `Updated existing open trade (${updated.id}) with: ${updateNote}`,
    };
  }

  // 4. Create New Signal if not an update or no open trade match found
  const strike = draft.strike ?? 0;
  const optionType = draft.optionType ?? "CE";
  const instrument = draft.mappedInstrument ?? "NIFTY";
  const entryPrice = draft.entryPrice ?? draft.entryLow ?? draft.cmp ?? 100;
  const stopLoss = draft.stopLoss ?? Math.round(entryPrice * 0.8 * 100) / 100;
  const targets = draft.targets.length > 0 ? draft.targets : draft.target1 ? [draft.target1] : [Math.round(entryPrice * 1.2 * 100) / 100];
  const priceAtSignal = draft.cmp ?? entryPrice;
  const expiry = expiryDate ? new Date(expiryDate) : new Date(Date.now() + 7 * 24 * 3600 * 1000);

  const status = deriveStatus({
    entryPrice,
    stopLoss,
    targets,
    sellPrice: draft.sellPrice,
  });

  // Snapshot lot size from DhanInstrument cache (best-effort -- null if
  // contract is not in today's cache or Dhan connect is not enabled).
  let lotSize: number | null = null;
  try {
    const contract = await resolveDhanContract({
      instrument: instrument as InstrumentLiteral,
      strike,
      optionType,
      expiry,
    });
    if (contract) lotSize = contract.lotSize;
  } catch {
    // Non-critical -- lot size is optional, digest shows "N/A" for rupee P&L
  }

  const created = await prisma.signal.create({
    data: {
      strike,
      optionType,
      instrument,
      entryPrice,
      stopLoss,
      targets,
      priceAtSignal,
      sellPrice: draft.sellPrice,
      rawMessage: draft.rawMessage,
      status,
      pnlPercent: draft.sellPrice != null ? calcPnlPercent(entryPrice, draft.sellPrice) : null,
      expiry,
      lotSize,
      entryLow: draft.entryLow,
      entryHigh: draft.entryHigh,
      target1: draft.target1 ?? targets[0],
      target2: draft.target2 ?? targets[1],
      contextTags: draft.context,
      confidence: draft.confidence,
      parserName: draft.parserName,
      parserVersion: draft.parserVersion,
    },
  });

  await prisma.adminUpdate.create({
    data: {
      signalId: created.id,
      strike: created.strike,
      optionType: created.optionType,
      instrument: created.instrument,
      message: `New ${draft.parserName} Signal — Entry ${entryPrice} | SL ${stopLoss} | Target ${targets.join(", ")}`,
    },
  });

  return {
    actionTaken: "CREATED",
    signalId: created.id,
    message: `Created new signal (${created.id})`,
  };
}
