import { resolveInstrument, type InstrumentLiteral } from "@/lib/instruments";
import type { CanonicalSignalDraft, OptionTypeLiteral } from "./types";

const BLOCK_START = /(?:(?:NIFTY|SENSEX|BANKNIFTY|FINNIFTY|MIDCPNIFTY|MIDCAPNIFTY)\s*)?\d{4,6}\s*(?:ce|pe)/gi;
const STRIKE_TYPE = /(\d{4,6})\s*(CE|PE)/i;
// Captures an optional range upper bound too, e.g. "Above 160-170" as well
// as the older single-value "Above 245".
const ENTRY = /Above\s*-?\s*(\d+(?:\.\d+)?)(?:\s*-\s*(\d+(?:\.\d+)?))?/i;
const STOP_LOSS = /SL\s*-?\s*(\d+(?:\.\d+)?)/i;
// Target lists may be "," or "/" separated ("Targets 155,170" as well as
// "TARGET- 18/40/80/150"); trailing words like "POINT"/"POINTS" fall
// outside the character class and are ignored automatically.
const TARGETS = /(?:Trgts?|Targets?|Trgt)\.?\s*-?\s*([\d.,/\s]+)/i;
const PRICE_AT_SIGNAL = /Now\s*-?\s*(\d+(?:\.\d+)?)/i;
const SELL_PRICE = /sell(?:ing)?\s*price\s*-?\s*(\d+(?:\.\d+)?)/i;

const EXPIRY_KEYWORD = /Expiry/i;
// "EXPIRY 18th Aug", "Expiry - 18 August", "EXPIRY: 18Aug"
const EXPIRY_TEXT = /Expiry\s*[:\-]?\s*(\d{1,2})\s*(?:st|nd|rd|th)?\s*([A-Za-z]{3,})/i;
// "EXPIRY 18/08", "Expiry - 18-08-2026" (numeric fallback)
const EXPIRY_NUMERIC = /Expiry\s*[:\-]?\s*(\d{1,2})[/\-](\d{1,2})(?:[/\-](\d{2,4}))?/i;

const MONTH_INDEX: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

function num(match: RegExpMatchArray | null): number | null {
  if (!match) return null;
  const value = parseFloat(match[1]);
  return Number.isFinite(value) ? value : null;
}

