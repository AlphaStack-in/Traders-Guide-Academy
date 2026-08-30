-- The 20260811194500 migration added a case-insensitive *functional* unique
-- index (UNIQUE INDEX ... ON "Subscriber" (LOWER("email"))), but
-- prisma/schema.prisma was never updated to declare `email` as unique --
-- Prisma has no clean way to express a functional index in the schema DSL,
-- so it stayed invisible to Prisma Client (no typed P2002 on a genuine
-- collision, no `findUnique({ where: { email } })`), and the app was left
-- relying entirely on findFirst-based application checks that a concurrent
-- request can still race past.
--
-- Fix: store email pre-normalized (lower-cased, via normalizeEmail() in
-- src/lib/utils.ts, applied at every write site) and rely on a plain,
-- Prisma-visible unique index instead of a functional one. The prior
-- case-insensitive constraint already ruled out any existing rows differing
-- only by case, so this backfill cannot introduce a new collision.

UPDATE "Subscriber"
SET "email" = LOWER("email")
WHERE "email" IS NOT NULL AND "email" <> LOWER("email");

DROP INDEX IF EXISTS "Subscriber_lower_email_key";

-- Matches Prisma's default naming for `email String? @unique` on Subscriber.
CREATE UNIQUE INDEX IF NOT EXISTS "Subscriber_email_key" ON "Subscriber"("email");
