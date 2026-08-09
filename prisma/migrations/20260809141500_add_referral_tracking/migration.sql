-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('JOINED', 'INVITED', 'NOT_JOINED');

-- AlterTable
ALTER TABLE "Subscriber" ADD COLUMN     "invitationToken" TEXT,
ADD COLUMN     "invitedAt" TIMESTAMP(3),
ADD COLUMN     "invitedBy" TEXT,
ADD COLUMN     "referralStatus" "ReferralStatus" NOT NULL DEFAULT 'NOT_JOINED';

-- CreateIndex
CREATE UNIQUE INDEX "Subscriber_invitationToken_key" ON "Subscriber"("invitationToken");
