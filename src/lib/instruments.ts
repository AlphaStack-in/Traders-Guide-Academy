export type InstrumentLiteral = "NIFTY" | "SENSEX" | "MIDCAP_NIFTY" | "BANK_NIFTY";

export const INSTRUMENTS: InstrumentLiteral[] = [
  "NIFTY",
  "SENSEX",
  "BANK_NIFTY",
  "MIDCAP_NIFTY",
];

export const INSTRUMENT_LABEL: Record<InstrumentLiteral, string> = {
  NIFTY: "Nifty",
  SENSEX: "Sensex",
  BANK_NIFTY: "Bank Nifty",
  MIDCAP_NIFTY: "Midcap Nifty",
};

export interface InstrumentConfig {
  label: string;
  aliases: string[];
  strikeRange: { min: number; max: number };
}

export const INSTRUMENT_CONFIGS: Record<InstrumentLiteral, InstrumentConfig> = {
  NIFTY: {
    label: "Nifty",
    aliases: ["NIFTY", "NIFTY50", "NIFTY 50", "FINNIFTY", "FIN NIFTY"],
    strikeRange: { min: 14000, max: 32000 },
  },
  SENSEX: {
    label: "Sensex",
    aliases: ["SENSEX", "BSESENSEX", "BSE SENSEX"],
    strikeRange: { min: 55000, max: 100000 },
  },
  BANK_NIFTY: {
    label: "Bank Nifty",
    aliases: ["BANKNIFTY", "BANK NIFTY", "BANK_NIFTY"],
    strikeRange: { min: 35000, max: 54999 },
  },
  MIDCAP_NIFTY: {
    label: "Midcap Nifty",
    aliases: ["MIDCPNIFTY", "MIDCAPNIFTY", "MIDCAP NIFTY"],
    strikeRange: { min: 7000, max: 13999 },
  },
};

export interface ResolvedInstrumentResult {
  instrument: InstrumentLiteral | null;
  detectedBy: "EXPLICIT_NAME" | "STRIKE_RANGE" | "UNRESOLVED";
  warning?: string;
}

export function resolveInstrument(text: string, strike?: number | null): ResolvedInstrumentResult {
  const upper = text.toUpperCase();

  // Priority 1 — Explicit instrument name matching
  for (const [key, config] of Object.entries(INSTRUMENT_CONFIGS) as [InstrumentLiteral, InstrumentConfig][]) {
    for (const alias of config.aliases) {
      const cleanAlias = alias.replace(/\s+/g, "");
      const regex = new RegExp(`\\b${alias.replace(/\s+/g, "\\s*")}\\b`, "i");
      if (regex.test(text) || upper.includes(cleanAlias)) {
        return {
          instrument: key,
          detectedBy: "EXPLICIT_NAME",
        };
      }
    }
  }

  // Priority 2 — Strike-price range fallback if strike is provided
  if (strike != null && Number.isFinite(strike)) {
    for (const [key, config] of Object.entries(INSTRUMENT_CONFIGS) as [InstrumentLiteral, InstrumentConfig][]) {
      if (strike >= config.strikeRange.min && strike <= config.strikeRange.max) {
        return {
          instrument: key,
          detectedBy: "STRIKE_RANGE",
          warning: `Instrument inferred as ${config.label} from strike ${strike}`,
        };
      }
    }
  }

  // Priority 3 — Ambiguous / Unresolved
  return {
    instrument: null,
    detectedBy: "UNRESOLVED",
    warning: "Instrument could not be determined",
  };
}
