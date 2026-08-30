/**
 * One-time backfill script: corrects Signal rows that were saved under the
 * old "stock signals get stored as NIFTY" bug (see the Instrument enum's
 * STOCK member in prisma/schema.prisma, and manual-signal-form.tsx).
 *
 * Any row with a non-null stockSymbol is, by definition, a stock signal --
 * stockSymbol is never set for an index trade -- so if its instrument
 * column isn't already STOCK, it was mislabeled by the old bug and gets
 * corrected here.
 *
 * Usage: npx tsx scripts/backfill-stock-instrument.ts
 *   (add --dry-run to only print what would change, without writing)
 *
 * Requires the STOCK value to already exist on the Instrument enum in the
 * database -- run `npx prisma migrate deploy` (or `npm run db:migrate`)
 * and `npx prisma generate` first.
 *
 * Safe to run multiple times -- rows already correctly set to STOCK are
 * skipped.
 */

import "dotenv/config";

// Prisma client -- direct import since this runs outside Next.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes("--dry-run");

async function main() {
  const mislabeled = await prisma.signal.findMany({
    where: {
      stockSymbol: { not: null },
      NOT: { instrument: "STOCK" },
    },
    select: { id: true, instrument: true, stockSymbol: true, strike: true, optionType: true, signalTime: true },
    orderBy: { signalTime: "asc" },
  });

  if (mislabeled.length === 0) {
    console.log("Nothing to backfill -- every stock signal already has instrument = STOCK.");
    return;
  }

  console.log(`Found ${mislabeled.length} stock signal(s) mislabeled as index instruments:`);
  for (const s of mislabeled) {
    console.log(`  ${s.signalTime.toISOString().slice(0, 10)}  ${s.stockSymbol} ${s.strike} ${s.optionType}  (was instrument=${s.instrument})`);
  }

  if (DRY_RUN) {
    console.log("\nDry run -- no changes written. Re-run without --dry-run to apply.");
    return;
  }

  const result = await prisma.signal.updateMany({
    where: {
      stockSymbol: { not: null },
      NOT: { instrument: "STOCK" },
    },
    data: { instrument: "STOCK" },
  });

  console.log(`\nBackfill complete: ${result.count} signal(s) corrected to instrument = STOCK.`);
}

main()
  .catch((e) => {
    console.error("Backfill failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
