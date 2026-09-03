"use server";

import { requireSubscriber } from "@/lib/subscriber-auth";
import { prisma } from "@/lib/prisma";
import { getActiveBroker } from "@/lib/app-settings";
import type { InstrumentValue } from "@/lib/instruments";

// Goodwill's own "Place Order" flow — Goodwill's broker is GIGAPRO, not
// Dhan, and GIGAPRO's order API isn't integrated yet. These actions never
// touch BrokerConnection, resolveDhanContract, or placeDhanOrder; they only
// check the signal itself and (on submit) log a request for the ops team.

export type GoodwillProductType = "INTRADAY" | "MARGIN";

export interface GoodwillOrderContext {
  signal: {
    id: string;
    instrument: InstrumentValue | null;
    strike: number;
    optionType: "CE" | "PE";
    entryPrice: number;
    stopLoss: number;
    targets: number[];
    actionable: boolean; // OPEN and has an instrument set
  } | null;
}

// Mirrors getSignalOrderContext's shape for the shared PlaceOrderTrigger,
// minus any broker-connection check — Goodwill has no personal-token
// connect step, so the button is actionable purely off the signal itself.
export async function getGoodwillOrderContext(signalId: string): Promise<GoodwillOrderContext> {
  const activeBroker = await getActiveBroker();
  if (activeBroker !== "goodwill") {
    return { signal: null };
  }

  await requireSubscriber();

  const signal = await prisma.signal.findUnique({
    where: { id: signalId },
    select: {
      id: true,
      instrument: true,
      strike: true,
      optionType: true,
      entryPrice: true,
      stopLoss: true,
      targets: true,
      status: true,
    },
  });

  return {
    signal: signal
      ? {
          id: signal.id,
          instrument: signal.instrument,
          strike: signal.strike,
          optionType: signal.optionType,
          entryPrice: signal.entryPrice,
          stopLoss: signal.stopLoss,
          targets: signal.targets,
          actionable: signal.status === "OPEN" && signal.instrument != null,
        }
      : null,
  };
}

export interface GoodwillOrderExpansionDetails {
  entryPrice: number;
  // Fixed at 1 (quantity == lots entered) — GIGAPRO contract/lot-size
  // resolution isn't built yet, unlike Dhan's DhanInstrument-backed lookup.
  lotSize: number;
  contractError: string | null;
}

export async function getGoodwillOrderExpansionDetails(
  signalId: string,
): Promise<GoodwillOrderExpansionDetails> {
  const activeBroker = await getActiveBroker();
  if (activeBroker !== "goodwill") {
    return {
      entryPrice: 0,
      lotSize: 1,
      contractError: "Order requests aren't available on this platform.",
    };
  }

  await requireSubscriber();

  const signal = await prisma.signal.findUnique({ where: { id: signalId } });

  if (!signal) {
    return { entryPrice: 0, lotSize: 1, contractError: "Signal not found." };
  }

  return { entryPrice: signal.entryPrice, lotSize: 1, contractError: null };
}

export interface GoodwillOrderRequestResult {
  success: boolean;
  message?: string;
  error?: string;
}

// Placeholder submit action — per the OTP-confirmation-first rollout plan,
// this just logs the request for the ops team rather than calling a real
// GIGAPRO order API (which doesn't exist yet).
export async function requestGoodwillOrderConfirmation(
  signalId: string,
  lots: number,
  productType: GoodwillProductType = "INTRADAY",
): Promise<GoodwillOrderRequestResult> {
  const activeBroker = await getActiveBroker();
  if (activeBroker !== "goodwill") {
    return { success: false, error: "Order requests aren't available on this platform." };
  }

  const subscriber = await requireSubscriber();

  if (!Number.isInteger(lots) || lots <= 0) {
    return { success: false, error: "Enter a valid number of lots." };
  }

  const signal = await prisma.signal.findUnique({ where: { id: signalId } });
  if (!signal || signal.status !== "OPEN") {
    return { success: false, error: "This trade is no longer open." };
  }

  await prisma.goodwillOrderRequest.create({
    data: {
      signalId: signal.id,
      instrument: signal.instrument,
      strike: signal.strike,
      optionType: signal.optionType,
      subscriberId: subscriber.id,
      lotSize: lots,
      productType,
    },
  });

  return {
    success: true,
    message: "Order request received — our team will process this trade for you.",
  };
}
