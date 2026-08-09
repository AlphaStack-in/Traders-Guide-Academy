"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy, Link2, Share2, X as CloseIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DashboardMetrics } from "@/lib/signal-metrics";
import {
  DashboardSnapshotCard,
  type SnapshotData,
} from "@/components/dashboard/dashboard-snapshot-card";
import { getRuntimeReferralUrl } from "@/lib/utils";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

interface DashboardShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metrics: DashboardMetrics;
  bestWorst?: { label: string; pnlPercent: number }[];
  rangeLabel: string;
  referralToken?: string | null;
  referralLink?: string;
}

export function DashboardShareModal({
  open,
  onOpenChange,
  metrics,
  bestWorst = [],
  rangeLabel,
  referralToken,
  referralLink,
}: DashboardShareModalProps) {
  const [tab, setTab] = useState<"text" | "snapshot">("text");

  if (!open) return null;

  const joinUrl = referralLink || getRuntimeReferralUrl(referralToken);

  // Dynamic calculations from current dashboard metrics
  const totalResolved = metrics.winCount + metrics.lossCount;
  const winRateStr = totalResolved > 0 ? ((metrics.winCount / totalResolved) * 100).toFixed(1) : "0.0";
  const perfSign = metrics.totalCapturePercent >= 0 ? "+" : "";
  const totalPerfStr = `${perfSign}${metrics.totalCapturePercent.toFixed(1)}%`;
  const avgGainSign = metrics.avgPercentPerTrade >= 0 ? "+" : "";
  const avgGainStr = `${avgGainSign}${metrics.avgPercentPerTrade.toFixed(1)}%`;
  const bestTradeStr = metrics.bestTradePercent != null ? `+${metrics.bestTradePercent.toFixed(1)}%` : "—";

  // Exciting, engaging performance message
  const shareMessage = `🚀 Exciting Results! Our signals are performing strong! 🔥\n\n🎯 Win Rate: ${winRateStr}%\n🏆 Total Performance: ${totalPerfStr}\n📈 Average Gain per Trade: ${avgGainStr}\n⭐ Best Trade: ${bestTradeStr}\n\n💪 Real signals. Real performance. Real results.\n\n🎁 Join our community and get access to our premium signals.\n\n👉 Join now:\n${joinUrl}`;

  const encodedMsg = encodeURIComponent(shareMessage);
  const encodedUrl = encodeURIComponent(joinUrl);

  function copyMessage() {
    navigator.clipboard.writeText(shareMessage);
    toast.success("Share message copied to clipboard!");
  }

  function copyReferralLink() {
    navigator.clipboard.writeText(joinUrl);
    toast.success("Referral link copied to clipboard!");
  }

  function handleInstagramShare() {
    copyMessage();
    toast.info("Message copied! Attach your snapshot image on Instagram.");
    window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
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
        // User cancelled share
      }
    } else {
      copyMessage();
    }
  }

  const snapshotData: SnapshotData = {
    rangeLabel,
    metrics,
    bestWorst,
    referralToken,
    referralUrl: joinUrl,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="thc-glass thc-gold-border relative flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 p-6 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              <h2 className="font-heading text-xl font-bold">Share Performance</h2>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Share our winning performance and invite friends!
            </p>
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

        {/* 2-Column Body Grid */}
        <div className="mt-4 grid flex-1 gap-6 overflow-y-auto lg:grid-cols-2">
          {/* LEFT SIDE: Text & Social Channels */}
          <div className="flex flex-col gap-4">
            {/* Mobile Tab Switcher */}
            <div className="flex rounded-lg border border-white/10 bg-black/40 p-1 lg:hidden">
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
                Dashboard Snapshot
              </button>
            </div>

            <div className={`flex flex-col gap-4 ${tab === "snapshot" ? "hidden lg:flex" : "flex"}`}>
              <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                  Generated Performance Message
                </p>
                <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm leading-relaxed text-foreground">
                  {shareMessage}
                </pre>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 gap-1.5 text-xs font-medium"
                  onClick={copyMessage}
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy Message
                </Button>

                <Button
                  size="sm"
                  className="thc-glow thc-btn-gradient h-9 gap-1.5 text-xs font-semibold"
                  onClick={copyReferralLink}
                >
                  <Link2 className="h-3.5 w-3.5" />
                  Copy Referral Link
                </Button>
              </div>

              {/* Social Channels Section */}
              <div className="mt-2">
                <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Share via Social Channel
                </p>

                <div className="flex flex-col gap-2">
                  {/* Row 1: WhatsApp | Telegram | Instagram */}
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="h-9 gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs"
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
                      className="h-9 gap-1 border-sky-500/30 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 text-xs"
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
                      size="sm"
                      variant="outline"
                      className="h-9 gap-1 border-pink-500/30 bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 text-xs"
                      onClick={handleInstagramShare}
                    >
                      <InstagramIcon className="h-3.5 w-3.5" />
                      Instagram
                    </Button>
                  </div>

                  {/* Row 2: X / Twitter | LinkedIn | Facebook */}
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="h-9 gap-1 border-white/20 bg-white/5 text-foreground hover:bg-white/10 text-xs"
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
                      className="h-9 gap-1 border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-xs"
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
                      className="h-9 gap-1 border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-xs"
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

                  {/* More Options / Web Share */}
                  {typeof window !== "undefined" && "share" in navigator && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 w-full gap-1.5 border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 text-xs mt-1"
                      onClick={handleNativeShare}
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      More Options (Web Share)
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Dashboard Snapshot Preview */}
          <div className={`flex flex-col gap-3 rounded-xl border border-white/10 bg-black/30 p-4 ${tab === "text" ? "hidden lg:flex" : "flex"}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Your Dashboard Snapshot
              </span>
              <span className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                {rangeLabel}
              </span>
            </div>

            <DashboardSnapshotCard
              data={snapshotData}
              onDownloaded={() => toast.success("Dashboard PNG snapshot downloaded!")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
