/**
 * One-time backfill script: populates lotSize for existing signals from the
 * last 7 days using the DhanInstrument daily cache.
 *
 * Usage: npx tsx scripts/backfill-lot-sizes.ts
 *
 * Safe to run multiple times -- skips signals that already have lotSize set.
 * Only works for signals whose contract is still in today's DhanInstrument
 * cache (expired contracts won't resolve, those signals keep lotSize = null).
 */

import "dotenv/config";

// Prisma client -- direct import since this runs outside Next.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Find signals from the last 7 days that don't have lotSize set
  const signals = await prisma.signal.findMany({
    where: {
      createdAt: { gte: sevenDaysAgo },
      lotSize: null,
    },
    select: {
      id: true,
      instrument: true,
      strike: true,
      optionType: true,
      expiry: true,
    },
  });

  console.log(`Found ${signals.length} signals from the last 7 days without lotSize.`);

  let updated = 0;
  let skipped = 0;

  for (const signal of signals) {
    if (!signal.instrument || !signal.expiry) {
      skipped++;
      continue;
    }

    // Normalize expiry to UTC midnight for DhanInstrument lookup
    const expiryDate = new Date(
      Date.UTC(
        signal.expiry.getUTCFullYear(),
        signal.expiry.getUTCMonth(),
        signal.expiry.getUTCDate(),
      ),
    );

    const dhanInstrument = await prisma.dhanInstrument.findUnique({
      where: {
        underlying_expiry_strike_optionType: {
          underlying: signal.instrument,
          expiry: expiryDate,
          strike: signal.strike,
          optionType: signal.optionType,
        },
      },
      select: { lotSize: true },
    });

    if (dhanInstrument) {
      await prisma.signal.update({
        where: { id: signal.id },
        data: { lotSize: dhanInstrument.lotSize },
      });
      updated++;
    } else {
      skipped++;
    }
  }

  console.log(`Backfill complete: ${updated} updated, ${skipped} skipped (no matching DhanInstrument).`);
}

main()
  .catch((e) => {
    console.error("Backfill failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
