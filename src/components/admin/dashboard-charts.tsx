"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { clientConfig } from "@/lib/client-config";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const chartTooltipStyle = {
  backgroundColor: "var(--popover)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--popover-foreground)",
};

const chartTooltipLabelStyle = {
  color: "var(--popover-foreground)",
  marginBottom: 4,
  fontWeight: 600,
};

const chartTooltipItemStyle = {
  color: "var(--popover-foreground)",
};

const axisTick = { fontSize: 11, fill: "var(--muted-foreground)" };
const grid = <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />;

function formatDdMmm(dateStr: string) {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleDateString("en-IN", { month: "short" });
  return `${day}${month}`;
}

function legendText(value: string) {
  return <span style={{ color: "var(--muted-foreground)", fontSize: 12 }}>{value}</span>;
}

export function CumulativeLineChart({
  data,
}: {
  data: { date: string; cumulativePercent: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="cumulativeFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.55} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.03} />
          </linearGradient>
        </defs>
        {grid}
        <XAxis dataKey="date" tick={axisTick} tickFormatter={formatDdMmm} />
        <YAxis tick={axisTick} />
        <Tooltip contentStyle={chartTooltipStyle}
          labelStyle={chartTooltipLabelStyle}
          itemStyle={chartTooltipItemStyle}
          labelFormatter={formatDdMmm}
        />
        <Area
          type="monotone"
          dataKey="cumulativePercent"
          stroke="var(--primary)"
          strokeWidth={2.5}
          fill="url(#cumulativeFill)"
          dot={false}
          name="Cumulative %"
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

interface DayPnl {
  date: string;
  profitPercent: number;
  lossPercent: number;
  netPercent: number;
}

const CHART_HEIGHT = 260;
const CHART_PAD = { top: 24, right: 12, bottom: 44, left: 34 };

function niceBound(value: number) {
  return Math.ceil(Math.max(Math.abs(value), 5) / 5) * 5;
}

// SVG viewBox width is measured from the container so 1 unit = 1 real pixel —
// a fixed viewBox scaled to fit a narrow dashboard card shrank the text along
// with the coordinate space, making it illegible.
function useContainerWidth(fallback: number) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(fallback);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth || fallback);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [fallback]);

  return [ref, width] as const;
}

// Hand-rolled SVG instead of recharts here: recharts' stacked/array-valued Bar
// rendering (needed for a single diverging profit/loss column) didn't combine
// the two series into one bar in this version — each still got its own X slot.
const HORIZONTAL_BAR_ROW_HEIGHT = 34;

function visibleRowLimit(chartHeight: number, verticalPadding: number) {
  return Math.max(1, Math.floor((chartHeight - verticalPadding) / HORIZONTAL_BAR_ROW_HEIGHT));
}

function makeHorizontalPnlLabel(data: { pnlPercent: number }[]) {
  return function HorizontalPnlLabel({
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    index = 0,
  }: RiskRewardLabelProps) {
    const point = data[index];
    if (!point) return null;
    const isPositive = point.pnlPercent >= 0;
    const cx = Number(x);
    const cy = Number(y);
    const cw = Number(width);
    const ch = Number(height);
    // Short bars (< 48px) → label outside: value is small, text is short, fits in margin.
    // Long bars (≥ 48px) → label inside: value like "+238.4%" is wide and would clip outside.
    const fitOutside = Math.abs(cw) < 48;
    const labelX = isPositive
      ? fitOutside ? cx + cw + 5 : cx + cw - 5
      : fitOutside ? cx - 5 : cx + 5;
    const anchor = isPositive
      ? fitOutside ? "start" : "end"
      : fitOutside ? "end" : "start";
    const fill = "#f5f2e8";
    return (
      <text
        x={labelX}
        y={cy + ch / 2 + 4}
        textAnchor={anchor}
        fontSize={11}
        fontWeight={700}
        fill={fill}
      >
        {`${isPositive ? "+" : ""}${point.pnlPercent.toFixed(1)}%`}
      </text>
    );
  };
}

function WinLossTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: DayPnl }[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload as DayPnl;
  return (
    <div
      className="rounded-lg border border-white/10 px-3 py-2 text-xs shadow-lg"
      style={{ backgroundColor: "var(--popover)", color: "var(--popover-foreground)" }}
    >
      <p className="mb-1 font-semibold">{formatDdMmm(point.date)}</p>
      <p style={{ color: "var(--signalflow-win)" }}>Profit: +{Math.round(point.profitPercent)}%</p>
      <p style={{ color: "var(--signalflow-loss)" }}>Loss: {Math.round(point.lossPercent)}%</p>
      <p>
        Net: {point.netPercent >= 0 ? "+" : ""}
        {Math.round(point.netPercent)}%
      </p>
    </div>
  );
}

export function WinLossBarChart({ data }: { data: DayPnl[] }) {
  const chartHeight = 260;
  const visibleData = data.slice(-visibleRowLimit(chartHeight, 42));
  const labelData = visibleData.map((point) => ({ pnlPercent: point.netPercent }));

  return (
    <div>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={visibleData}
          layout="vertical"
          margin={{ top: 8, right: 52, bottom: 4, left: 0 }}
          barCategoryGap="20%"
        >
          {grid}
          <XAxis type="number" tick={axisTick} unit="%" />
          <YAxis type="category" dataKey="date" width={58} tick={axisTick} tickFormatter={formatDdMmm} />
          <Tooltip content={<WinLossTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <Bar dataKey="profitPercent" name="Total Profit %" stackId="dailyPnl" fill="var(--signalflow-win)" radius={[0, 3, 3, 0]} isAnimationActive={false} />
          <Bar dataKey="lossPercent" name="Total Loss %" stackId="dailyPnl" fill="var(--signalflow-loss)" radius={[3, 0, 0, 3]} isAnimationActive={false}>
            <LabelList dataKey="netPercent" content={makeHorizontalPnlLabel(labelData)} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-2 flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: "var(--signalflow-win)" }} />
          Total Profit %
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: "var(--signalflow-loss)" }} />
          Total Loss %
        </span>
      </div>
    </div>
  );
}

