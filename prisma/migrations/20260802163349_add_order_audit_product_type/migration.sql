-- CreateEnum
CREATE TYPE "DhanProductType" AS ENUM ('INTRADAY', 'MARGIN');

-- AlterTable
ALTER TABLE "OrderAuditLog" ADD COLUMN     "productType" "DhanProductType" NOT NULL DEFAULT 'INTRADAY';
