"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, Download, Link2, Share2, X as CloseIcon } from "lucide-react";
import { toBlob, toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import type { DashboardMetrics } from "@/lib/signal-metrics";
import { DashboardSnapshotCard } from "@/components/dashboard/dashboard-snapshot-card";
import { getRuntimeReferralUrl } from "@/lib/utils";
import { clientConfig } from "@/lib/client-config";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
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
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

export function DashboardShareModal({
  open,
  onOpenChange,
  metrics,
  bestWorst = [],
  rangeLabel,
  referralToken,
  referralLink,
  containerRef,
}: DashboardShareModalProps) {
  const [tab, setTab] = useState<"text" | "snapshot">("text");
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);
  const [snapshotBlob, setSnapshotBlob] = useState<Blob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const joinUrl = referralLink || getRuntimeReferralUrl(referralToken);

  // Dynamic calculations from current dashboard metrics
  const totalResolved = metrics.winCount + metrics.lossCount;
  const winRateStr = totalResolved > 0 ? ((metrics.winCount / totalResolved) * 100).toFixed(1) : "0.0";
  const perfSign = metrics.totalCapturePercent >= 0 ? "+" : "";
  const totalPerfStr = `${perfSign}${metrics.totalCapturePercent.toFixed(1)}%`;
  const avgGainSign = metrics.avgPercentPerTrade >= 0 ? "+" : "";
  const avgGainStr = `${avgGainSign}${metrics.avgPercentPerTrade.toFixed(1)}%`;
  const bestTradeStr = metrics.bestTradePercent != null ? `+${metrics.bestTradePercent.toFixed(1)}%` : "—";

  // Context-aware dynamic opening based on selected date filter
  const getOpeningHeader = (range: string) => {
    const lower = range.toLowerCase();
    if (lower.includes("today")) {
      return "🚨🔥 TODAY'S TRADES ARE ON FIRE! 🔥🚨";
    }
    if (lower.includes("week")) {
      return "🚀🔥 WHAT A WEEK FOR OUR TRADES! 🔥🚀";
    }
    if (lower.includes("month")) {
      return "🏆🔥 WHAT A MONTH! OUR TRADES ARE HITTING BULLS-EYE! 🔥";
    }
    if (lower.includes("custom") || lower.includes("to")) {
      return "📊🔥 HERE'S WHAT WE DELIVERED! 🔥📊";
    }
    return "🚀🏆 THE RESULTS SPEAK FOR THEMSELVES! 🏆🚀";
  };

  const openingHeader = getOpeningHeader(rangeLabel);
  const brandName = clientConfig.siteName.toUpperCase();

  // Exciting, emotional, high-converting social share message
  const shareMessage = `${openingHeader}\n\nThe markets have been rewarding us! 📈\n\n🎯 Win Rate: ${winRateStr}%\n🏆 Total Performance: ${totalPerfStr}\n📈 Avg. Gain / Trade: ${avgGainStr}\n⭐ Best Trade: ${bestTradeStr}\n\n💥 Consistent signals. Powerful moves. Real market results.\n🔥 The next opportunity could be just around the corner.\n\nImagine having these signals delivered to you while the next opportunity unfolds. 👀\n\n🎁 Want to be part of it? JOIN ${brandName}\n\n🔗 ${joinUrl}\n\n🚀 Don't just watch the market. Be ready for the next move.\n\n⚠️ Past performance does not guarantee future results.`;

  const encodedMsg = encodeURIComponent(shareMessage);
  const encodedUrl = encodeURIComponent(joinUrl);

  const captureSnapshot = useCallback(async () => {
    const element =
      containerRef?.current || document.getElementById("dashboard-snapshot-container");
    if (!element) return null;

    setIsGenerating(true);
    try {
      // Small settle delay for SVGs and animations
      await new Promise((resolve) => setTimeout(resolve, 80));

      const dataUrl = await toPng(element, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#090a0f",
        style: {
          transform: "none",
          margin: "0",
        },
      });

      const blob = await toBlob(element, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#090a0f",
        style: {
          transform: "none",
          margin: "0",
        },
      });

      setSnapshotUrl(dataUrl);
      setSnapshotBlob(blob);
      return { dataUrl, blob };
    } catch (err) {
      console.error("Failed to capture exact dashboard snapshot:", err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [containerRef]);

  useEffect(() => {
    if (open) {
      captureSnapshot();
    } else {
      setSnapshotUrl(null);
      setSnapshotBlob(null);
    }
  }, [open, captureSnapshot]);

  async function handleDownloadSnapshot() {
    let url = snapshotUrl;
    if (!url) {
      const res = await captureSnapshot();
      url = res?.dataUrl || null;
    }
    if (!url) {
      toast.error("Failed to capture snapshot image.");
      return;
    }

    const link = document.createElement("a");
    const safeLabel = rangeLabel.replace(/[^a-zA-Z0-9]/g, "_");
    const brandPrefix = clientConfig.siteNameShort || clientConfig.siteName.replace(/[^a-zA-Z0-9]/g, "_");
    link.download = `${brandPrefix}_Dashboard_Snapshot_${safeLabel}.png`;
    link.href = url;
    link.click();
    toast.success("Dashboard PNG snapshot downloaded!");
  }

  function copyMessage() {
    navigator.clipboard.writeText(shareMessage);
    toast.success("Share message copied to clipboard!");
  }

  function copyReferralLink() {
    navigator.clipboard.writeText(joinUrl);
    toast.success("Referral link copied to clipboard!");
  }

  async function handleInstagramShare() {
    copyMessage();
    await handleDownloadSnapshot();
    toast.info("Message copied & Snapshot downloaded! Attach your image on Instagram.");
    window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
  }

  async function handleWhatsAppShare() {
    await handleDownloadSnapshot();
    toast.info("Opening WhatsApp... Your snapshot image has been downloaded to attach!");
    window.open(`https://api.whatsapp.com/send?text=${encodedMsg}`, "_blank", "noopener,noreferrer");
  }

  async function handleTelegramShare() {
    await handleDownloadSnapshot();
    toast.info("Opening Telegram... Your snapshot image has been downloaded to attach!");
    window.open(`https://t.me/share/url?url=${encodedUrl}&text=${encodedMsg}`, "_blank", "noopener,noreferrer");
  }

  async function handleSocialShare(shareTargetUrl: string) {
    await handleDownloadSnapshot();
    window.open(shareTargetUrl, "_blank", "noopener,noreferrer");
  }

  async function handleNativeShare() {
    let blob = snapshotBlob;
    let url = snapshotUrl;

    if (!blob || !url) {
      const res = await captureSnapshot();
      blob = res?.blob || null;
      url = res?.dataUrl || null;
    }

    if (navigator.share) {
      try {
        const safeLabel = rangeLabel.replace(/[^a-zA-Z0-9]/g, "_");
        const brandPrefix = clientConfig.siteNameShort || "Dashboard";
        const fileName = `${brandPrefix}_Snapshot_${safeLabel}.png`;

        if (blob && typeof File !== "undefined") {
          const file = new File([blob], fileName, { type: "image/png" });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: `${clientConfig.siteName} Performance`,
              text: shareMessage,
              files: [file],
            });
            toast.success("Shared successfully!");
            return;
          }
        }

        // Web Share API fallback without file attachment
        await navigator.share({
          title: `${clientConfig.siteName} Performance`,
          text: shareMessage,
          url: joinUrl,
        });
        toast.success("Shared successfully!");
      } catch {
        // User cancelled share window
      }
    } else {
      copyMessage();
    }
  }

  if (!open) return null;

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
                      size="sm"
                      variant="outline"
                      className="h-9 gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs"
                      onClick={handleWhatsAppShare}
                    >
                      WhatsApp
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 gap-1 border-sky-500/30 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 text-xs"
                      onClick={handleTelegramShare}
                    >
                      Telegram
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
                      size="sm"
                      variant="outline"
                      className="h-9 gap-1 border-white/20 bg-white/5 text-foreground hover:bg-white/10 text-xs"
                      onClick={() =>
                        handleSocialShare(`https://twitter.com/intent/tweet?text=${encodedMsg}`)
                      }
                    >
                      X / Twitter
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 gap-1 border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-xs"
                      onClick={() =>
                        handleSocialShare(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`)
                      }
                    >
                      LinkedIn
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 gap-1 border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-xs"
                      onClick={() =>
                        handleSocialShare(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`)
                      }
                    >
                      Facebook
                    </Button>
                  </div>

                  {/* More Options / Web Share */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 w-full gap-1.5 border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 text-xs mt-1"
                    onClick={handleNativeShare}
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    Share Image + Message (Web Share)
                  </Button>
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
              snapshotUrl={snapshotUrl}
              isLoading={isGenerating}
              onDownload={handleDownloadSnapshot}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
