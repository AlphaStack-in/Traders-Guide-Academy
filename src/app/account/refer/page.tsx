import { redirect } from "next/navigation";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { getCurrentSubscriber } from "@/lib/subscriber-auth";
import { prisma } from "@/lib/prisma";
import { ReferEarnView, ReferralHistoryRow, RewardTransactionRow, LeaderboardRow } from "@/components/refer/refer-earn-view";
import { getClientJoinUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

function maskName(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return `${parts[0].charAt(0)}***`;
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
}

function maskContact(phone: string, email?: string | null): string {
  if (phone && phone.length >= 8) {
    return `${phone.slice(0, 4)}****${phone.slice(-2)}`;
  }
  if (email && email.includes("@")) {
    const [user, domain] = email.split("@");
    return `${user.slice(0, 2)}***@${domain}`;
  }
  return "*****";
}

export default async function ReferPage() {
  const subscriber = await getCurrentSubscriber();

  if (!subscriber) {
    redirect("/login?redirectTo=/account/refer");
  }

  // 1. Fetch referred subscribers
  const referredSubscribers = await prisma.subscriber.findMany({
    where: {
      OR: [
        { invitedBy: subscriber.id },
        { phone: subscriber.phone }, // fallback for contact form referrals
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  // 2. Fetch reward transactions for ledger
  const rewardTxs = await prisma.rewardTransaction.findMany({
    where: { subscriberId: subscriber.id },
    orderBy: { createdAt: "desc" },
  });

  // 3. Fetch social promotion events
  const socialEvents = await prisma.socialPromotionEvent.findMany({
    where: { subscriberId: subscriber.id },
    orderBy: { createdAt: "desc" },
  });

  // Date calculations in IST
  const todayIST = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const currentMonthIST = todayIST.slice(0, 7); // YYYY-MM

  // Calculate metrics
  const totalEarned = rewardTxs
    .filter((tx) => tx.status === "CREDITED")
    .reduce((acc, tx) => acc + tx.amount, 0);

  const redeemedAmount = rewardTxs
    .filter((tx) => tx.status === "REDEEMED" || tx.type === "SUBSCRIPTION_REDEMPTION")
    .reduce((acc, tx) => acc + Math.abs(tx.amount), 0);

  const availableCredit = Math.max(0, totalEarned - redeemedAmount);

  const successfulReferrals = referredSubscribers.filter(
    (s) =>
      s.referralStatus === "REWARD_CREDITED" ||
      s.referralStatus === "SUCCESSFUL" ||
      s.referralStatus === "REDEEMED" ||
      s.referralStatus === "JOINED"
  );
  const successfulReferralsCount = successfulReferrals.length;

  const pendingReferralsCount = referredSubscribers.filter(
    (s) =>
      s.referralStatus === "REGISTERED" ||
      s.referralStatus === "PAYMENT_PENDING" ||
      s.referralStatus === "INVITED" ||
      s.referralStatus === "NOT_JOINED"
  ).length;
  const pendingRewards = pendingReferralsCount * 1000;

  // Social reward metrics
  const todaySocialEvent = socialEvents.find((e) => e.shareDate === todayIST);
  const todaySocialReward = todaySocialEvent ? todaySocialEvent.rewardAmount : 0;
  const isSocialRewardClaimedToday = !!todaySocialEvent;

  const monthSocialReward = socialEvents
    .filter((e) => e.shareDate.startsWith(currentMonthIST))
    .reduce((acc, e) => acc + e.rewardAmount, 0);

  const lifetimeSocialReward = socialEvents.reduce((acc, e) => acc + e.rewardAmount, 0);

  // Monthly streak count
  const monthlyStreakCount = successfulReferrals.filter((s) => {
    const sMonth = s.createdAt.toISOString().slice(0, 7);
    return sMonth === currentMonthIST;
  }).length;

  // Referral URL
  const token = subscriber.invitationToken || subscriber.id;
  const referralLink = getClientJoinUrl(token);

  // Map history rows
  const referralHistoryRows: ReferralHistoryRow[] = referredSubscribers.map((s) => ({
    id: s.id,
    maskedName: maskName(s.name),
    maskedContact: maskContact(s.phone, s.email),
    referralStatus: s.referralStatus,
    plan: s.plan || "PREMIUM",
    rewardAmount:
      s.referralStatus === "REWARD_CREDITED" ||
      s.referralStatus === "SUCCESSFUL" ||
      s.referralStatus === "REDEEMED" ||
      s.referralStatus === "JOINED"
        ? 1000
        : 0,
    createdAt: s.createdAt.toISOString(),
  }));

  // Map transaction rows
  const rewardTransactionRows: RewardTransactionRow[] = rewardTxs.map((tx) => ({
    id: tx.id,
    type: tx.type,
    amount: tx.amount,
    status: tx.status,
    description: tx.description,
    createdAt: tx.createdAt.toISOString(),
  }));

  // Leaderboard logic (top referrers)
  const topReferrersGroup = await prisma.subscriber.groupBy({
    by: ["invitedBy"],
    where: {
      invitedBy: { not: null },
      referralStatus: { in: ["REWARD_CREDITED", "SUCCESSFUL", "REDEEMED", "JOINED"] },
    },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 5,
  });

  const leaderboardRows: LeaderboardRow[] = await Promise.all(
    topReferrersGroup.map(async (group, idx) => {
      const refSubscriber = await prisma.subscriber.findUnique({
        where: { id: group.invitedBy! },
      });
      return {
        rank: idx + 1,
        displayName: refSubscriber ? maskName(refSubscriber.name) : `Member ${idx + 1}`,
        referralCount: group._count.id,
        totalEarned: group._count.id * 1000,
      };
    })
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto flex-1 w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <ReferEarnView
          subscriberName={subscriber.name}
          totalEarned={totalEarned}
          availableCredit={availableCredit}
          pendingRewards={pendingRewards}
          successfulReferralsCount={successfulReferralsCount}
          redeemedAmount={redeemedAmount}
          todaySocialReward={todaySocialReward}
          monthSocialReward={monthSocialReward}
          lifetimeSocialReward={lifetimeSocialReward}
          isSocialRewardClaimedToday={isSocialRewardClaimedToday}
          monthlyStreakCount={monthlyStreakCount}
          referralLink={referralLink}
          referralHistory={referralHistoryRows}
          rewardTransactions={rewardTransactionRows}
          leaderboard={leaderboardRows}
        />
      </main>
      <Footer />
    </div>
  );
}
