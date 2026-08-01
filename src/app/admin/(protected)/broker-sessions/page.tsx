import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { clientConfig } from "@/lib/client-config";
import {
  BrokerSessionsTable,
  type BrokerSessionRow,
  type OrderAuditRow,
} from "@/components/admin/broker-sessions-table";

export const dynamic = "force-dynamic";

export default async function AdminBrokerSessionsPage() {
  if (!clientConfig.dhanConnectEnabled) {
    redirect("/admin/dashboard");
  }

  const [connections, orders] = await Promise.all([
    prisma.brokerConnection.findMany({
      include: { subscriber: { select: { name: true, phone: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.orderAuditLog.findMany({
      include: { subscriber: { select: { name: true, phone: true } } },
      orderBy: { placedAt: "desc" },
      take: 100,
    }),
  ]);

  const sessionRows: BrokerSessionRow[] = connections.map((c) => ({
    subscriberId: c.subscriberId,
    subscriberName: c.subscriber.name,
    subscriberPhone: c.subscriber.phone,
    dhanClientId: c.dhanClientId,
    dhanClientName: c.dhanClientName,
    status: c.status,
    tokenExpiresAt: c.tokenExpiresAt.toISOString(),
    lastRenewedAt: c.lastRenewedAt ? c.lastRenewedAt.toISOString() : null,
    lastError: c.lastError,
  }));

  const orderRows: OrderAuditRow[] = orders.map((o) => ({
    id: o.id,
    subscriberName: o.subscriber.name,
    subscriberPhone: o.subscriber.phone,
    instrument: o.instrument,
    strike: o.strike,
    optionType: o.optionType,
    lotSize: o.lotSize,
    dhanOrderId: o.dhanOrderId,
    status: o.status,
    errorMessage: o.errorMessage,
    placedAt: o.placedAt.toISOString(),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">Broker Sessions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {connections.length} subscriber{connections.length === 1 ? "" : "s"} with a Dhan
          connection, {orders.length} recent order{orders.length === 1 ? "" : "s"}.
        </p>
      </div>
      <BrokerSessionsTable sessions={sessionRows} orders={orderRows} />
    </div>
  );
}
