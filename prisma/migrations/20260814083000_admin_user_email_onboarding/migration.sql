-- Migration: admin_user_email_onboarding
-- Allow email-based admin onboarding:
--   - supabaseUserId becomes nullable (pending until first Google login bind)
--   - email becomes unique (onboarding / binding key)
-- Does not modify existing SUPER_ADMIN rows that already have a UUID.

-- Normalize existing emails before unique constraint
UPDATE "AdminUser" SET "email" = LOWER(TRIM("email"));

-- Allow pending admins (no UUID yet)
ALTER TABLE "AdminUser" ALTER COLUMN "supabaseUserId" DROP NOT NULL;

-- Replace non-unique email index with unique constraint
DROP INDEX IF EXISTS "AdminUser_email_idx";

CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");
