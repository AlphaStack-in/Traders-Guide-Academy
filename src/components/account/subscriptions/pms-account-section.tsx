"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatDateOnly } from "@/lib/utils";
import { formatPriceInPaise } from "@/lib/products";
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

function formatDdMmm(dateStr: string) {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleDateString("en-IN", { month: "short" });
  return `${day}${month}`;
}

function GrowthValue({ percent }: { percent: number | null }) {
  if (percent == null) {
    return <span className="text-muted-foreground">—</span>;
  }
  const positive = percent >= 0;
  return (
    <span
      className="font-heading font-semibold"
      style={{ color: positive ? "var(--signalflow-win)" : "var(--signalflow-loss)" }}
    >
      {positive ? "+" : ""}
      {percent.toFixed(1)}%
    </span>
  );
}

function PmsAccountCard({ account }: { account: PmsAccountEntry }) {
  const chartData = account.valuations.map((v) => ({
    date: v.asOfDate.toISOString(),
    valueInRupees: Math.round(v.currentValueInPaise / 100),
  }));

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
            {account.latestValueInPaise != null
              ? formatPriceInPaise(account.latestValueInPaise)
              : "—"}
          </p>
          <p className="text-xs">
            <GrowthValue percent={account.growthPercent} /> growth
          </p>
        </div>
      </div>

      {account.valuations.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Your relationship manager hasn&apos;t posted a valuation update yet.
        </p>
      ) : (
        <>
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={220}>
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
          </div>

          <table className="mt-3 w-full border-collapse text-xs">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="pb-1.5 pr-3 font-normal">Date</th>
                <th className="pb-1.5 pr-3 font-normal">Value</th>
                <th className="pb-1.5 font-normal">Note</th>
              </tr>
            </thead>
            <tbody>
              {[...account.valuations].reverse().map((v) => (
                <tr key={v.id} className="border-t border-white/5">
                  <td className="py-1.5 pr-3">{formatDateOnly(v.asOfDate)}</td>
                  <td className="py-1.5 pr-3 font-medium">{formatPriceInPaise(v.currentValueInPaise)}</td>
                  <td className="py-1.5 text-muted-foreground">{v.note ?? "—"}</td>
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
 * PMS account summary/growth section of /account/subscriptions — one card
 * per PMS-category ProductPurchase, each showing contributed capital,
 * latest admin-entered valuation, growth %, and the full valuation history
 * as both a chart and a table. See src/lib/subscriptions.ts for how growth
 * is computed, and the new /admin/(protected)/pms-accounts page for how an
 * admin adds a valuation entry.
 */
export function PmsAccountSection({ accounts }: { accounts: PmsAccountEntry[] }) {
  return (
    <div className="signalflow-glass signalflow-gold-border flex flex-col gap-3 rounded-2xl border p-5">
      <div>
        <h2 className="font-heading text-lg font-bold">
          PMS <span className="signalflow-gold-text">Account</span>
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Your pooled portfolio management service contribution and growth.
        </p>
      </div>

      {accounts.length === 0 ? (
        <p className="text-sm text-muted-foreground">You haven&apos;t joined a PMS batch yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {accounts.map((account) => (
            <PmsAccountCard key={account.purchaseId} account={account} />
          ))}
        </div>
      )}
    </div>
  );
}
