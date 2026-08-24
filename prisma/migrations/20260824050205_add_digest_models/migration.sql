-- AlterEnum
ALTER TYPE "SignalStatus" ADD VALUE 'EXPIRED';

-- AlterTable
ALTER TABLE "Signal" ADD COLUMN     "lotSize" INTEGER;

-- AlterTable
ALTER TABLE "Subscriber" ADD COLUMN     "emailDigestOptOut" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "DigestSendLog" (
    "id" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "subscriberEmail" TEXT NOT NULL,
    "weekStartDate" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signalCount" INTEGER NOT NULL,
    "winRate" DOUBLE PRECISION NOT NULL,
    "totalPnlPoints" DOUBLE PRECISION NOT NULL,
    "totalPnlRupees" DOUBLE PRECISION,

    CONSTRAINT "DigestSendLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DigestSendLog_weekStartDate_idx" ON "DigestSendLog"("weekStartDate");

-- CreateIndex
CREATE UNIQUE INDEX "DigestSendLog_subscriberId_weekStartDate_key" ON "DigestSendLog"("subscriberId", "weekStartDate");

-- AddForeignKey
ALTER TABLE "DigestSendLog" ADD CONSTRAINT "DigestSendLog_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "Subscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;
