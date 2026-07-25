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
  ReferenceLine,
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
export function WinLossBarChart({ data }: { data: DayPnl[] }) {
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
                  fill="var(--thc-win)"
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
                  fill="var(--thc-loss)"
                  opacity={isHovered ? 1 : 0.85}
                />
              )}
              <text
                x={cx}
                y={Math.min(profitY, zeroY) - 6}
                textAnchor="middle"
                fontSize={10}
                fontWeight={700}
                fill={d.netPercent >= 0 ? "var(--thc-win)" : "var(--thc-loss)"}
              >
                {`${d.netPercent >= 0 ? "+" : ""}${d.netPercent}%`}
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
          <p style={{ color: "var(--thc-win)" }}>Profit: +{data[hovered].profitPercent}%</p>
          <p style={{ color: "var(--thc-loss)" }}>Loss: {data[hovered].lossPercent}%</p>
          <p>
            Net: {data[hovered].netPercent >= 0 ? "+" : ""}
            {data[hovered].netPercent}%
          </p>
        </div>
      )}

      <div className="mt-2 flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: "var(--thc-win)" }} />
          Total Profit %
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: "var(--thc-loss)" }} />
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
              <stop offset="0%" stopColor="var(--thc-win)" stopOpacity={1} />
              <stop offset="100%" stopColor="var(--thc-win)" stopOpacity={0.55} />
            </linearGradient>
            <linearGradient id="lossDonutFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--thc-loss)" stopOpacity={1} />
              <stop offset="100%" stopColor="var(--thc-loss)" stopOpacity={0.55} />
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
              netPercent >= 0 ? "text-[var(--thc-win)]" : "text-[var(--thc-loss)]",
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
              total >= 0 ? "text-[var(--thc-win)]" : "text-[var(--thc-loss)]",
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

function RiskRewardTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: RiskRewardPoint }[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  return (
    <div
      className="rounded-lg border border-white/10 px-3 py-2 text-xs"
      style={{ backgroundColor: "var(--popover)", color: "var(--popover-foreground)" }}
    >
      <p className="mb-1.5 font-semibold">{point.label}</p>
      <p style={{ color: "var(--muted-foreground)" }}>
        Buy (Entry): <span style={{ color: "var(--popover-foreground)" }}>₹{point.buyPrice}</span>
      </p>
      <p style={{ color: "var(--thc-win)" }}>
        Sell (Target): ₹{point.sellTargetPrice} ({point.gainPercent >= 0 ? "+" : ""}
        {point.gainPercent}%)
      </p>
      <p style={{ color: "var(--thc-loss)" }}>
        Sell (SL): ₹{point.sellSlPrice} ({point.lossPercent}%)
      </p>
    </div>
  );
}

interface RiskRewardLabelProps {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  height?: number | string;
  index?: number;
}

function makeRiskRewardLabel(
  data: RiskRewardPoint[],
  priceKey: "sellTargetPrice" | "sellSlPrice",
  pctKey: "gainPercent" | "lossPercent",
  position: "top" | "bottom",
) {
  return function RiskRewardLabel({
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    index = 0,
  }: RiskRewardLabelProps) {
    const point = data[index];
    if (!point) return null;
    const pct = point[pctKey];
    const cx = Number(x);
    const cy = Number(y);
    const cw = Number(width);
    const ch = Number(height);
    const midX = cx + cw / 2;
    // Anchored in from the bar's far tip (away from the zero line) rather
    // than centered — keeps the label clear of the Entry label at the zero
    // line and stays inside the bar regardless of magnitude, instead of
    // spilling into the X-axis category labels below the chart.
    const baseY = position === "top" ? cy + Math.min(18, ch * 0.4) : cy + ch - Math.min(20, ch * 0.5);
    return (
      <text x={midX} textAnchor="middle" fontSize={12} fontWeight={700} fill="#f5f2e8">
        <tspan x={midX} y={baseY}>{`₹${point[priceKey]}`}</tspan>
        <tspan x={midX} y={baseY + 14}>{`(${pct >= 0 ? "+" : ""}${pct}%)`}</tspan>
      </text>
    );
  };
}

