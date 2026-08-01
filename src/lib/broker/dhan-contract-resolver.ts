import { prisma } from "@/lib/prisma";
import type { InstrumentLiteral } from "@/lib/instruments";

function normalizeExpiryDate(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export interface DhanContract {
  securityId: string;
  exchangeSegment: string;
  tradingSymbol: string;
  lotSize: number;
}

export interface ResolveDhanContractInput {
  instrument: InstrumentLiteral;
  strike: number;
  optionType: "CE" | "PE";
  expiry: Date;
}

// Looks up the daily-synced DhanInstrument cache (see dhan-instrument-sync.ts)
// — returns null if this exact contract isn't in today's cache (e.g. the
// signal's expiry has already lapsed, or the cache hasn't synced yet).
export async function resolveDhanContract(
  input: ResolveDhanContractInput,
): Promise<DhanContract | null> {
  const row = await prisma.dhanInstrument.findUnique({
    where: {
      underlying_expiry_strike_optionType: {
        underlying: input.instrument,
        expiry: normalizeExpiryDate(input.expiry),
        strike: input.strike,
        optionType: input.optionType,
      },
    },
    select: { securityId: true, exchangeSegment: true, tradingSymbol: true, lotSize: true },
  });

  return row;
}
