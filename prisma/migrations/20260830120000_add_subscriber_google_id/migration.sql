-- Adds Subscriber.googleId to support "Sign in with Google" for existing
-- subscribers (see src/app/api/auth/google/callback/route.ts). Nullable and
-- unique: unset for every subscriber until they first sign in with a Google
-- account whose verified email matches their existing record, at which point
-- it's backfilled so future logins can go straight by googleId. This does
-- NOT reintroduce Supabase Auth or a DB-driven auth provider — Google is
-- just an alternate credential for an account that still exists here, in
-- Postgres/Neon, exactly as it did after 20260823150000_replace_supabase_auth.

-- AlterTable
ALTER TABLE "Subscriber" ADD COLUMN "googleId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Subscriber_googleId_key" ON "Subscriber"("googleId");
