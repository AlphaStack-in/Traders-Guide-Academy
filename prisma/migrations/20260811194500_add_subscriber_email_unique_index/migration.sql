CREATE UNIQUE INDEX IF NOT EXISTS "Subscriber_lower_email_key" ON "Subscriber" (LOWER("email")) WHERE "email" IS NOT NULL;
