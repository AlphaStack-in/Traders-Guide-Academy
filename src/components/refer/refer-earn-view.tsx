"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy, Gift, QrCode, Share2, Users, Wallet } from "lucide-react";
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
import { QrCodeView } from "@/components/refer/qr-code-view";

export interface ReferralHistoryItem {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  referralStatus: "JOINED" | "INVITED" | "NOT_JOINED";
  createdAt: string;
}

export function ReferEarnView({
  subscriberName,
  totalEarnings,
  withdrawableAmount,
  referralLink,
  history,
}: {
  subscriberName: string;
  totalEarnings: number;
  withdrawableAmount: number;
  referralLink: string;
  history: ReferralHistoryItem[];
}) {
  const [showQr, setShowQr] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied to clipboard!");
  }

  async function shareLink() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Traders Hub Center Premium",
          text: `Join ${subscriberName} on Traders Hub Center Premium for transparent intraday option signals!`,
          url: referralLink,
        });
      } catch {
        copyLink();
      }
    } else {
      copyLink();
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl font-bold sm:text-4xl">
          Refer &amp; <span className="thc-gold-text">Earn</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Invite fellow traders to Traders Hub Center. Earn rewards for every verified member who joins.
        </p>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="thc-glass thc-gold-border relative flex flex-col justify-between overflow-hidden rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Earnings
            </span>
            <Gift className="h-5 w-5 text-primary" />
          </div>
          <p className="mt-4 font-heading text-4xl font-bold thc-gold-text">
            ₹{totalEarnings.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Earned from verified member referrals
          </p>
        </div>

        <div className="thc-glass relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Withdrawable Balance
            </span>
            <Wallet className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="mt-4 font-heading text-4xl font-bold text-emerald-400">
            ₹{withdrawableAmount.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Ready for payout processing
          </p>
        </div>
      </div>

      {/* Referral Link & Actions */}
      <div className="thc-glass relative flex flex-col gap-6 rounded-2xl border border-white/10 p-6 sm:p-8">
        <div>
          <h2 className="font-heading text-lg font-bold">Your Unique Referral Link</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Share this link via WhatsApp, email, or social media. Anyone registering with your link will be linked to your account.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            readOnly
            value={referralLink}
            className="h-11 flex-1 font-mono text-xs sm:text-sm bg-black/40"
          />
          <div className="flex items-center gap-2">
            <Button
              className="thc-glow thc-btn-gradient h-11 gap-1.5 px-5 font-semibold"
              onClick={copyLink}
            >
              <Copy className="h-4 w-4" />
              Copy Link
            </Button>

            <Button
              variant="outline"
              className="h-11 gap-1.5"
              onClick={shareLink}
            >
              <Share2 className="h-4 w-4 text-primary" />
              Share
            </Button>

            <Button
              variant="outline"
              className="h-11 w-11 p-0"
              title="Show QR Code"
              onClick={() => setShowQr((prev) => !prev)}
            >
              <QrCode className="h-5 w-5 text-primary" />
            </Button>
          </div>
        </div>

        {/* QR Code Popup Display */}
        {showQr && (
          <div className="mt-2 flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-black/40 p-6 text-center">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Scan to Register</p>
            <QrCodeView value={referralLink} size={180} />
            <p className="text-xs text-muted-foreground">Point your phone camera to open registration</p>
          </div>
        )}
      </div>

      {/* How It Works */}
      <div className="thc-glass relative flex flex-col gap-6 rounded-2xl border border-white/10 p-6">
        <h2 className="font-heading text-lg font-bold">How Referral Rewards Work</h2>

        <div className="grid gap-6 sm:grid-cols-3">
          <div className="flex flex-col gap-2 rounded-xl border border-white/5 bg-black/20 p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
              1
            </div>
            <h3 className="font-heading text-sm font-semibold">Share Link</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Send your referral link or QR code to friends, family, or fellow options traders.
            </p>
          </div>

          <div className="flex flex-col gap-2 rounded-xl border border-white/5 bg-black/20 p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
              2
            </div>
            <h3 className="font-heading text-sm font-semibold">Friend Registers</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Your referred friend completes registration using your link to join the premium batch.
            </p>
          </div>

          <div className="flex flex-col gap-2 rounded-xl border border-white/5 bg-black/20 p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
              3
            </div>
            <h3 className="font-heading text-sm font-semibold">Get Rewarded</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Earn verified cash rewards credited directly to your withdrawable balance.
            </p>
          </div>
        </div>
      </div>

      {/* Referral History Table */}
      <div className="thc-glass relative flex flex-col gap-4 rounded-2xl border border-white/10 p-6">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-lg font-bold">Referral Activity &amp; Status</h2>
        </div>

        {history.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
            <Users className="h-10 w-10 opacity-30" />
            <p className="text-sm font-medium text-foreground">No referral activity yet</p>
            <p className="max-w-md text-xs">
              Share your referral link above to invite friends and track their registration status in real time.
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
                  <TableHead>Date</TableHead>
                  <TableHead>Referred Member</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item) => (
                  <TableRow key={item.id} className="border-b-white/5">
                    <TableCell className="whitespace-nowrap text-muted-foreground text-xs">
                      {formatSignalDate(item.createdAt)}{" "}
                      <span className="text-[10px]">{formatSignalTime(item.createdAt)}</span>
                    </TableCell>
                    <TableCell className="font-medium whitespace-nowrap">{item.name}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {item.phone}
                    </TableCell>
                    <TableCell>
                      {item.referralStatus === "JOINED" ? (
                        <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs">
                          Joined
                        </Badge>
                      ) : item.referralStatus === "INVITED" ? (
                        <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs">
                          Invited
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-white/10 bg-white/5 text-muted-foreground text-xs">
                          Not Joined
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
