-- CreateEnum
CREATE TYPE "GoodwillProductType" AS ENUM ('INTRADAY', 'MARGIN');

-- CreateTable
CREATE TABLE "GoodwillOrderRequest" (
    "id" TEXT NOT NULL,
    "signalId" TEXT NOT NULL,
    "instrument" "Instrument",
    "strike" INTEGER NOT NULL,
    "optionType" "OptionType" NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "lotSize" INTEGER NOT NULL,
    "productType" "GoodwillProductType" NOT NULL DEFAULT 'INTRADAY',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoodwillOrderRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GoodwillOrderRequest_subscriberId_idx" ON "GoodwillOrderRequest"("subscriberId");

-- CreateIndex
CREATE INDEX "GoodwillOrderRequest_signalId_idx" ON "GoodwillOrderRequest"("signalId");

-- AddForeignKey
ALTER TABLE "GoodwillOrderRequest" ADD CONSTRAINT "GoodwillOrderRequest_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "Subscriber"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
