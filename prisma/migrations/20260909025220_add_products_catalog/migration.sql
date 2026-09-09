-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('COURSE', 'INDICATOR', 'EBOOK', 'PMS', 'MEMBERSHIP');

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ProductCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "longDescription" TEXT NOT NULL,
    "priceInPaise" INTEGER NOT NULL,
    "originalPriceInPaise" INTEGER,
    "rating" DOUBLE PRECISION,
    "ratingCount" INTEGER,
    "imageUrl" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductPurchase" (
    "id" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'cashfree',
    "providerOrderId" TEXT,
    "providerPaymentId" TEXT,
    "amountInPaise" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "fulfilledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- CreateIndex
CREATE INDEX "Product_isActive_idx" ON "Product"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ProductPurchase_providerOrderId_key" ON "ProductPurchase"("providerOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductPurchase_providerPaymentId_key" ON "ProductPurchase"("providerPaymentId");

-- CreateIndex
CREATE INDEX "ProductPurchase_subscriberId_idx" ON "ProductPurchase"("subscriberId");

-- CreateIndex
CREATE INDEX "ProductPurchase_productId_idx" ON "ProductPurchase"("productId");

-- CreateIndex
CREATE INDEX "ProductPurchase_status_idx" ON "ProductPurchase"("status");

-- AddForeignKey
ALTER TABLE "ProductPurchase" ADD CONSTRAINT "ProductPurchase_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "Subscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPurchase" ADD CONSTRAINT "ProductPurchase_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
