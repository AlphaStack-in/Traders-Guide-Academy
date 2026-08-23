-- CreateEnum
CREATE TYPE "RewardTransactionType" AS ENUM ('REFERRAL_REWARD', 'SOCIAL_PROMOTION', 'SUBSCRIPTION_REDEMPTION', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "RewardTransactionStatus" AS ENUM ('CREDITED', 'PENDING', 'REDEEMED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ReferralStatus" ADD VALUE 'REGISTERED';
ALTER TYPE "ReferralStatus" ADD VALUE 'PAYMENT_PENDING';
ALTER TYPE "ReferralStatus" ADD VALUE 'SUCCESSFUL';
ALTER TYPE "ReferralStatus" ADD VALUE 'REWARD_CREDITED';
ALTER TYPE "ReferralStatus" ADD VALUE 'REDEEMED';

-- AlterTable
ALTER TABLE "Signal" ADD COLUMN     "chartImageUrl" TEXT,
ADD COLUMN     "confidence" TEXT DEFAULT 'HIGH',
ADD COLUMN     "contextTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "entryHigh" DOUBLE PRECISION,
ADD COLUMN     "entryLow" DOUBLE PRECISION,
ADD COLUMN     "parserName" TEXT DEFAULT 'SIGNALFLOW',
ADD COLUMN     "parserVersion" TEXT DEFAULT '1.0.0',
ADD COLUMN     "target1" DOUBLE PRECISION,
ADD COLUMN     "target2" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "RewardTransaction" (
    "id" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "type" "RewardTransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "RewardTransactionStatus" NOT NULL DEFAULT 'CREDITED',
    "description" TEXT NOT NULL,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RewardTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialPromotionEvent" (
    "id" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "shareDate" TEXT NOT NULL,
    "rewardAmount" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialPromotionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsAlert" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Market',
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "summary" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "impact" TEXT,
    "affectedInstruments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "source" TEXT,
    "sourceUrl" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "isBreaking" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RewardTransaction_subscriberId_idx" ON "RewardTransaction"("subscriberId");

-- CreateIndex
CREATE INDEX "RewardTransaction_type_idx" ON "RewardTransaction"("type");

-- CreateIndex
CREATE INDEX "SocialPromotionEvent_subscriberId_idx" ON "SocialPromotionEvent"("subscriberId");

-- CreateIndex
CREATE UNIQUE INDEX "SocialPromotionEvent_subscriberId_shareDate_key" ON "SocialPromotionEvent"("subscriberId", "shareDate");

-- CreateIndex
CREATE INDEX "NewsAlert_publishedAt_idx" ON "NewsAlert"("publishedAt");

-- CreateIndex
CREATE INDEX "NewsAlert_isActive_idx" ON "NewsAlert"("isActive");

-- AddForeignKey
ALTER TABLE "RewardTransaction" ADD CONSTRAINT "RewardTransaction_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "Subscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPromotionEvent" ADD CONSTRAINT "SocialPromotionEvent_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "Subscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;
