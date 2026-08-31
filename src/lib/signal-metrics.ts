import type { OptionType, Signal, SignalStatus } from "@prisma/client";
import { INSTRUMENTS, INSTRUMENT_LABEL, formatInstrumentLabel, type InstrumentLiteral } from "@/lib/instruments";

export function calcPnlPercent(entryPrice: number, sellPrice: number): number {
  return ((sellPrice - entryPrice) / entryPrice) * 100;
}

export function calcPnlPoints(entryPrice: number, sellPrice: number): number {
  return sellPrice - entryPrice;
}

export function deriveStatus(input: {
  entryPrice: number;
  stopLoss: number;
  targets: number[];
  sellPrice: number | null | undefined;
}): SignalStatus {
  const { entryPrice, stopLoss, targets, sellPrice } = input;
  if (sellPrice == null) return "OPEN";

  const maxTarget = targets.length > 0 ? Math.max(...targets) : null;
  const minTarget = targets.length > 0 ? Math.min(...targets) : null;
  const isBuy = (maxTarget ?? entryPrice) >= entryPrice;

  // Hitting the NEAREST target in the profit direction counts as a target
  // hit — not just reaching the furthest one — so a T1-only exit (targets
  // like [120, 140], sold at 120) is correctly classified as TARGET_HIT
  // rather than falling through to CLOSED_MANUAL.
  if (minTarget != null && maxTarget != null) {
    const hitTarget = isBuy ? sellPrice >= minTarget : sellPrice <= maxTarget;
    if (hitTarget) return "TARGET_HIT";
  }

  const hitStopLoss = isBuy ? sellPrice <= stopLoss : sellPrice >= stopLoss;
  if (hitStopLoss) return "SL_HIT";

  return "CLOSED_MANUAL";
}

// Turns the 5-value SignalStatus enum into the more specific label shown
// in the "All Signals" tables (admin Manage Signals + subscriber Trade
// Log): TARGET_HIT becomes "T1 Hit"/"T2 Hit" (via inferHitTargetLabel)
// instead of a flat "Target Hit" whenever there's more than one target to
// disambiguate, and CLOSED_MANUAL becomes "Partial Profit" when the exit
// was still in profit (didn't reach a full target, but wasn't a loss
// either) instead of a flat "Closed" that hid that distinction.
export function computeDisplayStatus(input: {
  status: SignalStatus;
  targets: number[];
  sellPrice: number | null | undefined;
  pnlPercent: number | null | undefined;
}): string {
  const { status, targets, sellPrice, pnlPercent } = input;
  switch (status) {
    case "OPEN":
      return "Open*";
    case "SL_HIT":
      return "SL Hit";
    case "EXPIRED":
      return "Expired";
    case "TARGET_HIT": {
      const targetLabel = sellPrice != null ? inferHitTargetLabel(targets, sellPrice) : null;
      return targetLabel ? `${targetLabel} Hit` : "Target Hit";
    }
    case "CLOSED_MANUAL":
      return pnlPercent != null && pnlPercent > 0 ? "Partial Profit" : "Closed";
    default:
      return status;
  }
}

// There's no stored "which target" field — targets are entered in order
// (T1, T2, ...) so this infers the label positionally by finding the
// closest target to the actual sell price. Best-effort, not authoritative.
export function inferHitTargetLabel(targets: number[], sellPrice: number): string | null {
  if (targets.length <= 1) return null;

  let closestIndex = 0;
  let closestDiff = Math.abs(targets[0] - sellPrice);
  for (let i = 1; i < targets.length; i++) {
    const diff = Math.abs(targets[i] - sellPrice);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestIndex = i;
    }
  }
  return `T${closestIndex + 1}`;
}

export type SignalForMetrics = Pick<
  Signal,
  | "id"
  | "optionType"
  | "instrument"
  | "stockSymbol"
  | "entryPrice"
  | "sellPrice"
  | "pnlPercent"
  | "status"
  | "signalTime"
>;

export interface DashboardMetrics {
  totalSignals: number;
  closedSignals: number;
  winRate: number;
  totalCapturePercent: number;
  avgPercentPerTrade: number;
  bestTradePercent: number | null;
  worstTradePercent: number | null;
  ceCount: number;
  peCount: number;
  ceWinRate: number;
  peWinRate: number;
  cumulativeSeries: { date: string; cumulativePercent: number }[];
  winLossByDay: {
    date: string;
    profitPercent: number;
    lossPercent: number;
    netPercent: number;
  }[];
  winCount: number;
  lossCount: number;
  totalGainPercent: number;
  totalLossPercent: number;
  instrumentCapture: { instrument: InstrumentLiteral; label: string; capturePercent: number }[];
}

function winRateOf(signals: SignalForMetrics[]): number {
  const closed = signals.filter((s) => s.pnlPercent != null);
  if (closed.length === 0) return 0;
  const wins = closed.filter((s) => (s.pnlPercent ?? 0) > 0).length;
  return (wins / closed.length) * 100;
}

