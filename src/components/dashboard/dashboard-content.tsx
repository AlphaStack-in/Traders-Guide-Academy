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
import { cn } from "@/lib/utils";

export function DashboardContent({
  metrics,
  bestWorst,
  recentSignals,
}: {
  metrics: DashboardMetrics;
  bestWorst: { label: string; pnlPercent: number }[];
  recentSignals: RecentSignalItem[];
}) {
  const pct = (n: number) => `${n.toFixed(1)}%`;

  return (
    <div className="flex flex-col gap-8">
      <div className="thc-glass thc-gold-border relative rounded-2xl p-6">
        <div className="mb-4 flex items-center gap-2">
          <SectionNumber n={1} />
          <h2 className="font-heading text-sm font-semibold">Cumulative %</h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-3 lg:items-stretch">
          <div className="grid gap-6 sm:grid-cols-[minmax(160px,220px)_1fr] sm:items-center lg:col-span-2">
            <div className="thc-glow relative overflow-hidden rounded-xl border border-white/5 bg-black/20 p-5 text-center sm:text-left">
              <span
                className="absolute inset-x-0 top-0 h-[3px]"
                style={{ backgroundImage: "var(--thc-gold-gradient)" }}
              />
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Total % Won this Batch
              </p>
              <p
                className={cn(
                  "mt-2 font-heading text-4xl font-bold leading-none sm:text-5xl",
                  metrics.totalCapturePercent >= 0
                    ? "text-[var(--thc-win)]"
                    : "text-[var(--thc-loss)]",
                )}
              >
                {pct(metrics.totalCapturePercent)}
              </p>
            </div>
            <CumulativeLineChart data={metrics.cumulativeSeries} />
          </div>
          <div className="thc-glass rounded-xl border border-white/5 p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Total % Won
            </p>
            <InstrumentCaptureDonutChart data={metrics.instrumentCapture} />
          </div>
        </div>
      </div>

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

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="thc-glass rounded-xl border border-white/5 p-4">
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
        <div className="thc-glass rounded-xl border border-white/5 p-4">
          <div className="mb-2 flex items-center gap-2">
            <SectionNumber n={4} />
            <h2 className="font-heading text-sm font-semibold">Profit vs. Loss % by Day</h2>
          </div>
          <WinLossBarChart data={metrics.winLossByDay} />
        </div>
        <div className="thc-glass rounded-xl border border-white/5 p-4">
          <div className="mb-2 flex items-center gap-2">
            <SectionNumber n={5} />
            <h2 className="font-heading text-sm font-semibold">Best &amp; Worst Trades</h2>
          </div>
          <BestWorstBarChart data={bestWorst} />
        </div>
      </div>

      <div className="thc-glass rounded-xl border border-white/5 p-4">
        <div className="mb-2 flex items-center gap-2">
          <SectionNumber n={6} />
          <h2 className="font-heading text-sm font-semibold">Recent Signals</h2>
        </div>
        <RecentSignalsList signals={recentSignals} />
      </div>
    </div>
  );
}
