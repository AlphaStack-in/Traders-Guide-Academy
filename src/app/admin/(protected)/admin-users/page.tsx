import { requireAccessLevel } from "@/lib/admin-rbac";
import { listAdminUsers } from "./actions";
import { AdminUsersClient } from "./admin-users-client";

export default async function AdminUsersPage() {
  // Server-side gate: SUPER_ADMIN only
  await requireAccessLevel("SUPER_ADMIN");

  const adminUsers = await listAdminUsers();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Admin Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage authorized admin accounts and access levels. SUPER_ADMIN accounts can only be
          created via the database bootstrap script.
        </p>
      </div>
      <AdminUsersClient initialUsers={adminUsers} />
    </div>
  );
}
