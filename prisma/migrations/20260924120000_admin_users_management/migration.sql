-- Brings the AdminUser table back into use for staff admins managed from
-- /admin/admins (see src/lib/admin-rbac.ts). The primary owner admin stays
-- defined by the ADMIN_EMAIL / ADMIN_PASSWORD_HASH env vars, not a row here.

-- Any rows left over from the old Supabase-era RBAC are deactivated so no
-- stale account silently regains access; reactivate them from /admin/admins.
UPDATE "AdminUser" SET "isActive" = false;

-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "name" TEXT,
ADD COLUMN     "passwordHash" TEXT;

-- DropForeignKey
ALTER TABLE "AdminUserAuditLog" DROP CONSTRAINT "AdminUserAuditLog_changedById_fkey";

-- AlterTable
ALTER TABLE "AdminUserAuditLog" ADD COLUMN     "changedByEmail" TEXT,
ALTER COLUMN "changedById" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "AdminUserAuditLog" ADD CONSTRAINT "AdminUserAuditLog_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
