import { prisma } from "@/lib/prisma";
import { calcPnlPoints } from "@/lib/signal-metrics";
import { formatInstrumentLabel } from "@/lib/instruments";
import type { Signal } from "@prisma/client";

// IST is fixed at UTC+5:30 year-round (no DST).
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/**
 * Returns the IST week boundary (Monday 00:00 IST to Sunday 23:59:59.999 IST)
 * for the week containing the given reference date. For the cron (which fires
 * Sunday morning IST), this returns the just-ending week.
 */
export function getISTWeekBoundary(referenceDate: Date): {
  weekStart: Date;
  weekEnd: Date;
} {
  // Convert reference date to IST by adding the offset
  const istTime = new Date(referenceDate.getTime() + IST_OFFSET_MS);

  // Get IST day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const istDay = istTime.getUTCDay();

  // Calculate days since Monday (Monday = 0, ..., Sunday = 6)
  const daysSinceMonday = istDay === 0 ? 6 : istDay - 1;

  // Monday 00:00:00.000 IST = Monday 00:00 IST - 5:30 = previous Sunday 18:30 UTC
  const istMidnight = new Date(
    Date.UTC(
      istTime.getUTCFullYear(),
      istTime.getUTCMonth(),
      istTime.getUTCDate(),
      0, 0, 0, 0,
    ),
  );
  const mondayIST = new Date(istMidnight.getTime() - daysSinceMonday * 24 * 60 * 60 * 1000);
  // Convert IST midnight back to UTC
  const weekStart = new Date(mondayIST.getTime() - IST_OFFSET_MS);

  // Sunday 23:59:59.999 IST = 6 days + 23:59:59.999 after Monday 00:00 IST
  const weekEnd = new Date(
    weekStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1,
  );

  return { weekStart, weekEnd };
}

/**
 * Returns subscribers eligible for the weekly digest:
 * - has an email address
 * - has not opted out (emailDigestOptOut = false)
 * - plan is PREMIUM
 */
export async function getDigestRecipients() {
  return prisma.subscriber.findMany({
    where: {
      email: { not: null },
      emailDigestOptOut: false,
      plan: "PREMIUM",
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });
}

// Terminal statuses that count as "closed" for digest purposes.
const TERMINAL_STATUSES = [
  "TARGET_HIT",
  "SL_HIT",
  "CLOSED_MANUAL",
  "EXPIRED",
] as const;

/**
 * Returns signals in a terminal status that were closed within the given
 * week boundary.
 */
export async function getWeeklySignals(weekStart: Date, weekEnd: Date) {
  return prisma.signal.findMany({
    where: {
      status: { in: [...TERMINAL_STATUSES] },
      closedTime: {
        gte: weekStart,
        lte: weekEnd,
      },
    },
    orderBy: { closedTime: "asc" },
  });
}

export interface DigestSignalRow {
  id: string;
  instrument: string;
  strike: number;
  optionType: string;
  entryPrice: number;
  sellPrice: number;
  pnlPoints: number;
  pnlRupees: number | null;
  lotSize: number | null;
  status: string;
}

export interface DigestMetrics {
  signalCount: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  totalPnlPoints: number;
  totalPnlRupees: number | null;
  bestTrade: DigestSignalRow | null;
  worstTrade: DigestSignalRow | null;
  signals: DigestSignalRow[];
}

/**
 * Computes digest metrics from a set of closed signals.
 */
export function computeDigestMetrics(signals: Signal[]): DigestMetrics {
  const rows: DigestSignalRow[] = signals
    .filter((s) => s.sellPrice != null)
    .map((s) => {
      const pnlPoints = calcPnlPoints(s.entryPrice, s.sellPrice!);
      const pnlRupees =
        s.lotSize != null ? pnlPoints * s.lotSize : null;
      return {
        id: s.id,
        instrument: formatInstrumentLabel(s.instrument, s.stockSymbol) || "Unknown",
        strike: s.strike,
        optionType: s.optionType,
        entryPrice: s.entryPrice,
        sellPrice: s.sellPrice!,
        pnlPoints,
        pnlRupees,
        lotSize: s.lotSize,
        status: s.status,
      };
    });

  const winCount = rows.filter((r) => r.pnlPoints > 0).length;
  const lossCount = rows.length - winCount;
  const winRate = rows.length > 0 ? (winCount / rows.length) * 100 : 0;
  const totalPnlPoints = rows.reduce((sum, r) => sum + r.pnlPoints, 0);

  // Total rupee P&L: only if at least one signal has lotSize
  const rupeePnlRows = rows.filter((r) => r.pnlRupees != null);
  const totalPnlRupees =
    rupeePnlRows.length > 0
      ? rupeePnlRows.reduce((sum, r) => sum + r.pnlRupees!, 0)
      : null;

  // Best = highest pnlPoints, worst = lowest pnlPoints
  let bestTrade: DigestSignalRow | null = null;
  let worstTrade: DigestSignalRow | null = null;
  for (const row of rows) {
    if (!bestTrade || row.pnlPoints > bestTrade.pnlPoints) bestTrade = row;
    if (!worstTrade || row.pnlPoints < worstTrade.pnlPoints) worstTrade = row;
  }

  return {
    signalCount: rows.length,
    winCount,
    lossCount,
    winRate,
    totalPnlPoints,
    totalPnlRupees,
    bestTrade,
    worstTrade,
    signals: rows,
  };
}

/**
 * Checks if a digest has already been sent for this subscriber + week.
 */
export async function hasAlreadySent(
  subscriberId: string,
  weekStartDate: Date,
): Promise<boolean> {
  const existing = await prisma.digestSendLog.findUnique({
    where: {
      subscriberId_weekStartDate: {
        subscriberId,
        weekStartDate,
      },
    },
  });
  return existing != null;
}

/**
 * Records a digest send in the log (dedup + audit).
 */
export async function logDigestSend(params: {
  subscriberId: string;
  subscriberEmail: string;
  weekStartDate: Date;
  signalCount: number;
  winRate: number;
  totalPnlPoints: number;
  totalPnlRupees: number | null;
}) {
  await prisma.digestSendLog.create({
    data: {
      subscriberId: params.subscriberId,
      subscriberEmail: params.subscriberEmail,
      weekStartDate: params.weekStartDate,
      signalCount: params.signalCount,
      winRate: params.winRate,
      totalPnlPoints: params.totalPnlPoints,
      totalPnlRupees: params.totalPnlRupees,
    },
  });
}
