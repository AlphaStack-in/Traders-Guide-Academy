-- AlterTable
ALTER TABLE "Subscriber" ADD COLUMN     "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "digestEnabled" BOOLEAN NOT NULL DEFAULT false,
    "newsAlertsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "brokerConnectEnabled" BOOLEAN NOT NULL DEFAULT false,
    "activeBroker" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);
