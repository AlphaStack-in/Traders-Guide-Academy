import { prisma } from "@/lib/prisma";
import { AdminReferralsTable, AdminReferralMemberRow } from "@/components/admin/referrals-table";

export const dynamic = "force-dynamic";

export default async function AdminReferralsPage() {
  // Fetch all subscribers to compute their referral stats
  const subscribers = await prisma.subscriber.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      rewardTransactions: true,
      socialPromotionEvents: true,
    },
  });

  // Fetch all referred sub-records
  const allReferred = await prisma.subscriber.findMany({
    where: { invitedBy: { not: null } },
  });

  const memberRows: AdminReferralMemberRow[] = subscribers.map((sub) => {
    const referredList = allReferred.filter((r) => r.invitedBy === sub.id);

    const successfulCount = referredList.filter(
      (r) =>
        r.referralStatus === "REWARD_CREDITED" ||
        r.referralStatus === "SUCCESSFUL" ||
        r.referralStatus === "REDEEMED" ||
        r.referralStatus === "JOINED"
    ).length;

    const pendingCount = referredList.filter(
      (r) =>
        r.referralStatus === "REGISTERED" ||
        r.referralStatus === "PAYMENT_PENDING" ||
        r.referralStatus === "INVITED" ||
        r.referralStatus === "NOT_JOINED"
    ).length;

    const txs = sub.rewardTransactions || [];
    const socialEvents = sub.socialPromotionEvents || [];

    const totalRewards = txs
      .filter((t) => t.status === "CREDITED")
      .reduce((acc, t) => acc + t.amount, 0);

    const redeemedCredit = txs
      .filter((t) => t.status === "REDEEMED" || t.type === "SUBSCRIPTION_REDEMPTION")
      .reduce((acc, t) => acc + Math.abs(t.amount), 0);

    const availableCredit = Math.max(0, totalRewards - redeemedCredit);

    const socialRewards = socialEvents.reduce((acc, e) => acc + e.rewardAmount, 0);

    const lastReferral = referredList.length > 0
      ? referredList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].createdAt.toISOString()
      : null;

    let status: "SUCCESSFUL" | "PENDING" | "INVITED" | "REWARD_CREDITED" | "REDEEMED" | "ALL" = "ALL";
    if (redeemedCredit > 0) status = "REDEEMED";
    else if (totalRewards > 0) status = "REWARD_CREDITED";
    else if (successfulCount > 0) status = "SUCCESSFUL";
    else if (pendingCount > 0) status = "PENDING";
    else if (sub.referralStatus === "INVITED") status = "INVITED";

    return {
      id: sub.id,
      name: sub.name,
      phone: sub.phone,
      email: sub.email,
      successfulCount,
      pendingCount,
      totalRewards,
      availableCredit,
      redeemedCredit,
      socialRewards,
      lastReferral,
      status,
      createdAt: sub.createdAt.toISOString(),
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">Referral &amp; Reward Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track member referral performance, subscription credits, social promotion rewards, and redemptions.
        </p>
      </div>
      <AdminReferralsTable members={memberRows} />
    </div>
  );
}
