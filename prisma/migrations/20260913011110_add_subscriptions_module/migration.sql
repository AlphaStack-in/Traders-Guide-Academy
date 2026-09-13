-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "accessValidityDays" INTEGER,
ADD COLUMN     "courseAccessUrl" TEXT;

-- CreateTable
CREATE TABLE "PmsValuationEntry" (
    "id" TEXT NOT NULL,
    "productPurchaseId" TEXT NOT NULL,
    "asOfDate" TIMESTAMP(3) NOT NULL,
    "currentValueInPaise" INTEGER NOT NULL,
    "note" TEXT,
    "enteredBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PmsValuationEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PmsValuationEntry_productPurchaseId_idx" ON "PmsValuationEntry"("productPurchaseId");

-- CreateIndex
CREATE UNIQUE INDEX "PmsValuationEntry_productPurchaseId_asOfDate_key" ON "PmsValuationEntry"("productPurchaseId", "asOfDate");

-- AddForeignKey
ALTER TABLE "PmsValuationEntry" ADD CONSTRAINT "PmsValuationEntry_productPurchaseId_fkey" FOREIGN KEY ("productPurchaseId") REFERENCES "ProductPurchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
