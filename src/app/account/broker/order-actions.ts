"use server";

import { requireSubscriber } from "@/lib/subscriber-auth";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/broker/crypto";
import { resolveDhanContract } from "@/lib/broker/dhan-contract-resolver";
import { placeDhanOrder, getDhanFundLimit } from "@/lib/broker/dhan-client";
import { formatInstrumentLabel, type InstrumentValue } from "@/lib/instruments";
import { clientConfig } from "@/lib/client-config";

export type SignalBrokerStatus = "NOT_CONNECTED" | "EXPIRED" | "REVOKED" | "ACTIVE";
export type DhanProductType = "INTRADAY" | "MARGIN";

export interface SignalOrderContext {
  brokerStatus: SignalBrokerStatus;
  signal: {
    id: string;
    instrument: InstrumentValue | null;
    strike: number;
    optionType: "CE" | "PE";
    entryPrice: number;
    stopLoss: number;
    targets: number[];
    actionable: boolean; // OPEN, has instrument+expiry set, and isn't a stock signal (resolvable)
  } | null;
}

// Called by the notification panel to decide, per signal, whether to show
// the inline order form, a "Connect now" CTA, or nothing at all.
export async function getSignalOrderContext(signalId: string): Promise<SignalOrderContext> {
  if (!clientConfig.dhanConnectEnabled) {
    return { brokerStatus: "NOT_CONNECTED", signal: null };
  }

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
          // Broker order placement doesn't cover individual-stock signals
          // yet — resolveDhanContract always misses for those (the
          // DhanInstrument cache only syncs index/OPTIDX contracts).
          actionable:
            signal.status === "OPEN" &&
            signal.instrument != null &&
            signal.instrument !== "STOCK" &&
            signal.expiry != null,
        }
      : null,
  };
}

export interface OrderExpansionDetails {
  brokerStatus: SignalBrokerStatus;
  entryPrice: number;
  lotSize: number | null;
  contractError: string | null;
  // Best-effort — null if not connected or the /v2/fundlimit call failed.
  availableBalance: number | null;
}

// Called only once a signal's order panel is actually expanded (not for
// every visible row) — this is the heavier lookup (contract resolution +
// a real call to Dhan's /v2/fundlimit), unlike the lightweight
// getSignalOrderContext check above.
export async function getOrderExpansionDetails(signalId: string): Promise<OrderExpansionDetails> {
  if (!clientConfig.dhanConnectEnabled) {
    return {
      brokerStatus: "NOT_CONNECTED",
      entryPrice: 0,
      lotSize: null,
      contractError: "Broker connect isn't available on this platform.",
      availableBalance: null,
    };
  }

  const subscriber = await requireSubscriber();

  const [connection, signal] = await Promise.all([
    prisma.brokerConnection.findUnique({ where: { subscriberId: subscriber.id } }),
    prisma.signal.findUnique({ where: { id: signalId } }),
  ]);

  if (!signal) {
    return {
      brokerStatus: connection?.status ?? "NOT_CONNECTED",
      entryPrice: 0,
      lotSize: null,
      contractError: "Signal not found.",
      availableBalance: null,
    };
  }

  let lotSize: number | null = null;
  let contractError: string | null = null;
  let availableBalance: number | null = null;

  if (connection?.status === "ACTIVE") {
    if (!signal.instrument || !signal.expiry) {
      contractError = "This signal is missing instrument/expiry — contact support.";
    } else if (signal.instrument === "STOCK") {
      contractError = "Broker order placement isn't available for stock signals yet.";
    } else {
      const contract = await resolveDhanContract({
        instrument: signal.instrument,
        strike: signal.strike,
        optionType: signal.optionType,
        expiry: signal.expiry,
      });
      if (!contract) {
        contractError = "Couldn't find a matching Dhan contract for this trade — contact support.";
      } else {
        lotSize = contract.lotSize;
      }
    }

    try {
      const accessToken = decryptSecret(connection.accessTokenEnc);
      const fund = await getDhanFundLimit({ accessToken });
      if (fund.ok && fund.data) {
        availableBalance = fund.data.availabelBalance;
      }
    } catch {
      // Best-effort only — leave availableBalance as null ("—") on failure.
    }
  }

  return {
    brokerStatus: connection?.status ?? "NOT_CONNECTED",
    entryPrice: signal.entryPrice,
    lotSize,
    contractError,
    availableBalance,
  };
}

export interface PlaceOrderResult {
  success: boolean;
  message?: string;
  error?: string;
}

export async function placeOrderForSignal(
  signalId: string,
  lotSize: number,
  productType: DhanProductType = "INTRADAY",
): Promise<PlaceOrderResult> {
  if (!clientConfig.dhanConnectEnabled) {
    return { success: false, error: "Broker connect isn't available on this platform." };
  }

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
  if (signal.instrument === "STOCK") {
    return { success: false, error: "Broker order placement isn't available for stock signals yet." };
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

  const label = `${formatInstrumentLabel(signal.instrument, signal.stockSymbol)} ${signal.strike} ${signal.optionType}`;
  const quantity = lotSize * contract.lotSize;

  try {
    const result = await placeDhanOrder({
      accessToken: decryptSecret(connection.accessTokenEnc),
      dhanClientId: connection.dhanClientId,
      transactionType: "BUY",
      exchangeSegment: contract.exchangeSegment as "NSE_FNO" | "BSE_FNO",
      productType,
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
        productType,
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
        productType,
        status: "ERROR",
        errorMessage: error instanceof Error ? error.message : "Unknown error placing order.",
      },
    });
    return { success: false, error: "Couldn't reach Dhan to place the order. Try again shortly." };
  }
}
