-- CreateEnum
CREATE TYPE "Instrument" AS ENUM ('NIFTY', 'SENSEX', 'MIDCAP_NIFTY', 'BANK_NIFTY');

-- AlterTable
ALTER TABLE "Signal" ADD COLUMN     "instrument" "Instrument";