function makeEntryPriceLabel(data: RiskRewardPoint[]) {
  return function EntryPriceLabel({
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    index = 0,
  }: RiskRewardLabelProps) {
    const point = data[index];
    if (!point) return null;
    const cx = Number(x);
    const cy = Number(y);
    const cw = Number(width);
    const ch = Number(height);
    // The gain bar's rect always spans from its peak down to the zero line —
    // so y + height is exactly the zero-line pixel position for this category.
    const zeroY = cy + ch;
    return (
      <text
        x={cx + cw / 2}
        y={zeroY - 6}
        textAnchor="middle"
        fontSize={13}
        fontWeight={700}
        fill="var(--thc-gold-start)"
      >
        {`Entry ₹${point.buyPrice}`}
      </text>
    );
  };
}

const riskRewardAxisTick = { fontSize: 13, fill: "var(--muted-foreground)" };

function riskRewardLegendText(value: string) {
  return <span style={{ color: "var(--muted-foreground)", fontSize: 13 }}>{value}</span>;
}

export function OngoingRiskRewardChart({ data }: { data: RiskRewardPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={340}>
      <BarChart
        data={data}
        margin={{ top: 36, right: 16, left: 0, bottom: 20 }}
        barGap={4}
        barCategoryGap="20%"
      >
        <defs>
          <linearGradient id="riskGainFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--thc-win)" stopOpacity={0.95} />
            <stop offset="100%" stopColor="var(--thc-win)" stopOpacity={0.35} />
          </linearGradient>
          <linearGradient id="riskLossFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--thc-loss)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--thc-loss)" stopOpacity={0.95} />
          </linearGradient>
        </defs>
        {grid}
        <XAxis dataKey="label" tick={riskRewardAxisTick} />
        <YAxis unit="%" tick={riskRewardAxisTick} />
        <Tooltip content={<RiskRewardTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <Legend formatter={riskRewardLegendText} />
        <ReferenceLine y={0} stroke="var(--thc-gold-start)" strokeDasharray="4 4" strokeWidth={1.5} />
        <Bar
          dataKey="gainPercent"
          name="Potential Gain %"
          fill="url(#riskGainFill)"
          radius={[3, 3, 0, 0]}
          isAnimationActive={false}
        >
          <LabelList dataKey="gainPercent" content={makeEntryPriceLabel(data)} />
          <LabelList
            dataKey="gainPercent"
            content={makeRiskRewardLabel(data, "sellTargetPrice", "gainPercent", "top")}
          />
        </Bar>
        <Bar
          dataKey="lossPercent"
          name="Potential Risk %"
          fill="url(#riskLossFill)"
          radius={[0, 0, 3, 3]}
          isAnimationActive={false}
        >
          <LabelList
            dataKey="lossPercent"
            content={makeRiskRewardLabel(data, "sellSlPrice", "lossPercent", "bottom")}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function BestWorstBarChart({
  data,
}: {
  data: { label: string; pnlPercent: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 24 }}>
        <defs>
          <linearGradient id="bwWinFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--thc-win)" stopOpacity={0.95} />
            <stop offset="100%" stopColor="var(--thc-win)" stopOpacity={0.35} />
          </linearGradient>
          <linearGradient id="bwLossFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--thc-loss)" stopOpacity={0.95} />
            <stop offset="100%" stopColor="var(--thc-loss)" stopOpacity={0.35} />
          </linearGradient>
        </defs>
        {grid}
        <XAxis
          dataKey="label"
          tick={axisTick}
          angle={-90}
          textAnchor="end"
          interval={0}
          height={70}
        />
        <YAxis tick={axisTick} />
        <Tooltip contentStyle={chartTooltipStyle}
          labelStyle={chartTooltipLabelStyle}
          itemStyle={chartTooltipItemStyle}
        />
        <Bar dataKey="pnlPercent" name="P&L %" radius={[3, 3, 0, 0]} isAnimationActive={false}>
          {data.map((entry) => (
            <Cell
              key={entry.label}
              fill={entry.pnlPercent >= 0 ? "url(#bwWinFill)" : "url(#bwLossFill)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
