import type { SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { SubscribersTable } from "@/components/admin/subscribers-table";

export const dynamic = "force-dynamic";

// Short labels for the admin table's Autopay column — distinct from the
// subscriber-facing labels in account/profile/page.tsx (this one's for
// staff scanning a dense table, not a subscriber reading their own status).
const AUTOPAY_STATUS_LABEL: Record<SubscriptionStatus, string> = {
  CREATED: "Checkout started",
  AUTHENTICATED: "Pending 1st charge",
  ACTIVE: "Active",
  PENDING: "Retrying",
  HALTED: "Halted",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
  EXPIRED: "Expired",
};

export default async function AdminSubscribersPage() {
  const subscribers = await prisma.subscriber.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      subscriptions: { orderBy: { createdAt: "desc" }, take: 1, select: { status: true } },
    },
  });

  const rows = subscribers.map((s) => ({
    id: s.id,
    name: s.name,
    phone: s.phone,
    email: s.email,
    plan: s.plan,
    batchNumber: s.batchNumber,
    currentBroker: s.currentBroker,
    referralStatus: s.referralStatus,
    createdAt: s.createdAt.toISOString(),
    autopayStatus: s.subscriptions[0] ? AUTOPAY_STATUS_LABEL[s.subscriptions[0].status] : null,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">Registered Members</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {rows.length} member{rows.length === 1 ? "" : "s"} registered via the Register Premium
          form.
        </p>
      </div>
      <SubscribersTable subscribers={rows} />
    </div>
  );
}
