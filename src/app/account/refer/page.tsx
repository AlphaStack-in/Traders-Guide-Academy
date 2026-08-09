import { redirect } from "next/navigation";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { getCurrentSubscriber } from "@/lib/subscriber-auth";
import { prisma } from "@/lib/prisma";
import { ReferEarnView } from "@/components/refer/refer-earn-view";
import { getRuntimeReferralUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ReferPage() {
  const subscriber = await getCurrentSubscriber();

  if (!subscriber) {
    redirect("/login?redirectTo=/account/refer");
  }

  // Fetch actual referral statistics from database for this logged-in subscriber
  // 1. Members who were invited or registered by/with this subscriber's token or phone
  const referredSubscribers = await prisma.subscriber.findMany({
    where: {
      OR: [
        { invitedBy: subscriber.id },
        { phone: subscriber.phone }, // fallback for contact form referrals
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  const joinedCount =
    referredSubscribers.filter((s) => s.referralStatus === "JOINED").length +
    (subscriber.referralStatus === "JOINED" ? 1 : 0);
  const REWARD_PER_JOIN = 500;
  const totalEarnings = joinedCount * REWARD_PER_JOIN;
  const withdrawableAmount = totalEarnings;

  const token = subscriber.invitationToken || subscriber.id;
  const referralLink = getRuntimeReferralUrl(token);

  const historyRows = referredSubscribers.map((s) => ({
    id: s.id,
    name: s.name,
    phone: s.phone,
    email: s.email,
    referralStatus: s.referralStatus,
    createdAt: s.createdAt.toISOString(),
  }));

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto flex-1 w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <ReferEarnView
          subscriberName={subscriber.name}
          totalEarnings={totalEarnings}
          withdrawableAmount={withdrawableAmount}
          referralLink={referralLink}
          history={historyRows}
        />
      </main>
      <Footer />
    </div>
  );
}