function formatISODate(year: number, monthIndex: number, day: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// A written date with no year ("18th Aug") is assumed to be the next
// occurrence of that day/month from `now` — i.e. this year unless that date
// has already passed, in which case next year. Options signals are always
// forward-looking, so a resolved date in the past would be nonsensical.
function resolveYear(monthIndex: number, day: number, now: Date): number {
  const year = now.getFullYear();
  const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  return new Date(year, monthIndex, day) < cutoff ? year + 1 : year;
}

function isValidCalendarDate(year: number, monthIndex: number, day: number): boolean {
  const d = new Date(year, monthIndex, day);
  return d.getFullYear() === year && d.getMonth() === monthIndex && d.getDate() === day;
}

/**
 * Extracts an explicit expiry date from signal text, e.g. "EXPIRY 18th aug".
 * Returns { expiry: null, hadExpiryKeyword: false } when the block doesn't
 * mention expiry at all (most signal formats don't — callers should keep
 * their own default in that case, not treat this as an error).
 */
function parseExpiry(block: string, now: Date = new Date()): { expiry: string | null; hadExpiryKeyword: boolean } {
  if (!EXPIRY_KEYWORD.test(block)) return { expiry: null, hadExpiryKeyword: false };

  const textMatch = block.match(EXPIRY_TEXT);
  if (textMatch) {
    const day = parseInt(textMatch[1], 10);
    const monthIndex = MONTH_INDEX[textMatch[2].toLowerCase().slice(0, 3)];
    if (monthIndex !== undefined) {
      const year = resolveYear(monthIndex, day, now);
      if (isValidCalendarDate(year, monthIndex, day)) {
        return { expiry: formatISODate(year, monthIndex, day), hadExpiryKeyword: true };
      }
    }
  }

  const numericMatch = block.match(EXPIRY_NUMERIC);
  if (numericMatch) {
    const day = parseInt(numericMatch[1], 10);
    const monthIndex = parseInt(numericMatch[2], 10) - 1;
    const yearRaw = numericMatch[3];
    const year = yearRaw
      ? (yearRaw.length === 2 ? 2000 + parseInt(yearRaw, 10) : parseInt(yearRaw, 10))
      : resolveYear(monthIndex, day, now);
    if (monthIndex >= 0 && monthIndex <= 11 && isValidCalendarDate(year, monthIndex, day)) {
      return { expiry: formatISODate(year, monthIndex, day), hadExpiryKeyword: true };
    }
  }

  return { expiry: null, hadExpiryKeyword: true };
}

export function splitSignalFlowSignalBlocks(rawText: string): string[] {
  const text = rawText.trim();
  if (!text) return [];

  const matches = Array.from(text.matchAll(BLOCK_START));
  if (matches.length === 0) return [text];

  const starts: number[] = [];
  for (const match of matches) {
    if (match.index !== undefined) starts.push(match.index);
  }

  const blocks: string[] = [];
  for (let i = 0; i < starts.length; i++) {
    const start = starts[i];
    const end = i + 1 < starts.length ? starts[i + 1] : text.length;
    const block = text.slice(start, end).trim();
    if (block) blocks.push(block);
  }
  return blocks;
}

export function parseSignalFlowSignalBlock(block: string, rawTextContext?: string): CanonicalSignalDraft {
  const warnings: string[] = [];

  const strikeTypeMatch = block.match(STRIKE_TYPE);
  const strike = strikeTypeMatch ? parseInt(strikeTypeMatch[1], 10) : null;
  const optionType = strikeTypeMatch
    ? (strikeTypeMatch[2].toUpperCase() as OptionTypeLiteral)
    : null;
  if (!strike || !optionType) warnings.push("Could not detect strike + CE/PE");

  // Instrument resolution: Priority 1 (Explicit), Priority 2 (Strike Range), Priority 3 (Unresolved)
  const resolvedInBlock = resolveInstrument(block, strike);
  const resolvedInContext = rawTextContext ? resolveInstrument(rawTextContext, strike) : null;

  let instrument: InstrumentLiteral = "NIFTY";
  let isExplicit = false;

  if (resolvedInBlock.detectedBy === "EXPLICIT_NAME" && resolvedInBlock.instrument) {
    instrument = resolvedInBlock.instrument;
    isExplicit = true;
  } else if (resolvedInContext && resolvedInContext.detectedBy === "EXPLICIT_NAME" && resolvedInContext.instrument) {
    instrument = resolvedInContext.instrument;
    isExplicit = true;
  } else if (resolvedInBlock.detectedBy === "STRIKE_RANGE" && resolvedInBlock.instrument) {
    instrument = resolvedInBlock.instrument;
    if (resolvedInBlock.warning) warnings.push(resolvedInBlock.warning);
  } else if (resolvedInContext && resolvedInContext.detectedBy === "STRIKE_RANGE" && resolvedInContext.instrument) {
    instrument = resolvedInContext.instrument;
    if (resolvedInContext.warning) warnings.push(resolvedInContext.warning);
  } else {
    // Unresolved
    warnings.push("Instrument could not be determined");
  }

  const entryMatch = block.match(ENTRY);
  const entryLow = entryMatch ? parseFloat(entryMatch[1]) : null;
  const entryHigh = entryMatch && entryMatch[2] ? parseFloat(entryMatch[2]) : entryLow;
  const entryPrice = entryLow;
  if (entryPrice == null) warnings.push("Missing entry price (Above)");

  const stopLoss = num(block.match(STOP_LOSS));
  if (stopLoss == null) warnings.push("Missing stop loss (SL)");

  const targetsMatch = block.match(TARGETS);
  const targets = targetsMatch
    ? targetsMatch[1]
        .split(/[,/]/)
        .map((t) => parseFloat(t.trim()))
        .filter((t) => Number.isFinite(t))
    : [];
  if (targets.length === 0) warnings.push("Missing target(s) (Target)");

  const priceAtSignal = num(block.match(PRICE_AT_SIGNAL));

  const sellPrice = num(block.match(SELL_PRICE));

  const { expiry, hadExpiryKeyword } = parseExpiry(block);
  if (hadExpiryKeyword && expiry == null) warnings.push("Could not parse expiry date");

  const confidence = warnings.length === 0 ? "HIGH" : warnings.length <= 2 ? "MEDIUM" : "LOW";

  return {
    customer: "SIGNALFLOW",
    instrument,
    mappedInstrument: instrument,
    instrumentType: "INDEX_OPTION",
    strike,
    optionType,
    action: "BUY",
    entryLow,
    entryHigh,
    entryPrice,
    averagePrice: null,
    cmp: priceAtSignal ?? entryPrice,
    target1: targets[0] ?? null,
    target2: targets[1] ?? null,
    targets,
    stopLoss,
    expiry,
    signalType: "Intraday",
    context: [],
    status: sellPrice != null ? "CLOSED_MANUAL" : "OPEN",
    rawMessage: block,
    parserName: "SIGNALFLOW",
    parserVersion: "1.0.0",
    confidence,
    warnings,
    isUpdate: false,
    priceAtSignal: priceAtSignal ?? entryPrice,
    sellPrice,
  };
}

export function parseSignalFlowMessage(rawText: string): CanonicalSignalDraft[] {
  return splitSignalFlowSignalBlocks(rawText).map((block) => parseSignalFlowSignalBlock(block, rawText));
}
