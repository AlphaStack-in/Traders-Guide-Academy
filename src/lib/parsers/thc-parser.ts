import type { InstrumentLiteral } from "@/lib/instruments";
import type { CanonicalSignalDraft, OptionTypeLiteral } from "./types";

const BLOCK_START = /\d{4,6}\s*(?:ce|pe)/gi;
const STRIKE_TYPE = /(\d{4,6})\s*(CE|PE)/i;
const ENTRY = /Above\s*-?\s*(\d+(?:\.\d+)?)/i;
const STOP_LOSS = /SL\s*-?\s*(\d+(?:\.\d+)?)/i;
const TARGETS = /(?:Trgt|Target)\.?\s*-?\s*([\d.,\s]+)/i;
const PRICE_AT_SIGNAL = /Now\s*-?\s*(\d+(?:\.\d+)?)/i;
const SELL_PRICE = /sell(?:ing)?\s*price\s*-?\s*(\d+(?:\.\d+)?)/i;

function num(match: RegExpMatchArray | null): number | null {
  if (!match) return null;
  const value = parseFloat(match[1]);
  return Number.isFinite(value) ? value : null;
}

function detectInstrument(block: string): { instrument: InstrumentLiteral; detected: boolean } {
  const normalized = block.toUpperCase().replace(/\s+/g, "");
  if (normalized.includes("BANKNIFTY")) return { instrument: "BANK_NIFTY", detected: true };
  if (normalized.includes("MIDCPNIFTY") || normalized.includes("MIDCAPNIFTY")) {
    return { instrument: "MIDCAP_NIFTY", detected: true };
  }
  if (normalized.includes("SENSEX")) return { instrument: "SENSEX", detected: true };
  if (normalized.includes("NIFTY")) return { instrument: "NIFTY", detected: true };
  return { instrument: "NIFTY", detected: false };
}

export function splitThcSignalBlocks(rawText: string): string[] {
  const text = rawText.trim();
  if (!text) return [];

  const starts: number[] = [];
  for (const match of text.matchAll(BLOCK_START)) {
    if (match.index !== undefined) starts.push(match.index);
  }

  if (starts.length === 0) return [text];

  const blocks: string[] = [];
  for (let i = 0; i < starts.length; i++) {
    const start = starts[i];
    const end = i + 1 < starts.length ? starts[i + 1] : text.length;
    const block = text.slice(start, end).trim();
    if (block) blocks.push(block);
  }
  return blocks;
}

export function parseThcSignalBlock(block: string): CanonicalSignalDraft {
  const warnings: string[] = [];

  const strikeTypeMatch = block.match(STRIKE_TYPE);
  const strike = strikeTypeMatch ? parseInt(strikeTypeMatch[1], 10) : null;
  const optionType = strikeTypeMatch
    ? (strikeTypeMatch[2].toUpperCase() as OptionTypeLiteral)
    : null;
  if (!strike || !optionType) warnings.push("Could not detect strike + CE/PE");

  const { instrument, detected: instrumentDetected } = detectInstrument(block);
  if (!instrumentDetected) warnings.push("Could not detect instrument, defaulted to Nifty");

  const entryPrice = num(block.match(ENTRY));
  if (entryPrice == null) warnings.push("Missing entry price (Above)");

  const stopLoss = num(block.match(STOP_LOSS));
  if (stopLoss == null) warnings.push("Missing stop loss (SL)");

  const targetsMatch = block.match(TARGETS);
  const targets = targetsMatch
    ? targetsMatch[1]
        .split(",")
        .map((t) => parseFloat(t.trim()))
        .filter((t) => Number.isFinite(t))
    : [];
  if (targets.length === 0) warnings.push("Missing target(s) (Target)");

  const priceAtSignal = num(block.match(PRICE_AT_SIGNAL));
  if (priceAtSignal == null) warnings.push("Missing price at signal (Now)");

  const sellPrice = num(block.match(SELL_PRICE));

  const confidence = warnings.length === 0 ? "HIGH" : warnings.length <= 2 ? "MEDIUM" : "LOW";

  return {
    customer: "THC",
    instrument,
    mappedInstrument: instrument,
    instrumentType: "INDEX_OPTION",
    strike,
    optionType,
    action: "BUY",
    entryLow: entryPrice,
    entryHigh: entryPrice,
    entryPrice,
    averagePrice: null,
    cmp: priceAtSignal,
    target1: targets[0] ?? null,
    target2: targets[1] ?? null,
    targets,
    stopLoss,
    signalType: "Intraday",
    context: [],
    status: sellPrice != null ? "CLOSED_MANUAL" : "OPEN",
    rawMessage: block,
    parserName: "THC",
    parserVersion: "1.0.0",
    confidence,
    warnings,
    isUpdate: false,
    priceAtSignal,
    sellPrice,
  };
}

export function parseThcMessage(rawText: string): CanonicalSignalDraft[] {
  return splitThcSignalBlocks(rawText).map(parseThcSignalBlock);
}
