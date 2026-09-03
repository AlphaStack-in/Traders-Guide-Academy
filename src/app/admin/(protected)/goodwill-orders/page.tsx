import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getActiveBroker } from "@/lib/app-settings";
import {
  GoodwillOrderRequestsTable,
  type GoodwillOrderRequestRow,
} from "@/components/admin/goodwill-order-requests-table";

export const dynamic = "force-dynamic";

export default async function AdminGoodwillOrdersPage() {
  const activeBroker = await getActiveBroker();
  if (activeBroker !== "goodwill") {
    redirect("/admin/dashboard");
  }

  const requests = await prisma.goodwillOrderRequest.findMany({
    include: { subscriber: { select: { name: true, phone: true } } },
    orderBy: { requestedAt: "desc" },
    take: 100,
  });

  const rows: GoodwillOrderRequestRow[] = requests.map((r) => ({
    id: r.id,
    subscriberName: r.subscriber.name,
    subscriberPhone: r.subscriber.phone,
    instrument: r.instrument,
    strike: r.strike,
    optionType: r.optionType,
    lotSize: r.lotSize,
    productType: r.productType,
    requestedAt: r.requestedAt.toISOString(),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">Order Requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {requests.length} recent request{requests.length === 1 ? "" : "s"} — action these
          manually until GIGAPRO order placement is integrated.
        </p>
      </div>
      <GoodwillOrderRequestsTable requests={rows} />
    </div>
  );
}
