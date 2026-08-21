"use client";

import { useRef, useState } from "react";
import { Share2 } from "lucide-react";
import { KpiCard } from "@/components/admin/kpi-card";
import { SliderStat } from "@/components/admin/slider-stat";
import { SectionNumber } from "@/components/admin/section-number";
import { RecentSignalsList, type RecentSignalItem } from "@/components/admin/recent-signals-list";
import {
  BestWorstBarChart,
  CumulativeLineChart,
  InstrumentCaptureDonutChart,
  WinLossBarChart,
  WinRateDonutChart,
} from "@/components/admin/dashboard-charts";
import type { DashboardMetrics } from "@/lib/signal-metrics";
import { cn, getClientJoinUrl } from "@/lib/utils";
import { clientConfig } from "@/lib/client-config";
import { DateFilterChips } from "@/components/signals/date-filter-chips";
import type { SignalsDateFilter } from "@/lib/date-filter";
import { Button } from "@/components/ui/button";
import { DashboardShareModal } from "@/components/dashboard/dashboard-share-modal";

export function DashboardContent({
  metrics,
  bestWorst,
  recentSignals,
  dateFilter,
  onDateFilterChange,
  rangeLabel = "All Time",
  referralLink,
  referralToken,
}: {
  metrics: DashboardMetrics;
  bestWorst: {
    label: string;
    pnlPercent: number;
    instrument?: string;
    strike?: number;
    optionType?: string;
    dateStr?: string;
  }[];
  recentSignals: RecentSignalItem[];
  dateFilter?: SignalsDateFilter;
  onDateFilterChange?: (next: SignalsDateFilter) => void;
  rangeLabel?: string;
  referralLink?: string;
  referralToken?: string | null;
}) {
  const [shareOpen, setShareOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pct = (n: number) => `${n.toFixed(1)}%`;
  const joinUrl = getClientJoinUrl(referralToken);

  return (
    <div className="flex flex-col gap-8">
      {dateFilter && onDateFilterChange && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <DateFilterChips filter={dateFilter} onFilterChange={onDateFilterChange} />
          <Button
            size="sm"
            variant="outline"
            className="signalflow-glow h-9 gap-1.5 self-start sm:self-auto"
            onClick={() => setShareOpen(true)}
          >
            <Share2 className="h-4 w-4 text-primary" />
            Share Performance
          </Button>
        </div>
      )}

      <DashboardShareModal
        open={shareOpen}
        onOpenChange={setShareOpen}
        metrics={metrics}
        bestWorst={bestWorst}
        rangeLabel={rangeLabel}
        referralToken={referralToken}
        referralLink={referralLink}
        containerRef={containerRef}
      />

      {/* SNAPSHOT DOM CONTAINER (SECTIONS 01 - 05 + JOIN BANNER) */}
      <div
        ref={containerRef}
        id="dashboard-snapshot-container"
        className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-[#090a0f] p-6 shadow-2xl"
      >
        {/* SNAPSHOT HEADER BRANDING BANNER */}
        <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {clientConfig.logoSrc && (
              <img
                src={clientConfig.logoSrc}
                alt={clientConfig.logoAlt}
                className="h-10 w-10 rounded-xl object-contain border border-white/10 bg-black/40 p-1"
              />
            )}
            <div>
              <h1 className="font-heading text-lg font-bold tracking-tight text-foreground uppercase">
                {clientConfig.siteName}
              </h1>
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Performance Dashboard Snapshot
              </p>
            </div>
          </div>
          <div className="self-start sm:self-auto">
            <span className="inline-flex items-center rounded-full border border-primary/40 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
              Range: {rangeLabel}
            </span>
          </div>
        </div>

        {/* 01 Cumulative % */}
        <div className="signalflow-glass signalflow-gold-border relative rounded-2xl p-6">
          <div className="mb-4 flex items-center gap-2">
            <SectionNumber n={1} />
            <h2 className="font-heading text-sm font-semibold">Cumulative %</h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-3 lg:items-stretch">
            <div className="grid gap-6 sm:grid-cols-[minmax(160px,220px)_1fr] sm:items-center lg:col-span-2">
              <div className="signalflow-glow relative overflow-hidden rounded-xl border border-white/5 bg-black/20 p-5 text-center sm:text-left">
                <span
                  className="absolute inset-x-0 top-0 h-[3px]"
                  style={{ backgroundImage: "var(--signalflow-gold-gradient)" }}
                />
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Total % Won this Batch
                </p>
                <p
                  className={cn(
                    "mt-2 font-heading text-4xl font-bold leading-none sm:text-5xl",
                    metrics.totalCapturePercent >= 0
                      ? "text-[var(--signalflow-win)]"
                      : "text-[var(--signalflow-loss)]",
                  )}
                >
                  {pct(metrics.totalCapturePercent)}
                </p>
              </div>
              <CumulativeLineChart data={metrics.cumulativeSeries} />
            </div>
            <div className="signalflow-glass rounded-xl border border-white/5 p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Total % Won
              </p>
              <InstrumentCaptureDonutChart data={metrics.instrumentCapture} />
            </div>
          </div>
        </div>

        {/* 02 Trade Stats */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <SectionNumber n={2} />
            <h2 className="font-heading text-sm font-semibold text-muted-foreground">
              Trade Stats
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <KpiCard label="Total Signals" value={String(metrics.totalSignals)} delayMs={0} />
            <SliderStat
              label="Avg % / Trade"
              value={metrics.avgPercentPerTrade}
              max={30}
              displayValue={pct(metrics.avgPercentPerTrade)}
              accent={metrics.avgPercentPerTrade >= 0 ? "win" : "loss"}
            />
            <SliderStat
              label="Best Trade"
              value={metrics.bestTradePercent ?? 0}
              max={50}
              displayValue={metrics.bestTradePercent != null ? pct(metrics.bestTradePercent) : "—"}
              accent="win"
            />
            <KpiCard
              label="Worst Trade"
              value={metrics.worstTradePercent != null ? pct(metrics.worstTradePercent) : "—"}
              accent="loss"
              delayMs={40}
            />
          </div>
        </div>

        {/* 03 Win Rate, 04 Profit vs Loss, 05 Best & Worst Trades */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="signalflow-glass rounded-xl border border-white/5 p-4">
            <div className="mb-2 flex items-center gap-2">
              <SectionNumber n={3} />
              <h2 className="font-heading text-sm font-semibold">Win Rate</h2>
            </div>
            <div className="mx-auto max-w-xs">
              <WinRateDonutChart
                wins={metrics.winCount}
                losses={metrics.lossCount}
                gainPercent={metrics.totalGainPercent}
                lossPercent={metrics.totalLossPercent}
              />
            </div>
          </div>
          <div className="signalflow-glass rounded-xl border border-white/5 p-4">
            <div className="mb-2 flex items-center gap-2">
              <SectionNumber n={4} />
              <h2 className="font-heading text-sm font-semibold">Profit vs. Loss % by Day</h2>
            </div>
            <WinLossBarChart data={metrics.winLossByDay} />
          </div>
          <div className="signalflow-glass rounded-xl border border-white/5 p-4">
            <div className="mb-2 flex items-center gap-2">
              <SectionNumber n={5} />
              <h2 className="font-heading text-sm font-semibold">Best &amp; Worst Trades</h2>
            </div>
            <BestWorstBarChart data={bestWorst} />
          </div>
        </div>

        {/* JOIN COMMUNITY BANNER */}
        <div className="signalflow-glass signalflow-gold-border relative overflow-hidden rounded-xl border border-white/10 p-5 shadow-lg bg-gradient-to-r from-black/60 via-primary/5 to-black/60">
          <span
            className="absolute inset-x-0 top-0 h-[3px]"
            style={{ backgroundImage: "var(--signalflow-gold-gradient)" }}
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-base">🎁</span>
                <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-foreground">
                  JOIN {clientConfig.siteName.toUpperCase()}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Join our community and get access to our premium signals:
              </p>
            </div>
            <div className="mt-2 sm:mt-0 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-mono font-semibold text-primary truncate max-w-full">
              <span className="truncate">{joinUrl}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 06 Recent Signals (EXCLUDED FROM SNAPSHOT CONTAINER) */}
      <div className="signalflow-glass rounded-xl border border-white/5 p-4">
        <div className="mb-2 flex items-center gap-2">
          <SectionNumber n={6} />
          <h2 className="font-heading text-sm font-semibold">Recent Signals</h2>
        </div>
        <RecentSignalsList signals={recentSignals} />
      </div>
    </div>
  );
}
