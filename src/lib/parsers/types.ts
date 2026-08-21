import type { InstrumentLiteral } from "@/lib/instruments";

export type OptionTypeLiteral = "CE" | "PE";
export type CustomerType = "SIGNALFLOW" | "GOODWILL";
export type ParserConfidence = "HIGH" | "MEDIUM" | "LOW";

export interface CanonicalSignalDraft {
  customer?: CustomerType;
  instrument: string; // e.g. "NIFTY", "SENSEX", "BANKNIFTY", "FINNIFTY", "MIDCPNIFTY", "RVNL", "TCS", "ADANI ENT", "JUBILANT", "GOLD", "CRUDE", "COPPER", etc.
  mappedInstrument?: InstrumentLiteral; // Mapped to SignalFlow enum if applicable
  instrumentType: "INDEX_OPTION" | "STOCK_OPTION" | "COMMODITY_OPTION" | "FUTURE" | "EQUITY";
  strike: number | null;
  optionType: OptionTypeLiteral | null;
  action: "BUY" | "SELL" | "EXIT" | "HOLD" | "UPDATE";
  entryLow: number | null;
  entryHigh: number | null;
  entryPrice: number | null; // Primary entry (min or exact)
  averagePrice: number | null;
  cmp: number | null;
  target1: number | null;
  target2: number | null;
  targets: number[];
  stopLoss: number | null;
  signalType?: string; // e.g., "Positional Breakout", "Hero Zero", "Intraday"
  context: string[]; // Structured contextual tags (e.g., ["Positional Breakout", "Result Based Trade"])
  status: "OPEN" | "TARGET_HIT" | "SL_HIT" | "CLOSED_MANUAL" | "UPDATE";
  notes?: string | null;
  rawMessage: string;
  parserName: CustomerType;
  parserVersion: string;
  confidence: ParserConfidence;
  warnings: string[];
  isUpdate: boolean;
  updateType?: "CMP_UPDATE" | "TARGET_HIT" | "AVERAGE_UPDATE" | "EXIT" | "HOLD" | "GENERAL";
  priceAtSignal?: number | null;
  sellPrice?: number | null;
}

export interface ParserOptions {
  customer?: CustomerType;
  defaultCustomer?: CustomerType;
}
