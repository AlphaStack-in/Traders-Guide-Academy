import { prisma } from "@/lib/prisma";
import { MessagesTable } from "@/components/admin/messages-table";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } });

  const rows = messages.map((m) => ({
    id: m.id,
    name: m.name,
    phone: m.phone,
    email: m.email,
    message: m.message,
    status: m.status,
    replyText: m.replyText,
    repliedAt: m.repliedAt?.toISOString() ?? null,
    createdAt: m.createdAt.toISOString(),
  }));

  const newCount = rows.filter((r) => r.status === "NEW").length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">Messages</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {rows.length} message{rows.length === 1 ? "" : "s"} submitted via the Contact page
          {newCount > 0 ? ` — ${newCount} awaiting reply` : ""}.
        </p>
      </div>
      <MessagesTable messages={rows} />
    </div>
  );
}
