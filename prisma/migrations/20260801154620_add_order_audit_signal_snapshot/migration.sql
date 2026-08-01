/*
  Warnings:

  - Added the required column `optionType` to the `OrderAuditLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `strike` to the `OrderAuditLog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OrderAuditLog" ADD COLUMN     "instrument" "Instrument",
ADD COLUMN     "optionType" "OptionType" NOT NULL,
ADD COLUMN     "strike" INTEGER NOT NULL;
