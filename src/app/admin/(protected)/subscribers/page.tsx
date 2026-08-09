import { prisma } from "@/lib/prisma";
import { SubscribersTable } from "@/components/admin/subscribers-table";

export const dynamic = "force-dynamic";

export default async function AdminSubscribersPage() {
  const subscribers = await prisma.subscriber.findMany({ orderBy: { createdAt: "desc" } });

  const rows = subscribers.map((s) => ({
    id: s.id,
    name: s.name,
    phone: s.phone,
    email: s.email,
    plan: s.plan,
    batchNumber: s.batchNumber,
    referralStatus: s.referralStatus,
    createdAt: s.createdAt.toISOString(),
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
