"use client";

import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DashboardMetrics } from "@/lib/signal-metrics";

export interface SnapshotData {
  rangeLabel: string;
  metrics: DashboardMetrics;
  bestWorst?: { label: string; pnlPercent: number }[];
  referralToken?: string | null;
  referralUrl?: string;
}

export function DashboardSnapshotCard({
  snapshotUrl,
  isLoading = false,
  onDownload,
}: {
  data?: SnapshotData;
  snapshotUrl?: string | null;
  isLoading?: boolean;
  onDownload?: () => void;
  onDownloaded?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 w-full h-full max-w-full">
      <div className="relative w-full min-h-[300px] max-w-full overflow-hidden rounded-xl border border-white/10 bg-black/50 p-2 flex items-center justify-center">
        {isLoading || !snapshotUrl ? (
          <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Capturing exact live dashboard snapshot...
            </p>
          </div>
        ) : (
          <img
            src={snapshotUrl}
            alt="Exact Live Dashboard Snapshot"
            className="w-full h-auto max-w-full max-h-[50vh] sm:max-h-[60vh] object-contain rounded-lg block shadow-2xl"
          />
        )}
      </div>

      <Button
        onClick={onDownload}
        disabled={isLoading || !snapshotUrl}
        className="thc-glow thc-btn-gradient h-10 w-full gap-2 font-semibold text-sm shrink-0"
      >
        <Download className="h-4 w-4" />
        Download Snapshot (PNG)
      </Button>
    </div>
  );
}
