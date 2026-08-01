"use server";

import { requireSubscriber } from "@/lib/subscriber-auth";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/broker/crypto";
import { resolveDhanContract } from "@/lib/broker/dhan-contract-resolver";
import { placeDhanOrder } from "@/lib/broker/dhan-client";
import { INSTRUMENT_LABEL, type InstrumentLiteral } from "@/lib/instruments";

export type SignalBrokerStatus = "NOT_CONNECTED" | "EXPIRED" | "REVOKED" | "ACTIVE";

export interface SignalOrderContext {
  brokerStatus: SignalBrokerStatus;
  signal: {
    id: string;
    instrument: InstrumentLiteral | null;
    strike: number;
    optionType: "CE" | "PE";
    entryPrice: number;
    stopLoss: number;
    targets: number[];
    actionable: boolean; // OPEN and has instrument+expiry set (resolvable)
  } | null;
}

// Called by the notification panel to decide, per signal, whether to show
// the inline order form, a "Connect now" CTA, or nothing at all.
export async function getSignalOrderContext(signalId: string): Promise<SignalOrderContext> {
  const subscriber = await requireSubscriber();

  const [connection, signal] = await Promise.all([
    prisma.brokerConnection.findUnique({
      where: { subscriberId: subscriber.id },
      select: { status: true },
    }),
    prisma.signal.findUnique({
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
        expiry: true,
      },
    }),
  ]);

  return {
    brokerStatus: connection?.status ?? "NOT_CONNECTED",
    signal: signal
      ? {
          id: signal.id,
          instrument: signal.instrument,
          strike: signal.strike,
          optionType: signal.optionType,
          entryPrice: signal.entryPrice,
          stopLoss: signal.stopLoss,
          targets: signal.targets,
          actionable: signal.status === "OPEN" && signal.instrument != null && signal.expiry != null,
        }
      : null,
  };
}

export interface PlaceOrderResult {
  success: boolean;
  message?: string;
  error?: string;
}

export async function placeOrderForSignal(signalId: string, lotSize: number): Promise<PlaceOrderResult> {
  const subscriber = await requireSubscriber();

  if (!Number.isInteger(lotSize) || lotSize <= 0) {
    return { success: false, error: "Enter a valid number of lots." };
  }

  const connection = await prisma.brokerConnection.findUnique({
    where: { subscriberId: subscriber.id },
  });
  if (!connection || connection.status !== "ACTIVE") {
    return { success: false, error: "Connect your broker before placing an order." };
  }

  const signal = await prisma.signal.findUnique({ where: { id: signalId } });
  if (!signal || signal.status !== "OPEN") {
    return { success: false, error: "This trade is no longer open." };
  }
  if (!signal.instrument || !signal.expiry) {
    return { success: false, error: "This signal is missing instrument/expiry — contact support." };
  }

  const contract = await resolveDhanContract({
    instrument: signal.instrument,
    strike: signal.strike,
    optionType: signal.optionType,
    expiry: signal.expiry,
  });

  if (!contract) {
    return {
      success: false,
      error: "Couldn't find a matching Dhan contract for this trade — contact support.",
    };
  }

  const label = `${INSTRUMENT_LABEL[signal.instrument]} ${signal.strike} ${signal.optionType}`;
  const quantity = lotSize * contract.lotSize;

  try {
    const result = await placeDhanOrder({
      accessToken: decryptSecret(connection.accessTokenEnc),
      dhanClientId: connection.dhanClientId,
      transactionType: "BUY",
      exchangeSegment: contract.exchangeSegment as "NSE_FNO" | "BSE_FNO",
      productType: "INTRADAY",
      orderType: "MARKET",
      validity: "DAY",
      securityId: contract.securityId,
      quantity,
      price: 0,
      correlationId: signal.id.slice(0, 30),
    });

    const dhanOrderId =
      result.data && typeof result.data === "object" && "orderId" in result.data
        ? String((result.data as { orderId: unknown }).orderId)
        : null;

    await prisma.orderAuditLog.create({
      data: {
        signalId: signal.id,
        instrument: signal.instrument,
        strike: signal.strike,
        optionType: signal.optionType,
        subscriberId: subscriber.id,
        brokerConnectionId: connection.id,
        lotSize,
        dhanOrderId,
        status: result.ok && dhanOrderId ? "PLACED" : "REJECTED",
        dhanResponse: result.data ?? undefined,
        errorMessage: result.ok ? null : result.rawBody.slice(0, 500),
      },
    });

    if (!result.ok || !dhanOrderId) {
      return { success: false, error: `Dhan rejected the order: ${result.rawBody.slice(0, 200)}` };
    }

    return { success: true, message: `Order placed — ${label} x${lotSize} lot${lotSize === 1 ? "" : "s"}.` };
  } catch (error) {
    await prisma.orderAuditLog.create({
      data: {
        signalId: signal.id,
        instrument: signal.instrument,
        strike: signal.strike,
        optionType: signal.optionType,
        subscriberId: subscriber.id,
        brokerConnectionId: connection.id,
        lotSize,
        status: "ERROR",
        errorMessage: error instanceof Error ? error.message : "Unknown error placing order.",
      },
    });
    return { success: false, error: "Couldn't reach Dhan to place the order. Try again shortly." };
  }
}