export function computeDashboardMetrics(signals: SignalForMetrics[]): DashboardMetrics {
  const closed = signals.filter((s) => s.pnlPercent != null);
  const ce = signals.filter((s) => s.optionType === ("CE" as OptionType));
  const pe = signals.filter((s) => s.optionType === ("PE" as OptionType));

  const instrumentCapture = INSTRUMENTS.map((instrument) => ({
    instrument,
    label: INSTRUMENT_LABEL[instrument],
    capturePercent: closed
      .filter((s) => s.instrument === instrument)
      .reduce((sum, s) => sum + (s.pnlPercent ?? 0), 0),
  }));

  const totalCapturePercent = closed.reduce((sum, s) => sum + (s.pnlPercent ?? 0), 0);
  const avgPercentPerTrade = closed.length > 0 ? totalCapturePercent / closed.length : 0;

  const percents = closed.map((s) => s.pnlPercent ?? 0);
  const bestTradePercent = percents.length > 0 ? Math.max(...percents) : null;
  const worstTradePercent = percents.length > 0 ? Math.min(...percents) : null;
  const winCount = closed.filter((s) => (s.pnlPercent ?? 0) > 0).length;
  const lossCount = closed.length - winCount;
  const totalGainPercent = percents.filter((p) => p > 0).reduce((sum, p) => sum + p, 0);
  const totalLossPercent = percents.filter((p) => p <= 0).reduce((sum, p) => sum + p, 0);

  const sortedClosed = [...closed].sort(
    (a, b) => new Date(a.signalTime).getTime() - new Date(b.signalTime).getTime(),
  );

  let running = 0;
  const cumulativeSeries = sortedClosed.map((s) => {
    running += s.pnlPercent ?? 0;
    return {
      date: new Date(s.signalTime).toISOString().slice(0, 10),
      cumulativePercent: Math.round(running * 100) / 100,
    };
  });

  const byDay = new Map<string, { profitPercent: number; lossPercent: number }>();
  for (const s of sortedClosed) {
    const day = new Date(s.signalTime).toISOString().slice(0, 10);
    const entry = byDay.get(day) ?? { profitPercent: 0, lossPercent: 0 };
    const pnl = s.pnlPercent ?? 0;
    if (pnl > 0) entry.profitPercent += pnl;
    else entry.lossPercent += pnl;
    byDay.set(day, entry);
  }
  const winLossByDay = Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => {
      const profitPercent = Math.round(v.profitPercent * 100) / 100;
      const lossPercent = Math.round(v.lossPercent * 100) / 100;
      return {
        date,
        profitPercent,
        lossPercent,
        netPercent: Math.round((profitPercent + lossPercent) * 100) / 100,
      };
    });

  return {
    totalSignals: signals.length,
    closedSignals: closed.length,
    winRate: winRateOf(signals),
    totalCapturePercent,
    avgPercentPerTrade,
    bestTradePercent,
    worstTradePercent,
    ceCount: ce.length,
    peCount: pe.length,
    ceWinRate: winRateOf(ce),
    peWinRate: winRateOf(pe),
    instrumentCapture,
    cumulativeSeries,
    winLossByDay,
    winCount,
    lossCount,
    totalGainPercent,
    totalLossPercent,
  };
}

export function computeBestWorstTrades<
  T extends Pick<Signal, "strike" | "optionType" | "instrument" | "stockSymbol" | "pnlPercent" | "signalTime"> & {
    expiry?: Date | string | null;
  },
>(signals: T[], n = 5) {
  const closed = signals.filter((s) => s.pnlPercent != null);
  return [...closed]
    .sort((a, b) => (b.pnlPercent ?? 0) - (a.pnlPercent ?? 0))
    .filter((_, i, arr) => i < n || i >= arr.length - n)
    .map((s) => {
      const d = new Date(s.signalTime);
      const day = String(d.getDate()).padStart(2, "0");
      const month = d.toLocaleDateString("en-IN", { month: "short" });
      const inst = formatInstrumentLabel(s.instrument, s.stockSymbol);
      const strikeStr = s.strike ? `${s.strike} ` : "";
      const optStr = s.optionType ? `${s.optionType} ` : "";
      return {
        label: `${inst} ${strikeStr}${optStr}${day}${month}`.trim(),
        pnlPercent: Math.round((s.pnlPercent ?? 0) * 100) / 100,
        instrument: inst,
        strike: s.strike,
        optionType: s.optionType,
        dateStr: `${day} ${month}`,
      };
    });
}

export function getRecentSignals<T extends Pick<Signal, "signalTime">>(
  signals: T[],
  n = 6,
): T[] {
  return [...signals]
    .sort((a, b) => new Date(b.signalTime).getTime() - new Date(a.signalTime).getTime())
    .slice(0, n);
}
