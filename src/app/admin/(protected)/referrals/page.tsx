import { prisma } from "@/lib/prisma";
import { ReferralsTable } from "@/components/admin/referrals-table";

export const dynamic = "force-dynamic";

export default async function AdminReferralsPage() {
  const referrals = await prisma.referral.findMany({ orderBy: { createdAt: "desc" } });

  const rows = referrals.map((r) => ({
    id: r.id,
    referrerName: r.referrerName,
    referrerPhone: r.referrerPhone,
    referredName: r.referredName,
    referredPhone: r.referredPhone,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">Referrals</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {rows.length} referral{rows.length === 1 ? "" : "s"} submitted via the Contact page.
        </p>
      </div>
      <ReferralsTable referrals={rows} />
    </div>
  );
}