function LegacyWinLossBarChart({ data }: { data: DayPnl[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [containerRef, CHART_WIDTH] = useContainerWidth(360);

  const innerWidth = CHART_WIDTH - CHART_PAD.left - CHART_PAD.right;
  const innerHeight = CHART_HEIGHT - CHART_PAD.top - CHART_PAD.bottom;

  const maxProfit = Math.max(0, ...data.map((d) => d.profitPercent));
  const maxLoss = Math.min(0, ...data.map((d) => d.lossPercent));
  const yMax = niceBound(maxProfit);
  const yMin = -niceBound(Math.abs(maxLoss));
  const span = yMax - yMin || 1;

  const yScale = (v: number) => CHART_PAD.top + ((yMax - v) / span) * innerHeight;
  const zeroY = yScale(0);

  const slot = innerWidth / Math.max(data.length, 1);
  const barWidth = Math.min(28, slot * 0.5);
  const yTicks = Array.from(new Set([yMax, yMax / 2, 0, yMin / 2, yMin]));

  return (
    <div ref={containerRef} className="relative">
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="w-full"
        style={{ height: CHART_HEIGHT }}
      >
        {yTicks.map((tick) => (
          <g key={tick}>
            <line
              x1={CHART_PAD.left}
              x2={CHART_WIDTH - CHART_PAD.right}
              y1={yScale(tick)}
              y2={yScale(tick)}
              stroke={tick === 0 ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.08)"}
              strokeDasharray={tick === 0 ? undefined : "3 3"}
            />
            <text
              x={CHART_PAD.left - 6}
              y={yScale(tick) + 3}
              textAnchor="end"
              fontSize={10}
              fill="var(--muted-foreground)"
            >
              {`${Math.round(tick)}%`}
            </text>
          </g>
        ))}

        {data.map((d, i) => {
          const cx = CHART_PAD.left + slot * i + slot / 2;
          const barX = cx - barWidth / 2;
          const profitY = yScale(Math.max(d.profitPercent, 0));
          const lossY = yScale(Math.min(d.lossPercent, 0));
          const isHovered = hovered === i;

          return (
            <g
              key={d.date}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
            >
              <rect x={barX - 4} y={CHART_PAD.top} width={barWidth + 8} height={innerHeight} fill="transparent" />
              {d.profitPercent > 0 && (
                <rect
                  x={barX}
                  y={profitY}
                  width={barWidth}
                  height={Math.max(zeroY - profitY, 0)}
                  rx={3}
                  fill="var(--signalflow-win)"
                  opacity={isHovered ? 1 : 0.85}
                />
              )}
              {d.lossPercent < 0 && (
                <rect
                  x={barX}
                  y={zeroY}
                  width={barWidth}
                  height={Math.max(lossY - zeroY, 0)}
                  rx={3}
                  fill="var(--signalflow-loss)"
                  opacity={isHovered ? 1 : 0.85}
                />
              )}
              <text
                x={cx}
                y={Math.min(profitY, zeroY) - 6}
                textAnchor="middle"
                fontSize={10}
                fontWeight={700}
                fill={d.netPercent >= 0 ? "var(--signalflow-win)" : "var(--signalflow-loss)"}
              >
                {`${d.netPercent >= 0 ? "+" : ""}${Math.round(d.netPercent)}%`}
              </text>
              <text
                x={cx}
                y={CHART_HEIGHT - CHART_PAD.bottom + 10}
                textAnchor="end"
                fontSize={10}
                fill="var(--muted-foreground)"
                transform={`rotate(-90 ${cx} ${CHART_HEIGHT - CHART_PAD.bottom + 10})`}
              >
                {formatDdMmm(d.date)}
              </text>
            </g>
          );
        })}
      </svg>

      {hovered != null && data[hovered] && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-white/10 px-3 py-2 text-xs shadow-lg"
          style={{
            backgroundColor: "var(--popover)",
            color: "var(--popover-foreground)",
            left: `${((CHART_PAD.left + slot * hovered + slot / 2) / CHART_WIDTH) * 100}%`,
            top: `${(yScale(Math.max(data[hovered].profitPercent, 0)) / CHART_HEIGHT) * 100}%`,
          }}
        >
          <p className="mb-1 font-semibold">{formatDdMmm(data[hovered].date)}</p>
          <p style={{ color: "var(--signalflow-win)" }}>Profit: +{Math.round(data[hovered].profitPercent)}%</p>
          <p style={{ color: "var(--signalflow-loss)" }}>Loss: {Math.round(data[hovered].lossPercent)}%</p>
          <p>
            Net: {data[hovered].netPercent >= 0 ? "+" : ""}
            {Math.round(data[hovered].netPercent)}%
          </p>
        </div>
      )}

      <div className="mt-2 flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: "var(--signalflow-win)" }} />
          Total Profit %
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: "var(--signalflow-loss)" }} />
          Total Loss %
        </span>
      </div>
    </div>
  );
}

