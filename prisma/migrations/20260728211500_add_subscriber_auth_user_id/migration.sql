-- AlterTable
ALTER TABLE "Subscriber" ADD COLUMN "authUserId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Subscriber_authUserId_key" ON "Subscriber"("authUserId");
