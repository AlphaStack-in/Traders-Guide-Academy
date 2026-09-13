import { prisma } from "@/lib/prisma";
import { PmsAccountsTable, type PmsAccountRow } from "@/components/admin/pms-accounts-table";

export const dynamic = "force-dynamic";

/**
 * Admin view over every PMS-category ProductPurchase, with a small inline
 * form to log a new PmsValuationEntry per purchase — this is the only way
 * PmsValuationEntry rows get created (the PMS product is a manually-traded
 * pooled fund with no live feed to sync from). Feeds the subscriber-facing
 * PMS growth section on /account/subscriptions.
 */
export default async function AdminPmsAccountsPage() {
  const purchases = await prisma.productPurchase.findMany({
    where: { status: "CAPTURED", product: { category: "PMS" } },
    orderBy: { createdAt: "desc" },
    include: {
      subscriber: { select: { name: true, phone: true } },
      product: { select: { name: true } },
      pmsValuationEntries: { orderBy: { asOfDate: "desc" }, take: 1 },
      _count: { select: { pmsValuationEntries: true } },
    },
  });

  const rows: PmsAccountRow[] = purchases.map((p) => {
    const latest = p.pmsValuationEntries[0] ?? null;
    return {
      purchaseId: p.id,
      subscriberName: p.subscriber.name,
      subscriberPhone: p.subscriber.phone,
      productName: p.product.name,
      purchasedAt: p.createdAt.toISOString(),
      contributedAmountInPaise: p.amountInPaise,
      latestValueInPaise: latest?.currentValueInPaise ?? null,
      latestAsOfDate: latest?.asOfDate.toISOString() ?? null,
      valuationCount: p._count.pmsValuationEntries,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">PMS Accounts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {rows.length} PMS enrollment{rows.length === 1 ? "" : "s"}. Log each member&apos;s fund
          valuation here as your relationship manager reports it — subscribers see it as a
          growth chart on their own account.
        </p>
      </div>
      <PmsAccountsTable accounts={rows} />
    </div>
  );
}
