import { resolveInstrument, type InstrumentLiteral } from "@/lib/instruments";
import type { CanonicalSignalDraft, OptionTypeLiteral } from "./types";

const BLOCK_START = /(?:(?:NIFTY|SENSEX|BANKNIFTY|FINNIFTY|MIDCPNIFTY|MIDCAPNIFTY)\s*)?\d{4,6}\s*(?:ce|pe)/gi;
const STRIKE_TYPE = /(\d{4,6})\s*(CE|PE)/i;
const ENTRY = /Above\s*-?\s*(\d+(?:\.\d+)?)/i;
const STOP_LOSS = /SL\s*-?\s*(\d+(?:\.\d+)?)/i;
const TARGETS = /(?:Trgts?|Targets?|Trgt)\.?\s*-?\s*([\d.,\s]+)/i;
const PRICE_AT_SIGNAL = /Now\s*-?\s*(\d+(?:\.\d+)?)/i;
const SELL_PRICE = /sell(?:ing)?\s*price\s*-?\s*(\d+(?:\.\d+)?)/i;

function num(match: RegExpMatchArray | null): number | null {
  if (!match) return null;
  const value = parseFloat(match[1]);
  return Number.isFinite(value) ? value : null;
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

  const sellPrice = num(block.match(SELL_PRICE));

  const confidence = warnings.length === 0 ? "HIGH" : warnings.length <= 2 ? "MEDIUM" : "LOW";

  return {
    customer: "SIGNALFLOW",
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
    cmp: priceAtSignal ?? entryPrice,
    target1: targets[0] ?? null,
    target2: targets[1] ?? null,
    targets,
    stopLoss,
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
