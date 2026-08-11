"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Award,
  BarChart3,
  CheckCircle2,
  Clock,
  Copy,
  Flame,
  Gift,
  History,
  Info,
  Link2,
  QrCode,
  Share2,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Wallet,
  X as CloseIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatSignalDate, formatSignalTime } from "@/lib/utils";
import { clientConfig } from "@/lib/client-config";
import { QrCodeView } from "@/components/refer/qr-code-view";
import { claimSocialRewardAction, redeemCreditAction } from "@/app/account/refer/actions";
import { REFERRAL_CONFIG } from "@/lib/referral-config";

export interface ReferralHistoryRow {
  id: string;
  maskedName: string;
  maskedContact: string;
  referralStatus:
    | "INVITED"
    | "REGISTERED"
    | "PAYMENT_PENDING"
    | "SUCCESSFUL"
    | "REWARD_CREDITED"
    | "REDEEMED"
    | "JOINED"
    | "NOT_JOINED";
  plan: string;
  rewardAmount: number;
  createdAt: string;
}

export interface RewardTransactionRow {
  id: string;
  type: "REFERRAL_REWARD" | "SOCIAL_PROMOTION" | "SUBSCRIPTION_REDEMPTION" | "ADJUSTMENT";
  amount: number;
  status: "CREDITED" | "PENDING" | "REDEEMED";
  description: string;
  createdAt: string;
}

export interface LeaderboardRow {
  rank: number;
  displayName: string;
  referralCount: number;
  totalEarned: number;
}

export interface ReferEarnViewProps {
  subscriberName: string;
  totalEarned: number;
  availableCredit: number;
  pendingRewards: number;
  successfulReferralsCount: number;
  redeemedAmount: number;
  todaySocialReward: number;
  monthSocialReward: number;
  lifetimeSocialReward: number;
  isSocialRewardClaimedToday: boolean;
  monthlyStreakCount: number;
  referralLink: string;
  referralHistory: ReferralHistoryRow[];
  rewardTransactions: RewardTransactionRow[];
  leaderboard: LeaderboardRow[];
}

