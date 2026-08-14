-- Migration: add_admin_rbac
-- Creates AdminUser and AdminUserAuditLog tables for database-backed RBAC.
-- Apply to production with:
--   npx prisma db execute --file prisma/migrations/20260814065135_add_admin_rbac/migration.sql
-- OR after resolving drift:
--   npx prisma migrate deploy

-- CreateEnum
CREATE TYPE "AdminAccessLevel" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'SIGNAL_MANAGER', 'SUPPORT', 'VIEWER');

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "supabaseUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "accessLevel" "AdminAccessLevel" NOT NULL DEFAULT 'VIEWER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUserAuditLog" (
    "id" TEXT NOT NULL,
    "changedById" TEXT NOT NULL,
    "targetAdminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "previousValue" TEXT,
    "newValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminUserAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_supabaseUserId_key" ON "AdminUser"("supabaseUserId");

-- CreateIndex
CREATE INDEX "AdminUser_supabaseUserId_idx" ON "AdminUser"("supabaseUserId");

-- CreateIndex
CREATE INDEX "AdminUser_email_idx" ON "AdminUser"("email");

-- CreateIndex
CREATE INDEX "AdminUser_isActive_idx" ON "AdminUser"("isActive");

-- CreateIndex
CREATE INDEX "AdminUserAuditLog_changedById_idx" ON "AdminUserAuditLog"("changedById");

-- CreateIndex
CREATE INDEX "AdminUserAuditLog_targetAdminId_idx" ON "AdminUserAuditLog"("targetAdminId");

-- CreateIndex
CREATE INDEX "AdminUserAuditLog_createdAt_idx" ON "AdminUserAuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "AdminUserAuditLog" ADD CONSTRAINT "AdminUserAuditLog_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminUserAuditLog" ADD CONSTRAINT "AdminUserAuditLog_targetAdminId_fkey" FOREIGN KEY ("targetAdminId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================================
-- BOOTSTRAP: insert jeganarayanan.m@gmail.com as SUPER_ADMIN
-- Replace <YOUR_SUPABASE_USER_ID> with the actual Supabase Auth user.id UUID
-- from: Supabase Dashboard > Authentication > Users > jeganarayanan.m@gmail.com
-- Run AFTER the CREATE TABLE statements above.
-- ============================================================================
-- INSERT INTO "AdminUser" ("id", "supabaseUserId", "email", "accessLevel", "isActive", "createdAt", "updatedAt")
-- VALUES (
--   gen_random_uuid()::text,
--   '<YOUR_SUPABASE_USER_ID>',
--   'jeganarayanan.m@gmail.com',
--   'SUPER_ADMIN',
--   true,
--   NOW(),
--   NOW()
-- )
-- ON CONFLICT ("supabaseUserId") DO UPDATE
--   SET "accessLevel" = 'SUPER_ADMIN', "isActive" = true, "updatedAt" = NOW();
