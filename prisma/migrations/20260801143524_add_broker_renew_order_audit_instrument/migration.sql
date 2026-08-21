-- CreateEnum
CREATE TYPE "OrderAuditStatus" AS ENUM ('PLACED', 'REJECTED', 'ERROR');

-- AlterTable
ALTER TABLE "BrokerConnection" ADD COLUMN     "ipWhitelisted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastRenewedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "DhanInstrument" (
    "id" TEXT NOT NULL,
    "underlying" "Instrument" NOT NULL,
    "expiry" TIMESTAMP(3) NOT NULL,
    "strike" INTEGER NOT NULL,
    "optionType" "OptionType" NOT NULL,
    "securityId" TEXT NOT NULL,
    "exchangeSegment" TEXT NOT NULL,
    "tradingSymbol" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DhanInstrument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderAuditLog" (
    "id" TEXT NOT NULL,
    "signalId" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "brokerConnectionId" TEXT NOT NULL,
    "lotSize" INTEGER NOT NULL,
    "dhanOrderId" TEXT,
    "status" "OrderAuditStatus" NOT NULL,
    "dhanResponse" JSONB,
    "errorMessage" TEXT,
    "placedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DhanInstrument_updatedAt_idx" ON "DhanInstrument"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DhanInstrument_underlying_expiry_strike_optionType_key" ON "DhanInstrument"("underlying", "expiry", "strike", "optionType");

-- CreateIndex
CREATE INDEX "OrderAuditLog_subscriberId_idx" ON "OrderAuditLog"("subscriberId");

-- CreateIndex
CREATE INDEX "OrderAuditLog_signalId_idx" ON "OrderAuditLog"("signalId");

-- AddForeignKey
ALTER TABLE "OrderAuditLog" ADD CONSTRAINT "OrderAuditLog_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "Subscriber"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
