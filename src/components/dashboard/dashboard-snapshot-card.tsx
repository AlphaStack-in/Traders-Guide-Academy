"use client";

import { useEffect, useRef } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DashboardMetrics } from "@/lib/signal-metrics";
import { clientConfig } from "@/lib/client-config";
import { getRuntimeReferralUrl } from "@/lib/utils";

export interface SnapshotData {
  rangeLabel: string;
  metrics: DashboardMetrics;
  bestWorst?: { label: string; pnlPercent: number }[];
  referralToken?: string | null;
  referralUrl?: string;
}

export function drawFullDashboardCanvas(
  canvas: HTMLCanvasElement,
  data: SnapshotData,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = 1200;
  const height = 900;
  const scale = 2; // High-DPI 2x super-sampling for crisp rendering

  canvas.width = width * scale;
  canvas.height = height * scale;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  ctx.save();
  ctx.scale(scale, scale);

  // 1. Background
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, "#090A0F");
  bgGrad.addColorStop(0.5, "#0E0F17");
  bgGrad.addColorStop(1, "#141622");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle grid background texture
  ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // 2. Gold Top Border
  const goldGrad = ctx.createLinearGradient(0, 0, width, 0);
  goldGrad.addColorStop(0, "#B8860B");
  goldGrad.addColorStop(0.5, "#FFD700");
  goldGrad.addColorStop(1, "#B8860B");
  ctx.fillStyle = goldGrad;
  ctx.fillRect(0, 0, width, 5);

  // 3. Header: Brand Logo & Title + Date Range Badge
  ctx.fillStyle = "#FFD700";
  ctx.font = "bold 26px sans-serif";
  ctx.fillText(clientConfig.siteName.toUpperCase(), 40, 48);

  ctx.fillStyle = "#9CA3AF";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText("PERFORMANCE DASHBOARD SNAPSHOT", 40, 72);

  // Date Range Badge (Pill)
  const badgeText = `Range: ${data.rangeLabel}`;
  ctx.font = "bold 12px sans-serif";
  const badgeWidth = ctx.measureText(badgeText).width + 24;
  ctx.fillStyle = "rgba(212, 175, 55, 0.15)";
  ctx.strokeStyle = "rgba(212, 175, 55, 0.4)";
  ctx.beginPath();
  ctx.roundRect(width - 40 - badgeWidth, 32, badgeWidth, 32, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#FFD700";
  ctx.fillText(badgeText, width - 40 - badgeWidth + 12, 53);

  // Card background helper
  const drawCard = (x: number, y: number, w: number, h: number, title?: string) => {
    ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 14);
    ctx.fill();
    ctx.stroke();

    if (title) {
      ctx.fillStyle = "#9CA3AF";
      ctx.font = "bold 12px sans-serif";
      ctx.fillText(title.toUpperCase(), x + 16, y + 26);
    }
  };

  // --- SECTION 1: CUMULATIVE % PERFORMANCE (LEFT) & DONUT (RIGHT) ---
  drawCard(40, 95, 740, 260, "1. Cumulative % Performance");

  // Total % Won Banner Box
  ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
  ctx.strokeStyle = "rgba(212, 175, 55, 0.3)";
  ctx.beginPath();
  ctx.roundRect(60, 135, 200, 200, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#9CA3AF";
  ctx.font = "bold 11px sans-serif";
  ctx.fillText("TOTAL % WON", 76, 165);

  const totalCap = data.metrics.totalCapturePercent;
  const capSign = totalCap >= 0 ? "+" : "";
  ctx.fillStyle = totalCap >= 0 ? "#10B981" : "#EF4444";
  ctx.font = "bold 40px sans-serif";
  ctx.fillText(`${capSign}${totalCap.toFixed(1)}%`, 76, 220);

  ctx.fillStyle = "#9CA3AF";
  ctx.font = "12px sans-serif";
  ctx.fillText(`${data.metrics.totalSignals} signals analyzed`, 76, 255);

  // Cumulative Line Chart Area
  const chartX = 280;
  const chartY = 135;
  const chartW = 480;
  const chartH = 200;

  // Grid lines inside line chart
  ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const gy = chartY + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(chartX, gy);
    ctx.lineTo(chartX + chartW, gy);
    ctx.stroke();
  }

  // Draw cumulative curve
  const series = data.metrics.cumulativeSeries;
  if (series.length > 0) {
    const minVal = Math.min(0, ...series.map((s) => s.cumulativePercent));
    const maxVal = Math.max(10, ...series.map((s) => s.cumulativePercent));
    const valRange = maxVal - minVal || 1;

    const points = series.map((s, idx) => {
      const px = chartX + (idx / Math.max(1, series.length - 1)) * chartW;
      const py = chartY + chartH - ((s.cumulativePercent - minVal) / valRange) * (chartH - 20) - 10;
      return { x: px, y: py };
    });

    // Area Fill
    ctx.beginPath();
    ctx.moveTo(points[0].x, chartY + chartH);
    points.forEach((pt) => ctx.lineTo(pt.x, pt.y));
    ctx.lineTo(points[points.length - 1].x, chartY + chartH);
    ctx.closePath();

    const lineGrad = ctx.createLinearGradient(0, chartY, 0, chartY + chartH);
    lineGrad.addColorStop(0, "rgba(240, 201, 73, 0.35)");
    lineGrad.addColorStop(1, "rgba(240, 201, 73, 0.01)");
    ctx.fillStyle = lineGrad;
    ctx.fill();

    // Curve Line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach((pt) => ctx.lineTo(pt.x, pt.y));
    ctx.strokeStyle = "#F0C949";
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  // Total % Won by Instrument (Donut Right)
  drawCard(800, 95, 360, 260, "Total % Won by Instrument");
  // Donut Circle
  const cx = 980;
  const cy = 230;
  const outerR = 65;
  const innerR = 40;

  const instData = data.metrics.instrumentCapture;
  const totalInstVal = instData.reduce((acc, curr) => acc + Math.max(0, curr.capturePercent), 0) || 1;
  const colors = ["#FFE066", "#FFD700", "#B8860B", "#7A5C0E"];
  let startAngle = -Math.PI / 2;

  instData.forEach((item, i) => {
    const sliceVal = Math.max(0, item.capturePercent);
    const sliceAngle = (sliceVal / totalInstVal) * (Math.PI * 2);
    const endAngle = startAngle + sliceAngle;

    ctx.beginPath();
    ctx.arc(cx, cy, outerR, startAngle, endAngle);
    ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();

    startAngle = endAngle;
  });

  // Legend
  instData.forEach((item, i) => {
    const lx = 820 + (i % 2) * 160;
    const ly = 135 + Math.floor(i / 2) * 22;
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect(lx, ly, 10, 10);

    ctx.fillStyle = "#D1D5DB";
    ctx.font = "11px sans-serif";
    ctx.fillText(`${item.instrument}: ${item.capturePercent.toFixed(1)}%`, lx + 16, ly + 9);
  });

  // --- SECTION 2: KPI CARDS ---
  const kpiW = 270;
  const kpiH = 95;
  const kpiY = 370;

  // 1. Total Signals
  drawCard(40, kpiY, kpiW, kpiH, "Total Signals");
  ctx.fillStyle = "#F3F4F6";
  ctx.font = "bold 32px sans-serif";
  ctx.fillText(String(data.metrics.totalSignals), 56, kpiY + 70);

  // 2. Avg % / Trade
  drawCard(330, kpiY, kpiW, kpiH, "Avg % / Trade");
  const avgVal = data.metrics.avgPercentPerTrade;
  ctx.fillStyle = avgVal >= 0 ? "#10B981" : "#EF4444";
  ctx.font = "bold 32px sans-serif";
  ctx.fillText(`${avgVal >= 0 ? "+" : ""}${avgVal.toFixed(1)}%`, 346, kpiY + 70);

  // 3. Best Trade
  drawCard(620, kpiY, kpiW, kpiH, "Best Trade");
  const bestVal = data.metrics.bestTradePercent != null ? `+${data.metrics.bestTradePercent.toFixed(1)}%` : "—";
  ctx.fillStyle = "#10B981";
  ctx.font = "bold 32px sans-serif";
  ctx.fillText(bestVal, 636, kpiY + 70);

  // 4. Worst Trade
  drawCard(910, kpiY, kpiW, kpiH, "Worst Trade");
  const worstVal = data.metrics.worstTradePercent != null ? `${data.metrics.worstTradePercent.toFixed(1)}%` : "—";
  ctx.fillStyle = "#EF4444";
  ctx.font = "bold 32px sans-serif";
  ctx.fillText(worstVal, 926, kpiY + 70);

  // --- SECTION 3: WIN RATE & CHARTS ---
  const gridY = 480;
  const colW = 360;
  const colH = 260;

  // Win Rate Donut
  drawCard(40, gridY, colW, colH, "2. Win Rate");
  const winCx = 220;
  const winCy = 610;
  const totalResolved = data.metrics.winCount + data.metrics.lossCount;
  const winPct = totalResolved > 0 ? (data.metrics.winCount / totalResolved) * 100 : 0;
  const winAngle = (winPct / 100) * (Math.PI * 2);

  // Loss arc
  ctx.beginPath();
  ctx.arc(winCx, winCy, 65, -Math.PI / 2, Math.PI * 1.5);
  ctx.arc(winCx, winCy, 45, Math.PI * 1.5, -Math.PI / 2, true);
  ctx.fillStyle = "rgba(239, 68, 68, 0.8)";
  ctx.fill();

  // Win arc
  ctx.beginPath();
  ctx.arc(winCx, winCy, 65, -Math.PI / 2, -Math.PI / 2 + winAngle);
  ctx.arc(winCx, winCy, 45, -Math.PI / 2 + winAngle, -Math.PI / 2, true);
  ctx.fillStyle = "#10B981";
  ctx.fill();

  // Center Win % Text
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 22px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${winPct.toFixed(1)}%`, winCx, winCy + 8);
  ctx.textAlign = "left";

  // Profit vs Loss % by Day Bar Chart
  drawCard(420, gridY, 360, colH, "3. Profit vs Loss % by Day");
  const dayBars = data.metrics.winLossByDay.slice(-6);
  const barX = 440;
  const barY = 525;
  const barW = 320;
  const barH = 190;

  if (dayBars.length > 0) {
    const maxVal = Math.max(10, ...dayBars.map((d) => Math.max(d.profitPercent, Math.abs(d.lossPercent))));
    const slotW = barW / dayBars.length;

    dayBars.forEach((d, idx) => {
      const bx = barX + idx * slotW + slotW * 0.15;
      const bw = slotW * 0.35;

      // Green profit bar
      const ph = (d.profitPercent / maxVal) * (barH - 30);
      ctx.fillStyle = "#10B981";
      ctx.fillRect(bx, barY + (barH - 30) - ph, bw, ph);

      // Red loss bar
      const lh = (Math.abs(d.lossPercent) / maxVal) * (barH - 30);
      ctx.fillStyle = "#EF4444";
      ctx.fillRect(bx + bw + 2, barY + (barH - 30) - lh, bw, lh);
    });
  }

  // Best & Worst Trades Bar Chart
  drawCard(800, gridY, 360, colH, "4. Best & Worst Trades");
  const bwData = (data.bestWorst || []).slice(0, 5);
  const bwX = 820;
  const bwY = 525;

  bwData.forEach((item, idx) => {
    const ry = bwY + idx * 38;
    ctx.fillStyle = "#D1D5DB";
    ctx.font = "11px sans-serif";
    ctx.fillText(item.label, bwX, ry + 12);

    const barLength = Math.min(180, Math.abs(item.pnlPercent) * 2.5);
    ctx.fillStyle = item.pnlPercent >= 0 ? "#10B981" : "#EF4444";
    ctx.fillRect(bwX + 100, ry + 2, barLength, 14);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 11px sans-serif";
    const sign = item.pnlPercent >= 0 ? "+" : "";
    ctx.fillText(`${sign}${item.pnlPercent.toFixed(1)}%`, bwX + 110 + barLength, ry + 13);
  });

  // --- FOOTER BANNER WITH RUNTIME REFERRAL LINK ---
  const joinUrl = data.referralUrl || getRuntimeReferralUrl(data.referralToken);
  const footerY = 760;
  const footerH = 100;

  ctx.fillStyle = "rgba(212, 175, 55, 0.1)";
  ctx.strokeStyle = "rgba(212, 175, 55, 0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(40, footerY, 1120, footerH, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#FFD700";
  ctx.font = "bold 16px sans-serif";
  ctx.fillText("🎁 Join our community and get access to our premium signals:", 64, footerY + 40);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 15px monospace";
  ctx.fillText(joinUrl, 64, footerY + 75);

  ctx.restore();
}

export function DashboardSnapshotCard({
  data,
  onDownloaded,
}: {
  data: SnapshotData;
  onDownloaded?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      drawFullDashboardCanvas(canvasRef.current, data);
    }
  }, [data]);

  function handleDownload() {
    if (!canvasRef.current) return;
    drawFullDashboardCanvas(canvasRef.current, data);
    const link = document.createElement("a");
    const safeLabel = data.rangeLabel.replace(/[^a-zA-Z0-9]/g, "_");
    link.download = `THC_Dashboard_Snapshot_${safeLabel}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
    onDownloaded?.();
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="w-full overflow-hidden rounded-xl border border-white/10 shadow-2xl bg-black/40 p-2">
        <canvas
          ref={canvasRef}
          className="h-auto w-full object-contain rounded-lg"
        />
      </div>
      <Button
        onClick={handleDownload}
        className="thc-glow thc-btn-gradient h-10 w-full gap-2 font-semibold text-sm"
      >
        <Download className="h-4 w-4" />
        Download Snapshot (PNG)
      </Button>
    </div>
  );
}
