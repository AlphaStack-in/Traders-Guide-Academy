"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatDateOnly } from "@/lib/utils";
import { formatPriceInPaise } from "@/lib/products";
import { TerminalCard, StatTile, EyebrowBadge } from "@/components/account/subscriptions/ui";
import type { PmsAccountEntry } from "@/lib/subscriptions";

// Same tooltip/axis/grid styling as CumulativeLineChart in
// src/components/admin/dashboard-charts.tsx — kept as its own local copy
// (that file is admin-only and client-side) rather than a shared export, to
// avoid coupling the subscriber-facing bundle to an admin component file.
const chartTooltipStyle = {
  backgroundColor: "var(--popover)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--popover-foreground)",
};
const chartTooltipLabelStyle = { color: "var(--popover-foreground)", marginBottom: 4, fontWeight: 600 };
const chartTooltipItemStyle = { color: "var(--popover-foreground)" };
const axisTick = { fontSize: 11, fill: "var(--muted-foreground)" };

const TIMEFRAMES = [
  { id: "1W", label: "1W", days: 7 },
  { id: "1M", label: "1M", days: 30 },
  { id: "ALL", label: "ALL", days: null },
] as const;
type TimeframeId = (typeof TIMEFRAMES)[number]["id"];

function formatDdMmm(dateStr: string) {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleDateString("en-IN", { month: "short" });
  return `${day}${month}`;
}

// formatPriceInPaise returns "Free" for exactly 0, and drops the sign for
// negative values in a way that reads oddly prefixed with our own "+"/"-" —
// this small formatter is only for the signed rupee delta shown under the
// Net Growth stat tile.
function formatSignedRupees(deltaInPaise: number): string {
  const rupees = Math.round(Math.abs(deltaInPaise) / 100);
  const sign = deltaInPaise > 0 ? "+" : deltaInPaise < 0 ? "-" : "";
  return `${sign}₹${rupees.toLocaleString("en-IN")}`;
}

function GrowthValue({ percent }: { percent: number | null }) {
  if (percent == null) {
    return <span className="text-muted-foreground">—</span>;
  }
  const positive = percent >= 0;
  return (
    <span style={{ color: positive ? "var(--signalflow-win)" : "var(--signalflow-loss)" }}>
      {positive ? "+" : ""}
      {percent.toFixed(1)}%
    </span>
  );
}

