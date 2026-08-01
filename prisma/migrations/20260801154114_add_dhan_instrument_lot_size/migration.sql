/*
  Warnings:

  - Added the required column `lotSize` to the `DhanInstrument` table without a default value. This is not possible if the table is not empty.

*/
-- DhanInstrument is a pure daily-refreshed cache (see dhan-instrument-sync.ts)
-- — safe to truncate rather than backfill a default, the next cron run
-- repopulates it with real lotSize values within a day.
TRUNCATE TABLE "DhanInstrument";

-- AlterTable
ALTER TABLE "DhanInstrument" ADD COLUMN     "lotSize" INTEGER NOT NULL;
