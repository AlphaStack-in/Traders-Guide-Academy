"use client";

import { useRef } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DashboardMetrics } from "@/lib/signal-metrics";
import { clientConfig } from "@/lib/client-config";

export interface SnapshotData {
  rangeLabel: string;
  metrics: DashboardMetrics;
  referralUrl?: string;
}

export function generateCanvasSnapshot(
  canvas: HTMLCanvasElement,
  data: SnapshotData,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = 800;
  const height = 450;
  canvas.width = width;
  canvas.height = height;

  // 1. Background gradient (dark theme)
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, "#0B0B0D");
  bgGrad.addColorStop(1, "#16161A");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Gold top border line
  const goldGrad = ctx.createLinearGradient(0, 0, width, 0);
  goldGrad.addColorStop(0, "#D4AF37");
  goldGrad.addColorStop(1, "#F0C949");
  ctx.fillStyle = goldGrad;
  ctx.fillRect(0, 0, width, 6);

  // 3. Brand Header
  ctx.fillStyle = "#F0C949";
  ctx.font = "bold 24px sans-serif";
  ctx.fillText(clientConfig.siteName.toUpperCase(), 40, 50);

  ctx.fillStyle = "#9CA3AF";
  ctx.font = "14px sans-serif";
  ctx.fillText(`Performance Snapshot • ${data.rangeLabel}`, 40, 75);

  // 4. Main Metric Card Box (Total % Won)
  ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
  ctx.strokeStyle = "rgba(212, 175, 55, 0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(40, 105, 340, 230, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#9CA3AF";
  ctx.font = "bold 12px sans-serif";
  ctx.fillText("TOTAL % WON", 64, 140);

  const totalPct = data.metrics.totalCapturePercent;
  ctx.fillStyle = totalPct >= 0 ? "#10B981" : "#EF4444";
  ctx.font = "bold 56px sans-serif";
  ctx.fillText(`${totalPct >= 0 ? "+" : ""}${totalPct.toFixed(1)}%`, 64, 215);

  ctx.fillStyle = "#D1D5DB";
  ctx.font = "14px sans-serif";
  const totalSignals = data.metrics.totalSignals;
  ctx.fillText(`${totalSignals} Total Signal${totalSignals === 1 ? "" : "s"} Analyzed`, 64, 255);

  // 5. Secondary Metric Cards Grid
  const drawStatBox = (x: number, y: number, w: number, h: number, label: string, val: string, color = "#F3F4F6") => {
    ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#9CA3AF";
    ctx.font = "bold 11px sans-serif";
    ctx.fillText(label.toUpperCase(), x + 16, y + 28);

    ctx.fillStyle = color;
    ctx.font = "bold 26px sans-serif";
    ctx.fillText(val, x + 16, y + 68);
  };

  const totalResolved = data.metrics.winCount + data.metrics.lossCount;
  const winRate = totalResolved > 0 ? (data.metrics.winCount / totalResolved) * 100 : 0;

  drawStatBox(410, 105, 165, 105, "Win Rate", `${winRate.toFixed(1)}%`, "#10B981");
  drawStatBox(595, 105, 165, 105, "Avg % / Trade", `${data.metrics.avgPercentPerTrade >= 0 ? "+" : ""}${data.metrics.avgPercentPerTrade.toFixed(1)}%`, data.metrics.avgPercentPerTrade >= 0 ? "#10B981" : "#EF4444");

  const bestVal = data.metrics.bestTradePercent != null ? `+${data.metrics.bestTradePercent.toFixed(1)}%` : "—";
  const worstVal = data.metrics.worstTradePercent != null ? `${data.metrics.worstTradePercent.toFixed(1)}%` : "—";

  drawStatBox(410, 230, 165, 105, "Best Trade", bestVal, "#10B981");
  drawStatBox(595, 230, 165, 105, "Worst Trade", worstVal, "#EF4444");

  // 6. Footer Banner with Referral/Join URL
  ctx.fillStyle = "rgba(240, 201, 73, 0.1)";
  ctx.strokeStyle = "rgba(240, 201, 73, 0.2)";
  ctx.beginPath();
  ctx.roundRect(40, 360, 720, 55, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#F0C949";
  ctx.font = "bold 14px sans-serif";
  const joinText = "Join Premium Signals:";
  ctx.fillText(joinText, 60, 393);

  const refUrl = data.referralUrl || `${process.env.NEXT_PUBLIC_APP_URL || "https://tradershubcenter.com"}/register`;
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "13px monospace";
  ctx.fillText(refUrl, 230, 393);
}

export function DashboardSnapshotCard({
  data,
  onDownloaded,
}: {
  data: SnapshotData;
  onDownloaded?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  function handleDownload() {
    if (!canvasRef.current) return;
    generateCanvasSnapshot(canvasRef.current, data);
    const link = document.createElement("a");
    link.download = `THC_Dashboard_Snapshot_${data.rangeLabel.replace(/\s+/g, "_")}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
    onDownloaded?.();
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-full overflow-hidden rounded-xl border border-white/10 shadow-2xl">
        <canvas
          ref={(node) => {
            canvasRef.current = node;
            if (node) generateCanvasSnapshot(node, data);
          }}
          className="h-auto w-full object-contain"
        />
      </div>
      <Button
        onClick={handleDownload}
        className="thc-glow thc-btn-gradient h-9 gap-2 font-medium"
      >
        <Download className="h-4 w-4" />
        Download Snapshot (PNG)
      </Button>
    </div>
  );
}