export function WinRateDonutChart({
  wins,
  losses,
  gainPercent,
  lossPercent,
}: {
  wins: number;
  losses: number;
  gainPercent: number;
  lossPercent: number;
}) {
  const netPercent = gainPercent + lossPercent;
  const pct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
  const data = [
    { name: "Wins", value: wins },
    { name: "Losses", value: losses },
  ];
  const fills = ["url(#winDonutFill)", "url(#lossDonutFill)"];

  return (
    <div className="relative" style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <defs>
            <linearGradient id="winDonutFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--signalflow-win)" stopOpacity={1} />
              <stop offset="100%" stopColor="var(--signalflow-win)" stopOpacity={0.55} />
            </linearGradient>
            <linearGradient id="lossDonutFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--signalflow-loss)" stopOpacity={1} />
              <stop offset="100%" stopColor="var(--signalflow-loss)" stopOpacity={0.55} />
            </linearGradient>
          </defs>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={64}
            outerRadius={92}
            paddingAngle={3}
            startAngle={90}
            endAngle={-270}
            isAnimationActive={false}
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={fills[index % fills.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={chartTooltipStyle}
          labelStyle={chartTooltipLabelStyle}
          itemStyle={chartTooltipItemStyle}
        />
          <Legend
            formatter={(value) =>
              legendText(`${value} (${value === "Wins" ? pct(gainPercent) : pct(lossPercent)})`)
            }
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center pb-8">
        <div className="text-center">
          <p
            className={cn(
              "font-heading text-2xl font-bold",
              netPercent >= 0 ? "text-[var(--signalflow-win)]" : "text-[var(--signalflow-loss)]",
            )}
          >
            {pct(netPercent)}
          </p>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Net %</p>
        </div>
      </div>
    </div>
  );
}

function pctSigned(n: number) {
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

function InstrumentDonutLabel(props: any) {
  const { cx, cy, midAngle, outerRadius, capturePercent } = props;
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 18;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="var(--muted-foreground)"
      fontSize={11}
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
    >
      {pctSigned(capturePercent)}
    </text>
  );
}

export function InstrumentCaptureDonutChart({
  data,
}: {
  data: { label: string; capturePercent: number }[];
}) {
  const visible = data.filter((d) => d.capturePercent !== 0);
  const total = data.reduce((sum, d) => sum + d.capturePercent, 0);

  if (visible.length === 0) {
    return (
      <div className="flex h-[280px] w-full flex-col items-center justify-center gap-1 text-center">
        <p className="text-xs text-muted-foreground">
          No closed trades yet — this fills in once a signal closes.
        </p>
      </div>
    );
  }

  return (
    <div className="relative" style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={visible}
            dataKey={(d: { capturePercent: number }) => Math.abs(d.capturePercent)}
            nameKey="label"
            innerRadius={64}
            outerRadius={92}
            paddingAngle={3}
            startAngle={90}
            endAngle={-270}
            isAnimationActive={false}
            label={InstrumentDonutLabel}
            labelLine={false}
          >
            {visible.map((entry, index) => (
              <Cell
                key={entry.label}
                fill={
                  clientConfig.instrumentDonutColors[
                    index % clientConfig.instrumentDonutColors.length
                  ]
                }
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={chartTooltipStyle}
            labelStyle={chartTooltipLabelStyle}
            itemStyle={chartTooltipItemStyle}
            formatter={(_value, _name, entry: any) => pctSigned(entry.payload.capturePercent)}
          />
          <Legend
            formatter={(value, entry: any) =>
              legendText(`${value} (${pctSigned(entry.payload.capturePercent)})`)
            }
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center pb-8">
        <div className="text-center">
          <p
            className={cn(
              "font-heading text-2xl font-bold",
              total >= 0 ? "text-[var(--signalflow-win)]" : "text-[var(--signalflow-loss)]",
            )}
          >
            {pctSigned(total)}
          </p>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Total</p>
        </div>
      </div>
    </div>
  );
}

interface RiskRewardPoint {
  label: string;
  buyPrice: number;
  sellTargetPrice: number;
  sellSlPrice: number;
  gainPercent: number;
  lossPercent: number;
}

interface RiskRewardLabelProps {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  height?: number | string;
  index?: number;
}

// Single-trade diverging risk/reward bar -- entry pinned at 0%, stop-loss
// extends left (negative), best target extends right (positive). Hand-built
// (no Recharts) rather than a stacked BarChart: this is one bar for one
// trade shown inside that trade's own card (see OngoingSignals), so there's
// no multi-row layout or shared axis to fight, and direct pixel control
// means the SL/Entry/Target labels never collide -- each gets its own slot
// (start/center/end) instead of being packed inside a thin bar segment.
const RISK_REWARD_MIN_SEGMENT_PERCENT = 4; // keeps a lopsided ratio (e.g. -2% / +80%) visible instead of vanishing to a hairline

export function TradeRiskRewardBar({ data }: { data: RiskRewardPoint }) {
  const { buyPrice, sellTargetPrice, sellSlPrice, gainPercent, lossPercent } = data;
  const min = Math.min(lossPercent, 0);
  const max = Math.max(gainPercent, 0);
  const span = max - min || 1; // guards a same-price SL/target edge case, never expected in practice
  const zeroPercent = ((0 - min) / span) * 100;
  const riskWidthPercent = Math.max(((0 - lossPercent) / span) * 100, lossPercent < 0 ? RISK_REWARD_MIN_SEGMENT_PERCENT : 0);
  const gainWidthPercent = Math.max(((gainPercent - 0) / span) * 100, gainPercent > 0 ? RISK_REWARD_MIN_SEGMENT_PERCENT : 0);

  return (
    <div className="w-full">
      {/* Labels are laid out in a plain flex row (start / center / end)
          rather than positioned at each segment's actual zero-point
          percentage -- that decouples label placement from the data so
          SL/Entry/Target text can never overlap even when one segment is
          tiny (e.g. a small stop-loss % puts the entry point near the far
          left). The colored track below still reflects the true proportions. */}
      <div className="flex items-start justify-between gap-2 text-[11px] leading-tight">
        <div className="flex flex-col items-start">
          <span className="font-semibold whitespace-nowrap text-[var(--signalflow-loss)]">SL ₹{sellSlPrice}</span>
          <span className="text-muted-foreground">{lossPercent}%</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="signalflow-gold-text font-semibold whitespace-nowrap">Entry ₹{buyPrice}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="font-semibold whitespace-nowrap text-[var(--signalflow-win)]">Target ₹{sellTargetPrice}</span>
          <span className="text-muted-foreground">+{gainPercent}%</span>
        </div>
      </div>
      <div className="relative mt-1 h-2.5 w-full rounded-full bg-white/5">
        <div
          className="absolute top-0 h-full rounded-l-full bg-[var(--signalflow-loss)]"
          style={{ left: 0, width: `calc(${riskWidthPercent}% - 2px)`, minWidth: 6 }}
        />
        <div
          className="absolute top-0 h-full rounded-r-full bg-[var(--signalflow-win)]"
          style={{ left: `calc(${zeroPercent}% + 2px)`, width: `calc(${gainWidthPercent}% - 2px)`, minWidth: 6 }}
        />
        <div
          className="absolute top-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--signalflow-gold-start)]"
          style={{ left: `${zeroPercent}%` }}
        />
      </div>
    </div>
  );
}


function makeBestWorstLabel(data: { label: string; pnlPercent: number }[]) {
  return function BestWorstLabel({
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    index = 0,
  }: RiskRewardLabelProps) {
    const point = data[index];
    if (!point) return null;
    const cx = Number(x) + Number(width) / 2;
    const cy = Number(y);
    const ch = Number(height);
    const isPositive = point.pnlPercent >= 0;
    // Vertical text anchored in from the bar's own tip (clamped to the bar's
    // height, same approach as the risk/reward chart above) so it always
    // sits inside the bar's own footprint instead of relying on outside
    // whitespace that shrinks or grows with the y-domain.
    const inset = Math.min(8, ch * 0.3);
    const anchorY = isPositive ? cy + inset : cy + ch - inset;
    return (
      <text
        x={cx}
        y={anchorY}
        textAnchor={isPositive ? "end" : "start"}
        fontSize={11}
        fontWeight={700}
        fill="#f5f2e8"
        transform={`rotate(-90 ${cx} ${anchorY})`}
      >
        {`${isPositive ? "+" : ""}${point.pnlPercent.toFixed(1)}%`}
      </text>
    );
  };
}

function BestWorstAxisTick({
  x = 0,
  y = 0,
  payload,
}: {
  x?: number;
  y?: number;
  payload?: { value: string };
}) {
  return (
    <text
      x={x}
      y={y}
      dy={4}
      textAnchor="end"
      fontSize={11}
      fill="var(--muted-foreground)"
      transform={`rotate(-90 ${x} ${y})`}
    >
      {payload?.value}
    </text>
  );
}

/** Single-line YAxis tick for BestWorstBarChart – clips overflow, never wraps. */
function BestWorstYAxisTick({
  x,
  y,
  payload,
  width,
}: {
  x?: number;
  y?: number;
  payload?: { value: string };
  width?: number;
}) {
  const maxWidth = (width ?? 148) - 4;
  const clipId = `bw-y-clip-${(payload?.value ?? "").replace(/\W+/g, "")}`;
  return (
    <g transform={`translate(${x},${y})`}>
      <defs>
        <clipPath id={clipId}>
          <rect x={-maxWidth} y={-10} width={maxWidth} height={20} />
        </clipPath>
      </defs>
      <title>{payload?.value}</title>
      <text
        x={0}
        y={0}
        dy={4}
        textAnchor="end"
        fontSize={11}
        fill="var(--muted-foreground)"
        clipPath={`url(#${clipId})`}
      >
        {payload?.value}
      </text>
    </g>
  );
}

function BestWorstTooltip({ active, payload }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  return (
    <div
      className="rounded-lg border border-white/10 px-3 py-2 text-xs shadow-lg"
      style={{ backgroundColor: "var(--popover)", color: "var(--popover-foreground)" }}
    >
      <p className="font-bold text-sm mb-1">{point.label}</p>
      {point.strike != null && (
        <p className="text-muted-foreground">
          Strike: <span className="font-semibold text-foreground">{point.strike}</span> ({point.optionType})
        </p>
      )}
      {point.dateStr && <p className="text-muted-foreground">Date: {point.dateStr}</p>}
      <p
        className={
          point.pnlPercent >= 0 ? "font-bold text-[var(--signalflow-win)]" : "font-bold text-[var(--signalflow-loss)]"
        }
      >
        P&amp;L: {point.pnlPercent >= 0 ? "+" : ""}
        {point.pnlPercent.toFixed(1)}%
      </p>
    </div>
  );
}

export function BestWorstBarChart({
  data,
}: {
  data: {
    label: string;
    pnlPercent: number;
    instrument?: string;
    strike?: number;
    optionType?: string;
    dateStr?: string;
  }[];
}) {
  const chartHeight = 280;
  const visibleLimit = visibleRowLimit(chartHeight, 24);
  const visibleData =
    data.length <= visibleLimit
      ? data
      : [
          ...data.slice(0, Math.ceil(visibleLimit / 2)),
          ...data.slice(-Math.floor(visibleLimit / 2)),
        ];

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        data={visibleData}
        layout="vertical"
        margin={{ top: 8, right: 52, left: 0, bottom: 4 }}
        barCategoryGap="20%"
      >
        <defs>
          <linearGradient id="bwWinFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--signalflow-win)" stopOpacity={0.95} />
            <stop offset="100%" stopColor="var(--signalflow-win)" stopOpacity={0.35} />
          </linearGradient>
          <linearGradient id="bwLossFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--signalflow-loss)" stopOpacity={0.95} />
            <stop offset="100%" stopColor="var(--signalflow-loss)" stopOpacity={0.35} />
          </linearGradient>
        </defs>
        {grid}
        <XAxis type="number" tick={axisTick} unit="%" />
        <YAxis type="category" dataKey="label" width={148} tick={<BestWorstYAxisTick width={148} />} interval={0} />
        <Tooltip content={<BestWorstTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <Bar dataKey="pnlPercent" name="P&L %" radius={[0, 3, 3, 0]} isAnimationActive={false}>
          {visibleData.map((entry) => (
            <Cell
              key={entry.label}
              fill={entry.pnlPercent >= 0 ? "url(#bwWinFill)" : "url(#bwLossFill)"}
            />
          ))}
          <LabelList dataKey="pnlPercent" content={makeHorizontalPnlLabel(visibleData)} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
