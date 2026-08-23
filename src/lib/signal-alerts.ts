"use server";

/**
 * Polling data source for live signal alerts (notification-bell / sound
 * alerts). Replaces the Supabase Realtime "postgres_changes" subscription
 * on the Signal table — see src/components/site/sound-alert-provider.tsx,
 * which polls this on an interval and diffs against what it saw last time
 * to infer inserts vs. status-changing updates.
 */
import { prisma } from "@/lib/prisma";
import type { InstrumentLiteral } from "@/lib/instruments";

const LOOKBACK_MS = 30 * 60 * 1000; // 30 minutes
const MAX_ROWS = 100;

export interface SignalAlertRow {
  id: string;
  strike: number;
  optionType: string;
  instrument: InstrumentLiteral | null;
  status: string;
  closedTime: string | null;
  sellPrice: number | null;
  pnlPercent: number | null;
  targets: number[];
  silentUpdateAt: string | null;
  updatedAt: string;
}

export async function getRecentSignalAlerts(): Promise<SignalAlertRow[]> {
  const since = new Date(Date.now() - LOOKBACK_MS);

  const rows = await prisma.signal.findMany({
    where: { updatedAt: { gt: since } },
    orderBy: { updatedAt: "asc" },
    take: MAX_ROWS,
  });

  return rows.map((r) => ({
    id: r.id,
    strike: r.strike,
    optionType: r.optionType,
    instrument: r.instrument,
    status: r.status,
    closedTime: r.closedTime ? r.closedTime.toISOString() : null,
    sellPrice: r.sellPrice,
    pnlPercent: r.pnlPercent,
    targets: r.targets,
    silentUpdateAt: r.silentUpdateAt ? r.silentUpdateAt.toISOString() : null,
    updatedAt: r.updatedAt.toISOString(),
  }));
}
