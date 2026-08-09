"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy, Share2, X as CloseIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DashboardMetrics } from "@/lib/signal-metrics";
import {
  DashboardSnapshotCard,
  type SnapshotData,
} from "@/components/dashboard/dashboard-snapshot-card";

interface DashboardShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metrics: DashboardMetrics;
  rangeLabel: string;
  referralLink?: string;
}

export function DashboardShareModal({
  open,
  onOpenChange,
  metrics,
  rangeLabel,
  referralLink,
}: DashboardShareModalProps) {
  const [tab, setTab] = useState<"text" | "snapshot">("text");

  if (!open) return null;

  const totalResolved = metrics.winCount + metrics.lossCount;
  const winRate = totalResolved > 0 ? ((metrics.winCount / totalResolved) * 100).toFixed(1) : "0.0";
  const perfSign = metrics.totalCapturePercent >= 0 ? "+" : "";
  const perfStr = `${perfSign}${metrics.totalCapturePercent.toFixed(1)}%`;
  const joinUrl = referralLink || (typeof window !== "undefined" ? `${window.location.origin}/register` : "https://tradershubcenter.com/register");

  const shareMessage = `📈 Our latest signal performance (${rangeLabel}):\nWin Rate: ${winRate}%\nSignals: ${metrics.totalSignals}\nPerformance: ${perfStr}\n\nJoin us and get access to our signals:\n${joinUrl}`;

  const encodedMsg = encodeURIComponent(shareMessage);
  const encodedUrl = encodeURIComponent(joinUrl);

  function copyMessage() {
    navigator.clipboard.writeText(shareMessage);
    toast.success("Share message copied to clipboard!");
  }

  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Traders Hub Center Performance",
          text: shareMessage,
          url: joinUrl,
        });
        toast.success("Shared successfully!");
      } catch {
        // User cancelled or share failed
      }
    } else {
      copyMessage();
    }
  }

  const snapshotData: SnapshotData = {
    rangeLabel,
    metrics,
    referralUrl: joinUrl,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="thc-glass thc-gold-border relative flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-white/10 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-lg font-bold">Share Performance</h2>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            onClick={() => onOpenChange(false)}
          >
            <CloseIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* Tab Toggle */}
        <div className="mt-4 flex rounded-lg border border-white/10 bg-black/40 p-1">
          <button
            type="button"
            onClick={() => setTab("text")}
            className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${
              tab === "text"
                ? "bg-primary/20 text-primary border border-primary/40"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Social Intent &amp; Text
          </button>
          <button
            type="button"
            onClick={() => setTab("snapshot")}
            className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${
              tab === "snapshot"
                ? "bg-primary/20 text-primary border border-primary/40"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            PNG Snapshot Image
          </button>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto pr-1">
          {tab === "text" ? (
            <div className="flex flex-col gap-4">
              <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                  Generated Share Message
                </p>
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                  {shareMessage}
                </pre>
                <div className="mt-3 flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 text-xs"
                    onClick={copyMessage}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy Message
                  </Button>
                </div>
              </div>

              <div>
                <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Share via Social Channel
                </p>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {typeof window !== "undefined" && "share" in navigator && (
                    <Button
                      size="sm"
                      className="thc-glow thc-btn-gradient h-9 gap-1.5 text-xs"
                      onClick={handleNativeShare}
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      Web Share
                    </Button>
                  )}

                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="h-9 gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs"
                  >
                    <a
                      href={`https://api.whatsapp.com/send?text=${encodedMsg}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      WhatsApp
                    </a>
                  </Button>

                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="h-9 gap-1.5 border-sky-500/30 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 text-xs"
                  >
                    <a
                      href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedMsg}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Telegram
                    </a>
                  </Button>

                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="h-9 gap-1.5 border-white/20 bg-white/5 text-foreground hover:bg-white/10 text-xs"
                  >
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodedMsg}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      X / Twitter
                    </a>
                  </Button>

                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="h-9 gap-1.5 border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-xs"
                  >
                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      LinkedIn
                    </a>
                  </Button>

                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="h-9 gap-1.5 border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-xs"
                  >
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Facebook
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <DashboardSnapshotCard
              data={snapshotData}
              onDownloaded={() => toast.success("Dashboard PNG snapshot downloaded!")}
            />
          )}
        </div>
      </div>
    </div>
  );
}
