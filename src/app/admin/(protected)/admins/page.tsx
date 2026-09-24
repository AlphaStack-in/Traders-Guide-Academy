import { prisma } from "@/lib/prisma";
import { getAdminUser, getEnvExtraAdminEmails, getOwnerAdminEmail } from "@/lib/admin-rbac";
import { hasPermission } from "@/lib/admin-roles";
import { AdminsManager, type AdminAuditRow, type StaffAdminRow } from "@/components/admin/admins-manager";

export const dynamic = "force-dynamic";

// Base admin auth is inherited from the (protected) layout; this page
// additionally requires SUPER_ADMIN (and every action re-checks it).
export default async function AdminAdminsPage() {
  const me = await getAdminUser();
  if (!me.ok || !hasPermission(me.accessLevel, "SUPER_ADMIN")) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">Admins</h1>
        <p className="text-sm text-muted-foreground">
          Only Super Admins can manage admin accounts.
        </p>
      </div>
    );
  }

  const [staff, audit] = await Promise.all([
    prisma.adminUser.findMany({ orderBy: [{ isActive: "desc" }, { createdAt: "asc" }] }),
    prisma.adminUserAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
      include: { targetAdmin: { select: { email: true } } },
    }),
  ]);

  const staffRows: StaffAdminRow[] = staff.map((a) => ({
    id: a.id,
    email: a.email,
    name: a.name,
    accessLevel: a.accessLevel,
    isActive: a.isActive,
    hasPassword: Boolean(a.passwordHash),
    lastLoginAt: a.lastLoginAt?.toISOString() ?? null,
    createdAt: a.createdAt.toISOString(),
  }));

  const auditRows: AdminAuditRow[] = audit.map((l) => ({
    id: l.id,
    action: l.action,
    actorEmail: l.changedByEmail,
    targetEmail: l.targetAdmin.email,
    previousValue: l.previousValue,
    newValue: l.newValue,
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">
          Manage <span className="signalflow-gold-text">Admins</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add staff with their own login and a role that limits what they can change. Role changes
          and removals take effect on their next click — no redeploy needed.
        </p>
      </div>
      <AdminsManager
        ownerEmail={getOwnerAdminEmail()}
        envExtraEmails={getEnvExtraAdminEmails()}
        staff={staffRows}
        audit={auditRows}
        currentStaffId={me.staffId}
      />
    </div>
  );
}