export function ReferEarnView({
  subscriberName,
  totalEarned,
  availableCredit,
  pendingRewards,
  successfulReferralsCount,
  redeemedAmount,
  todaySocialReward,
  monthSocialReward,
  lifetimeSocialReward,
  isSocialRewardClaimedToday,
  monthlyStreakCount,
  referralLink,
  referralHistory,
  rewardTransactions,
  leaderboard,
}: ReferEarnViewProps) {
  const [showQr, setShowQr] = useState(false);
  const [isClaimingSocial, setIsClaimingSocial] = useState(false);
  const [socialClaimed, setSocialClaimed] = useState(isSocialRewardClaimedToday);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);

  const brandName = clientConfig.siteName;

  function copyLink() {
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied to clipboard!");
  }

  async function handleNativeShare() {
    const shareData = {
      title: `Join ${brandName} Premium`,
      text: `Join me on ${brandName} Premium for verified intraday option signal alerts!`,
      url: referralLink,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success("Share initiated!");
      } catch {
        copyLink();
      }
    } else {
      copyLink();
    }
  }

  async function handlePromoteAndEarn(platform: string) {
    if (socialClaimed) {
      toast.info("Today's ₹10 social reward is already claimed!");
      return;
    }

    setIsClaimingSocial(true);
    try {
      // Launch social intent
      const encodedMsg = encodeURIComponent(
        `🔥 Check out our verified signal performance on ${brandName}!\n\nJoin here: ${referralLink}`
      );
      if (platform === "WHATSAPP") {
        window.open(`https://api.whatsapp.com/send?text=${encodedMsg}`, "_blank", "noopener,noreferrer");
      } else if (platform === "TELEGRAM") {
        window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodedMsg}`, "_blank", "noopener,noreferrer");
      } else if (platform === "TWITTER") {
        window.open(`https://twitter.com/intent/tweet?text=${encodedMsg}`, "_blank", "noopener,noreferrer");
      } else {
        await handleNativeShare();
      }

      // Claim reward server-side
      const res = await claimSocialRewardAction(platform);
      if (res.success) {
        setSocialClaimed(true);
        toast.success("Today's reward: ₹10 subscription credit credited!");
      } else if (res.alreadyClaimed) {
        setSocialClaimed(true);
        toast.info(res.error || "Today's social promotion reward (₹10) has already been claimed!");
      } else {
        toast.error(res.error || "Failed to claim social promotion reward.");
      }
    } catch {
      toast.error("Failed to process social promotion reward.");
    } finally {
      setIsClaimingSocial(false);
    }
  }

  async function handleConfirmRedeem() {
    if (availableCredit <= 0) {
      toast.error("You do not have any available credit balance to redeem.");
      return;
    }

    setIsRedeeming(true);
    try {
      const res = await redeemCreditAction(availableCredit);
      if (res.success) {
        toast.success(`Successfully queued ₹${availableCredit.toLocaleString("en-IN")} subscription credit for your next renewal!`);
        setShowRedeemModal(false);
      } else {
        toast.error(res.error || "Failed to redeem subscription credit.");
      }
    } catch {
      toast.error("Failed to process credit redemption.");
    } finally {
      setIsRedeeming(false);
    }
  }

  // Calculate milestone progress
  const milestones = REFERRAL_CONFIG.MILESTONE_THRESHOLDS; // [1, 3, 5, 10]
  const nextMilestone = milestones.find((m) => m > successfulReferralsCount) || milestones[milestones.length - 1];
  const prevMilestone = [...milestones].reverse().find((m) => m <= successfulReferralsCount) || 0;
  const neededForNext = Math.max(0, nextMilestone - successfulReferralsCount);
  const milestoneProgressPct =
    nextMilestone === prevMilestone
      ? 100
      : Math.min(100, Math.max(0, ((successfulReferralsCount - prevMilestone) / (nextMilestone - prevMilestone)) * 100));

  return (
    <div className="flex flex-col gap-8">
      {/* 1. TOP HERO HEADER */}
      <div className="thc-glass thc-gold-border relative overflow-hidden rounded-3xl p-6 sm:p-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary thc-glow mb-3">
              <Sparkles className="h-3.5 w-3.5" />
              <span>₹1,000 PER SUCCESSFUL REFERRAL</span>
            </div>
            <h1 className="font-heading text-2xl font-bold sm:text-4xl">
              Refer Friends. Earn <span className="thc-gold-text">Subscription Credits</span>. Trade Together.
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Invite friends to {brandName} and earn ₹1,000 toward your next subscription renewal for every successful referral.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 mt-2 lg:mt-0">
            <Button
              className="thc-glow thc-btn-gradient h-11 gap-2 px-6 font-semibold text-xs sm:text-sm"
              onClick={copyLink}
            >
              <Copy className="h-4 w-4" />
              Copy Referral Link
            </Button>
            <Button
              variant="outline"
              className="h-11 gap-2 border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 font-semibold text-xs sm:text-sm"
              onClick={() => setShowRedeemModal(true)}
            >
              <Wallet className="h-4 w-4" />
              Redeem Credits (₹{availableCredit.toLocaleString("en-IN")})
            </Button>
          </div>
        </div>
      </div>

      {/* 2. 5 PROMINENT STAT CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* TOTAL EARNED */}
        <div className="thc-glass thc-gold-border relative flex flex-col justify-between overflow-hidden rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Earned
            </span>
            <Gift className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-3 font-heading text-3xl font-bold thc-gold-text">
            ₹{totalEarned.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">Lifetime referral &amp; social credits</p>
        </div>

        {/* AVAILABLE CREDIT */}
        <div className="thc-glass relative flex flex-col justify-between overflow-hidden rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Available Credit
            </span>
            <Wallet className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-3 font-heading text-3xl font-bold text-emerald-400">
            ₹{availableCredit.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-[11px] text-emerald-500/80">Ready for next subscription pack</p>
        </div>

        {/* PENDING REWARDS */}
        <div className="thc-glass relative flex flex-col justify-between overflow-hidden rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              Pending Rewards
            </span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-3 font-heading text-3xl font-bold text-amber-400">
            ₹{pendingRewards.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-[11px] text-amber-500/80">Awaiting subscription qualification</p>
        </div>

        {/* SUCCESSFUL REFERRALS */}
        <div className="thc-glass relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Successful Referrals
            </span>
            <Users className="h-4 w-4 text-sky-400" />
          </div>
          <p className="mt-3 font-heading text-3xl font-bold text-sky-400">
            {successfulReferralsCount}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">Verified paid subscribers</p>
        </div>

        {/* REDEEMED */}
        <div className="thc-glass relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Redeemed Credit
            </span>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-3 font-heading text-3xl font-bold text-muted-foreground">
            ₹{redeemedAmount.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">Used toward past subscriptions</p>
        </div>
      </div>

      {/* 3. PRIMARY REFERRAL CARD */}
      <div className="thc-glass relative flex flex-col gap-6 rounded-2xl border border-white/10 p-6 sm:p-8">
        <div>
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-lg font-bold">Your Unique Referral Link</h2>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Share your custom referral URL. Anyone who registers and activates a subscription using your link credits ₹1,000 to your account.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            readOnly
            value={referralLink}
            className="h-11 flex-1 font-mono text-xs sm:text-sm bg-black/40 border-white/10 text-foreground"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              className="thc-glow thc-btn-gradient h-11 gap-1.5 px-5 font-semibold text-xs"
              onClick={copyLink}
            >
              <Copy className="h-3.5 w-3.5" />
              Copy Link
            </Button>
            <Button
              variant="outline"
              className="h-11 gap-1.5 text-xs"
              onClick={handleNativeShare}
            >
              <Share2 className="h-3.5 w-3.5 text-primary" />
              Share Link
            </Button>
            <Button
              variant="outline"
              className="h-11 w-11 p-0"
              title="Show QR Code"
              onClick={() => setShowQr((prev) => !prev)}
            >
              <QrCode className="h-4 w-4 text-primary" />
            </Button>
          </div>
        </div>

        {/* QR Code Collapsible */}
        {showQr && (
          <div className="mt-2 flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-black/40 p-6 text-center">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Scan QR Code to Register</p>
            <QrCodeView value={referralLink} size={180} />
            <p className="text-xs text-muted-foreground">Point smartphone camera to open registration</p>
          </div>
        )}
      </div>

      {/* 4. HOW IT WORKS FLOW */}
      <div className="thc-glass relative flex flex-col gap-6 rounded-2xl border border-white/10 p-6">
        <div>
          <h2 className="font-heading text-lg font-bold">How Referral Credits Work</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Simple, transparent 4-step process to earn subscription credits.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Step 1 */}
          <div className="flex flex-col gap-2 rounded-xl border border-white/5 bg-black/30 p-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
              01
            </div>
            <h3 className="font-heading text-sm font-semibold text-foreground">INVITE</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Share your custom referral link or QR code with fellow traders.
            </p>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col gap-2 rounded-xl border border-white/5 bg-black/30 p-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
              02
            </div>
            <h3 className="font-heading text-sm font-semibold text-foreground">FRIEND JOINS</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Your friend completes registration using your referral link.
            </p>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col gap-2 rounded-xl border border-white/5 bg-black/30 p-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
              03
            </div>
            <h3 className="font-heading text-sm font-semibold text-foreground">FRIEND SUBSCRIBES</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Your friend purchases an eligible subscription pack.
            </p>
          </div>

          {/* Step 4 */}
          <div className="flex flex-col gap-2 rounded-xl border border-white/5 bg-black/30 p-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
              04
            </div>
            <h3 className="font-heading text-sm font-semibold text-foreground">YOU EARN</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              ₹1,000 subscription credit is added directly to your account.
            </p>
          </div>
        </div>

        <p className="text-center text-[11px] text-muted-foreground/80 italic">
          ⚠️ Note: Subscription credit is awarded only after the referred user completes an eligible paid subscription.
        </p>
      </div>

      {/* 5. PROMOTE & EARN (₹10/DAY SOCIAL PROMOTION) */}
      <div className="thc-glass thc-gold-border relative flex flex-col gap-6 rounded-2xl p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="font-heading text-lg font-bold">Promote &amp; Earn (₹10 / Day)</h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Share our latest signal performance on social channels and earn ₹10 daily subscription credit!
            </p>
          </div>

          {/* Social Stats Pill */}
          <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-xs">
            <div>
              <span className="text-muted-foreground block text-[10px]">Today</span>
              <span className="font-bold text-emerald-400">₹{todaySocialReward}</span>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div>
              <span className="text-muted-foreground block text-[10px]">This Month</span>
              <span className="font-bold text-primary">₹{monthSocialReward}</span>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div>
              <span className="text-muted-foreground block text-[10px]">Lifetime</span>
              <span className="font-bold text-foreground">₹{lifetimeSocialReward}</span>
            </div>
          </div>
        </div>

        {/* Promotion Action Card */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col justify-between gap-4 rounded-xl border border-white/10 bg-black/30 p-4">
            <div className="space-y-1.5 text-xs">
              <p className="font-semibold text-foreground">📣 Share. Promote. Earn.</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Share our verified performance report with your network</li>
                <li>• Earn ₹10/day subscription credit (max 1 reward/day)</li>
                <li>• Build your promotion streak &amp; redeem toward subscriptions</li>
              </ul>
            </div>

            {socialClaimed ? (
              <Badge variant="outline" className="w-fit border-emerald-500/40 bg-emerald-500/10 text-emerald-400 py-1 px-3 text-xs gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Today&apos;s reward: ₹10 credited!
              </Badge>
            ) : (
              <Button
                size="sm"
                disabled={isClaimingSocial}
                className="thc-glow thc-btn-gradient w-fit gap-1.5 text-xs font-semibold"
                onClick={() => handlePromoteAndEarn("NATIVE")}
              >
                <Share2 className="h-3.5 w-3.5" />
                {isClaimingSocial ? "Claiming..." : "Share Today's Performance (Claim ₹10)"}
              </Button>
            )}
          </div>

          {/* Social Channel Intent Buttons */}
          <div className="flex flex-col justify-between gap-3 rounded-xl border border-white/10 bg-black/30 p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Quick Share via Platform</p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={socialClaimed}
                className="h-9 border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs"
                onClick={() => handlePromoteAndEarn("WHATSAPP")}
              >
                WhatsApp
              </Button>

              <Button
                size="sm"
                variant="outline"
                disabled={socialClaimed}
                className="h-9 border-sky-500/30 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 text-xs"
                onClick={() => handlePromoteAndEarn("TELEGRAM")}
              >
                Telegram
              </Button>

              <Button
                size="sm"
                variant="outline"
                disabled={socialClaimed}
                className="h-9 border-white/20 bg-white/5 text-foreground hover:bg-white/10 text-xs"
                onClick={() => handlePromoteAndEarn("TWITTER")}
              >
                X / Twitter
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Action is logged as &quot;Share initiated&quot; and awards maximum ₹10 per IST calendar day.
            </p>
          </div>
        </div>
      </div>

      {/* 6. REFERRAL MILESTONES & STREAK */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* MILESTONES */}
        <div className="thc-glass relative flex flex-col gap-4 rounded-2xl border border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <h2 className="font-heading text-lg font-bold">Referral Milestones</h2>
            </div>
            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary text-xs">
              Level {milestones.indexOf(nextMilestone) + 1}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground">
            Achieve referral milestones as your network grows!
          </p>

          <div className="space-y-3">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-foreground">
                {successfulReferralsCount} / {nextMilestone} Successful Referrals
              </span>
              <span className="text-primary">{milestoneProgressPct.toFixed(0)}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/40 border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-500"
                style={{ width: `${milestoneProgressPct}%` }}
              />
            </div>
            {neededForNext > 0 ? (
              <p className="text-xs text-muted-foreground">
                🚀 <span className="font-semibold text-foreground">{neededForNext} more</span> successful referral{neededForNext > 1 ? "s" : ""} to reach the next milestone.
              </p>
            ) : (
              <p className="text-xs font-semibold text-emerald-400">
                🎉 Congratulations! You have unlocked all current referral milestones!
              </p>
            )}
          </div>

          {/* Milestones Chips */}
          <div className="grid grid-cols-4 gap-2 pt-2">
            {milestones.map((m) => {
              const achieved = successfulReferralsCount >= m;
              return (
                <div
                  key={m}
                  className={`flex flex-col items-center rounded-xl border p-2 text-center text-xs transition-colors ${
                    achieved
                      ? "border-primary/40 bg-primary/10 text-primary font-bold thc-glow"
                      : "border-white/10 bg-black/20 text-muted-foreground"
                  }`}
                >
                  <span className="text-[10px] text-muted-foreground">Goal</span>
                  <span className="font-heading text-sm">{m} Ref</span>
                  <span className="text-[10px] text-primary">₹{(m * 1000).toLocaleString("en-IN")}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* MONTHLY STREAK */}
        <div className="thc-glass relative flex flex-col justify-between gap-4 rounded-2xl border border-white/10 p-6">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-amber-500 animate-pulse" />
              <h2 className="font-heading text-lg font-bold">Monthly Referral Streak</h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Qualifying referral activity in the current month.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-400 thc-glow">
              <Flame className="h-7 w-7" />
            </div>
            <p className="font-heading text-3xl font-bold text-amber-400">
              🔥 {monthlyStreakCount} Successful Referral{monthlyStreakCount === 1 ? "" : "s"}
            </p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Keep going — every successful referral earns you ₹1,000 subscription credit!
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-muted-foreground border-t border-white/5 pt-3">
            <Info className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>Streak data updates automatically upon verified paid subscription activations.</span>
          </div>
        </div>
      </div>

      {/* 7. REFERRAL HISTORY ACTIVITY TABLE */}
      <div className="thc-glass relative flex flex-col gap-4 rounded-2xl border border-white/10 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-lg font-bold">Referral Activity &amp; Status</h2>
          </div>
          <span className="text-xs text-muted-foreground">
            {referralHistory.length} total referral{referralHistory.length === 1 ? "" : "s"}
          </span>
        </div>

        {referralHistory.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
            <Users className="h-10 w-10 opacity-30" />
            <p className="text-sm font-medium text-foreground">No referral activity yet</p>
            <p className="max-w-md text-xs">
              Share your referral link above to invite friends and track their registration &amp; qualification status in real time.
            </p>
            <Button
              size="sm"
              className="thc-glow thc-btn-gradient mt-2 gap-1.5"
              onClick={copyLink}
            >
              <Copy className="h-3.5 w-3.5" />
              Copy Referral Link
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b-white/10">
                  <TableHead>Joined Date</TableHead>
                  <TableHead>Friend</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Current Status</TableHead>
                  <TableHead>Subscription Plan</TableHead>
                  <TableHead className="text-right">Reward</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referralHistory.map((item) => {
                  const isRewarded =
                    item.referralStatus === "REWARD_CREDITED" ||
                    item.referralStatus === "SUCCESSFUL" ||
                    item.referralStatus === "REDEEMED" ||
                    item.referralStatus === "JOINED";

                  return (
                    <TableRow key={item.id} className="border-b-white/5">
                      <TableCell className="whitespace-nowrap text-muted-foreground text-xs">
                        {formatSignalDate(item.createdAt)}{" "}
                        <span className="text-[10px]">{formatSignalTime(item.createdAt)}</span>
                      </TableCell>
                      <TableCell className="font-medium whitespace-nowrap text-foreground">
                        {item.maskedName}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {item.maskedContact}
                      </TableCell>
                      <TableCell>
                        {isRewarded ? (
                          <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs">
                            Reward Credited
                          </Badge>
                        ) : item.referralStatus === "PAYMENT_PENDING" ? (
                          <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs">
                            Payment Pending
                          </Badge>
                        ) : item.referralStatus === "REGISTERED" ? (
                          <Badge variant="outline" className="border-sky-500/30 bg-sky-500/10 text-sky-400 text-xs">
                            Registered
                          </Badge>
                        ) : item.referralStatus === "INVITED" ? (
                          <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs">
                            Invited
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-white/10 bg-white/5 text-muted-foreground text-xs">
                            Invited
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{item.plan}</TableCell>
                      <TableCell className="text-right font-bold whitespace-nowrap">
                        {isRewarded ? (
                          <span className="text-emerald-400">+₹1,000</span>
                        ) : (
                          <span className="text-muted-foreground text-xs font-normal">Pending Activation</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* 8. REWARD WALLET & CREDIT HISTORY LEDGER */}
      <div className="thc-glass relative flex flex-col gap-4 rounded-2xl border border-white/10 p-6">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-lg font-bold">Reward &amp; Credit Ledger</h2>
        </div>

        {rewardTransactions.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">
            No credit transactions recorded yet. Complete referrals or daily promotion actions to earn credits!
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b-white/10">
                  <TableHead>Date</TableHead>
                  <TableHead>Activity &amp; Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rewardTransactions.map((tx) => {
                  const isRedemption = tx.type === "SUBSCRIPTION_REDEMPTION";
                  return (
                    <TableRow key={tx.id} className="border-b-white/5">
                      <TableCell className="whitespace-nowrap text-muted-foreground text-xs">
                        {formatSignalDate(tx.createdAt)}{" "}
                        <span className="text-[10px]">{formatSignalTime(tx.createdAt)}</span>
                      </TableCell>
                      <TableCell className="text-xs font-medium text-foreground">
                        {tx.description}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {tx.type === "REFERRAL_REWARD"
                          ? "Referral Reward"
                          : tx.type === "SOCIAL_PROMOTION"
                          ? "Social Promotion"
                          : tx.type === "SUBSCRIPTION_REDEMPTION"
                          ? "Subscription Redemption"
                          : "Adjustment"}
                      </TableCell>
                      <TableCell>
                        {tx.status === "CREDITED" ? (
                          <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs">
                            Credited
                          </Badge>
                        ) : tx.status === "REDEEMED" ? (
                          <Badge variant="outline" className="border-sky-500/30 bg-sky-500/10 text-sky-400 text-xs">
                            Redeemed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs">
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold whitespace-nowrap">
                        {isRedemption ? (
                          <span className="text-rose-400">-₹{Math.abs(tx.amount).toLocaleString("en-IN")}</span>
                        ) : (
                          <span className="text-emerald-400">+₹{tx.amount.toLocaleString("en-IN")}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* 9. TOP REFERRERS LEADERBOARD */}
      {REFERRAL_CONFIG.LEADERBOARD_ENABLED && leaderboard.length > 0 && (
        <div className="thc-glass relative flex flex-col gap-4 rounded-2xl border border-white/10 p-6">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-400" />
            <h2 className="font-heading text-lg font-bold">Top Referrers Leaderboard</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Recognizing our community growth champions. All names are privacy-masked.
          </p>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b-white/10">
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead className="text-center">Successful Referrals</TableHead>
                  <TableHead className="text-right">Credits Earned</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.map((row) => (
                  <TableRow key={row.rank} className="border-b-white/5">
                    <TableCell className="font-heading font-bold text-xs">
                      {row.rank === 1 ? (
                        <span className="inline-flex items-center gap-1 text-amber-400">🥇 #1</span>
                      ) : row.rank === 2 ? (
                        <span className="inline-flex items-center gap-1 text-slate-300">🥈 #2</span>
                      ) : row.rank === 3 ? (
                        <span className="inline-flex items-center gap-1 text-amber-600">🥉 #3</span>
                      ) : (
                        <span>#{row.rank}</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-xs text-foreground">{row.displayName}</TableCell>
                    <TableCell className="text-center font-bold text-xs text-sky-400">
                      {row.referralCount}
                    </TableCell>
                    <TableCell className="text-right font-bold text-xs thc-gold-text">
                      ₹{row.totalEarned.toLocaleString("en-IN")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* REDEEM CREDIT MODAL */}
      {showRedeemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="thc-glass thc-gold-border relative flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/10 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-emerald-400" />
                <h3 className="font-heading text-lg font-bold">Redeem Subscription Credit</h3>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                onClick={() => setShowRedeemModal(false)}
              >
                <CloseIcon className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-4 flex flex-col gap-4">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Available Credit</span>
                <p className="font-heading text-3xl font-bold text-emerald-400 mt-1">
                  ₹{availableCredit.toLocaleString("en-IN")}
                </p>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Clicking confirm will queue your available <strong>₹{availableCredit.toLocaleString("en-IN")}</strong> subscription credit to automatically reduce the payable amount for your next subscription renewal.
              </p>

              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 p-3 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                <span>Credits are applied as subscription discount vouchers and cannot be withdrawn as cash.</span>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowRedeemModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  disabled={isRedeeming || availableCredit <= 0}
                  className="thc-glow thc-btn-gradient font-semibold"
                  onClick={handleConfirmRedeem}
                >
                  {isRedeeming ? "Processing..." : "Confirm Redemption"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