function PmsAccountCard({ account }: { account: PmsAccountEntry }) {
  const [timeframe, setTimeframe] = useState<TimeframeId>("1M");

  const chartData = useMemo(() => {
    const activeDays = TIMEFRAMES.find((t) => t.id === timeframe)?.days ?? null;
    if (activeDays == null) {
      return account.valuations.map((v) => ({
        date: v.asOfDate.toISOString(),
        valueInRupees: Math.round(v.currentValueInPaise / 100),
      }));
    }
    // Anchor the window to the latest posted valuation (not Date.now) so the
    // chart filter stays pure during render and matches admin-posted NAV dates.
    const latestMs = account.valuations.reduce(
      (max, v) => Math.max(max, v.asOfDate.getTime()),
      0,
    );
    const cutoff = latestMs - activeDays * 24 * 60 * 60 * 1000;
    return account.valuations
      .filter((v) => v.asOfDate.getTime() >= cutoff)
      .map((v) => ({ date: v.asOfDate.toISOString(), valueInRupees: Math.round(v.currentValueInPaise / 100) }));
  }, [account.valuations, timeframe]);

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-heading font-semibold">{account.productName}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Joined {formatDateOnly(account.purchasedAt)} · contributed{" "}
            {formatPriceInPaise(account.contributedAmountInPaise)}
          </p>
        </div>
        <div className="text-right">
          <p className="font-heading text-lg font-bold">
            {account.latestValueInPaise != null ? formatPriceInPaise(account.latestValueInPaise) : "—"}
          </p>
          <p className="text-xs font-semibold">
            <GrowthValue percent={account.growthPercent} /> <span className="font-normal text-muted-foreground">growth</span>
          </p>
        </div>
      </div>

      {account.valuations.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Your relationship manager hasn&apos;t posted a valuation update yet.
        </p>
      ) : (
        <>
          <div className="mt-4 flex items-center justify-between px-0.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-200">NAV Progression</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--signalflow-gold-start)]" />
            </div>
            <div className="flex items-center gap-1 rounded-md border border-white/10 bg-black/30 p-0.5 font-mono text-[10px]">
              {TIMEFRAMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTimeframe(t.id)}
                  className={
                    t.id === timeframe
                      ? "rounded border border-primary/30 bg-primary/20 px-2 py-0.5 font-bold text-primary"
                      : "rounded px-2 py-0.5 text-muted-foreground hover:text-white"
                  }
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-2">
            {chartData.length === 0 ? (
              <div className="flex h-[180px] items-center justify-center rounded-lg border border-white/5 bg-black/10 text-xs text-muted-foreground">
                No valuations in this range yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`pmsFill-${account.purchaseId}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="date" tick={axisTick} tickFormatter={formatDdMmm} />
                  <YAxis tick={axisTick} width={64} />
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    labelStyle={chartTooltipLabelStyle}
                    itemStyle={chartTooltipItemStyle}
                    labelFormatter={formatDdMmm}
                    formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, "Value"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="valueInRupees"
                    stroke="var(--chart-1)"
                    strokeWidth={2.5}
                    fill={`url(#pmsFill-${account.purchaseId})`}
                    dot={{ r: 3 }}
                    name="Value"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
            Valuation Log
            <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] font-medium normal-case text-slate-400">
              {account.valuations.length} {account.valuations.length === 1 ? "entry" : "entries"}
            </span>
          </div>
          <table className="mt-2 w-full border-collapse text-xs">
            <thead>
              <tr className="text-left font-mono text-[11px] text-muted-foreground">
                <th className="pb-1.5 pr-3 font-medium">Date</th>
                <th className="pb-1.5 pr-3 font-medium">Value</th>
                <th className="pb-1.5 pr-3 font-medium">Note</th>
                <th className="pb-1.5 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {[...account.valuations].reverse().map((v, i) => (
                <tr key={v.id} className="border-t border-white/5">
                  <td className="py-1.5 pr-3 font-sans">{formatDateOnly(v.asOfDate)}</td>
                  <td className="py-1.5 pr-3 font-semibold text-white">{formatPriceInPaise(v.currentValueInPaise)}</td>
                  <td className="py-1.5 pr-3 font-sans text-muted-foreground">{v.note ?? "—"}</td>
                  <td className="py-1.5 text-right font-sans">
                    {i === 0 ? (
                      <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold text-[var(--signalflow-win)]" style={{ backgroundColor: "color-mix(in oklab, var(--signalflow-win) 15%, transparent)" }}>
                        Latest
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

/**
 * PMS account summary/growth section of /account/subscriptions — the
 * dashboard's centerpiece "PMS Portfolio Terminal" card: one block per
 * PMS-category ProductPurchase, each showing contributed capital, latest
 * admin-entered valuation, growth %, and the full valuation history as both
 * a filterable chart and a table. See src/lib/subscriptions.ts for how
 * growth is computed, and the /admin/(protected)/pms-accounts page for how
 * an admin adds a valuation entry.
 */
export function PmsAccountSection({ accounts }: { accounts: PmsAccountEntry[] }) {
  const totalContributed = accounts.reduce((sum, a) => sum + a.contributedAmountInPaise, 0);
  const totalLatest = accounts.reduce((sum, a) => sum + (a.latestValueInPaise ?? a.contributedAmountInPaise), 0);
  const hasAnyValuation = accounts.some((a) => a.latestValueInPaise != null);
  const overallGrowth = hasAnyValuation && totalContributed > 0
    ? ((totalLatest - totalContributed) / totalContributed) * 100
    : null;

  return (
    <TerminalCard
      title={
        <>
          PMS <span className="signalflow-gold-text">Portfolio Terminal</span>
        </>
      }
      subtitle="Pooled Portfolio Management Service allocation & performance metrics."
      accent="gold"
      padding="compact"
      badge={
        accounts.length > 0 ? (
          <EyebrowBadge tone="win" pulse>
            Live NAV Sync
          </EyebrowBadge>
        ) : undefined
      }
    >
      {accounts.length === 0 ? (
        <p className="text-sm text-muted-foreground">You haven&apos;t joined a PMS batch yet.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatTile label="Total Value" value={formatPriceInPaise(totalLatest)} tone="gold" />
            <StatTile label="Capital Invested" value={formatPriceInPaise(totalContributed)} />
            <StatTile
              label="Net Growth"
              value={<GrowthValue percent={overallGrowth} />}
              tone={overallGrowth == null ? "default" : overallGrowth >= 0 ? "win" : "loss"}
              sub={overallGrowth != null ? formatSignedRupees(totalLatest - totalContributed) : undefined}
            />
          </div>

          <div className="flex flex-col gap-4">
            {accounts.map((account) => (
              <PmsAccountCard key={account.purchaseId} account={account} />
            ))}
          </div>
        </>
      )}
    </TerminalCard>
  );
}
