import { prisma } from "@/lib/prisma";
import type { InstrumentLiteral } from "@/lib/instruments";

const SCRIP_MASTER_URL = "https://images.dhan.co/api-data/api-scrip-master-detailed.csv";

// Dhan's UNDERLYING_SYMBOL string for each of our four instruments, on the
// exchange (and therefore exchangeSegment) it actually trades options on.
const UNDERLYING_TO_INSTRUMENT: Record<string, InstrumentLiteral> = {
  NIFTY: "NIFTY",
  BANKNIFTY: "BANK_NIFTY",
  MIDCPNIFTY: "MIDCAP_NIFTY",
  SENSEX: "SENSEX",
};

const EXCH_TO_SEGMENT: Record<string, string> = {
  NSE: "NSE_FNO",
  BSE: "BSE_FNO",
};

// Minimal CSV line splitter that respects double-quoted fields (Dhan's
// DISPLAY_NAME column can contain commas) — avoids pulling in a CSV library
// for one file with a known, simple quoting style.
function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

interface ParsedContract {
  underlying: InstrumentLiteral;
  expiry: Date;
  strike: number;
  optionType: "CE" | "PE";
  securityId: string;
  exchangeSegment: string;
  tradingSymbol: string;
  lotSize: number;
}

function parseScripMasterCsv(csvText: string): ParsedContract[] {
  const lines = csvText.split("\n");
  const header = splitCsvLine(lines[0]);
  const col = (name: string) => {
    const idx = header.indexOf(name);
    if (idx === -1) throw new Error(`Dhan scrip master CSV is missing expected column "${name}"`);
    return idx;
  };

  const idx = {
    exch: col("EXCH_ID"),
    instrument: col("INSTRUMENT"),
    underlying: col("UNDERLYING_SYMBOL"),
    expiry: col("SM_EXPIRY_DATE"),
    strike: col("STRIKE_PRICE"),
    optionType: col("OPTION_TYPE"),
    securityId: col("SECURITY_ID"),
    displayName: col("DISPLAY_NAME"),
    lotSize: col("LOT_SIZE"),
  };

  const contracts: ParsedContract[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const fields = splitCsvLine(line);
    if (fields[idx.instrument] !== "OPTIDX") continue;

    const instrument = UNDERLYING_TO_INSTRUMENT[fields[idx.underlying]];
    if (!instrument) continue;

    const exchangeSegment = EXCH_TO_SEGMENT[fields[idx.exch]];
    if (!exchangeSegment) continue;

    const optionType = fields[idx.optionType];
    if (optionType !== "CE" && optionType !== "PE") continue;

    const expiry = new Date(`${fields[idx.expiry]}T00:00:00.000Z`);
    const strike = Math.round(Number(fields[idx.strike]));
    const lotSize = Math.round(Number(fields[idx.lotSize]));
    if (Number.isNaN(expiry.getTime()) || Number.isNaN(strike) || !lotSize) continue;

    contracts.push({
      underlying: instrument,
      expiry,
      strike,
      optionType,
      securityId: fields[idx.securityId],
      exchangeSegment,
      tradingSymbol: fields[idx.displayName],
      lotSize,
    });
  }

  return contracts;
}

export interface DhanInstrumentSyncResult {
  fetchedRows: number;
  storedContracts: number;
}

// Wholesale-replaces the DhanInstrument cache each run — this is a pure
// derived cache of Dhan's daily CSV publish, not audit data, so there's no
// reason to diff/upsert row by row.
export async function syncDhanInstruments(): Promise<DhanInstrumentSyncResult> {
  const res = await fetch(SCRIP_MASTER_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch Dhan scrip master: HTTP ${res.status}`);
  }
  const csvText = await res.text();
  const contracts = parseScripMasterCsv(csvText);

  await prisma.$transaction([
    prisma.dhanInstrument.deleteMany({}),
    prisma.dhanInstrument.createMany({ data: contracts }),
  ]);

  return { fetchedRows: contracts.length, storedContracts: contracts.length };
}
