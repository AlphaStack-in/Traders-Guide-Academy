-- Replaces Supabase Auth's Subscriber.authUserId linkage with a local
-- password hash, as part of moving TGA off Supabase Auth entirely (see
-- src/lib/subscriber-auth.ts, src/lib/admin-rbac.ts).
--
-- The AdminUser / AdminUserAuditLog tables are intentionally left in place,
-- unused — TGA now has a single hardcoded admin account (ADMIN_EMAIL /
-- ADMIN_PASSWORD_HASH env vars), so there's nothing to migrate them to.
-- Dropping them is a safe follow-up if desired, not done here to keep this
-- migration minimal and low-risk.

-- DropIndex
DROP INDEX "Subscriber_authUserId_key";

-- AlterTable
ALTER TABLE "Subscriber" DROP COLUMN "authUserId";
ALTER TABLE "Subscriber" ADD COLUMN "passwordHash" TEXT;
