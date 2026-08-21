"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  computeBoundaries,
  matchesDateFilter,
  PRESETS,
  type SignalsDateFilter,
} from "@/lib/date-filter";
import {
  computeBestWorstTrades,
  computeDashboardMetrics,
  getRecentSignals,
  type SignalForMetrics,
} from "@/lib/signal-metrics";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import type { InstrumentLiteral } from "@/lib/instruments";

export type SerializedSignal = Omit<SignalForMetrics, "signalTime"> & {
  strike: number;
  signalTime: string;
};

export function DashboardView({
  signals,
  initialFilter,
  instrument,
  referralLink,
  referralToken,
}: {
  signals: SerializedSignal[];
  initialFilter: SignalsDateFilter;
  instrument?: string;
  referralLink?: string;
  referralToken?: string | null;
}) {
  const pathname = usePathname();
  const [dateFilter, setDateFilter] = useState<SignalsDateFilter>(initialFilter);
  const boundaries = useMemo(() => computeBoundaries(), []);

  function handleDateFilterChange(next: SignalsDateFilter) {
    setDateFilter(next);

    const params = new URLSearchParams(window.location.search);
    if (next.range === "all") {
      params.delete("range");
      params.delete("from");
      params.delete("to");
    } else {
      params.set("range", next.range);
      if (next.range === "custom") {
        if (next.from) params.set("from", next.from);
        else params.delete("from");
        if (next.to) params.set("to", next.to);
        else params.delete("to");
      } else {
        params.delete("from");
        params.delete("to");
      }
    }
    const query = params.toString();
    window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
  }

  // Filter signals by instrument AND date range
  const filteredSignals = useMemo(() => {
    let list = signals;

    if (instrument && instrument !== "ALL") {
      list = list.filter((s) => s.instrument === (instrument as InstrumentLiteral));
    }

    list = list.filter((s) => matchesDateFilter(s.signalTime, dateFilter, boundaries));

    return list.map((s) => ({
      ...s,
      signalTime: new Date(s.signalTime),
    }));
  }, [signals, instrument, dateFilter, boundaries]);

  const metrics = useMemo(() => computeDashboardMetrics(filteredSignals), [filteredSignals]);
  const bestWorst = useMemo(() => computeBestWorstTrades(filteredSignals), [filteredSignals]);
  const recentSignals = useMemo(() => getRecentSignals(filteredSignals), [filteredSignals]);

  const presetLabel = PRESETS.find((p) => p.value === dateFilter.range)?.label || "All Time";
  const rangeLabel =
    dateFilter.range === "custom" && dateFilter.from && dateFilter.to
      ? `${dateFilter.from} to ${dateFilter.to}`
      : presetLabel;

  return (
    <DashboardContent
      metrics={metrics}
      bestWorst={bestWorst}
      recentSignals={recentSignals}
      dateFilter={dateFilter}
      onDateFilterChange={handleDateFilterChange}
      rangeLabel={rangeLabel}
      referralLink={referralLink}
      referralToken={referralToken}
    />
  );
}
