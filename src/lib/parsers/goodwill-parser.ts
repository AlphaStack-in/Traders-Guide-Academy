import type { InstrumentLiteral } from "@/lib/instruments";
import type { CanonicalSignalDraft, OptionTypeLiteral, ParserConfidence } from "./types";

// Stock & Commodity Dictionary for non-index instruments
const KNOWN_STOCKS = [
  "RVNL", "TCS", "ADANI ENT", "ADANI", "JUBILANT", "RELIANCE", "INFY", "TATAMOTORS",
  "TATASTEEL", "ICICIBANK", "HDFCBANK", "SBIN", "BHARTIARTL", "ITC", "LT"
];

const KNOWN_COMMODITIES = ["GOLD", "CRUDE", "COPPER", "SILVER", "NATURALGAS"];

const KNOWN_INDEXES = ["NIFTY", "SENSEX", "BANKNIFTY", "BANK_NIFTY", "FINNIFTY", "MIDCPNIFTY", "MIDCAPNIFTY"];

function mapToThcInstrument(name: string): InstrumentLiteral {
  const norm = name.toUpperCase().replace(/\s+/g, "");
  if (norm.includes("BANKNIFTY")) return "BANK_NIFTY";
  if (norm.includes("MIDCPNIFTY") || norm.includes("MIDCAPNIFTY")) return "MIDCAP_NIFTY";
  if (norm.includes("SENSEX")) return "SENSEX";
  return "NIFTY";
}

export function parseGoodwillMessage(rawText: string): CanonicalSignalDraft[] {
  const text = rawText.trim();
  if (!text) return [];

  // Check for multi-instrument split via '&' or multiple distinct lines
  // e.g. "ADANI ENT & NIFTY 24900 CE HOLD TILL NEXT UPDATE"
  if (text.includes("&")) {
    const parts = text.split("&").map((p) => p.trim()).filter(Boolean);
    if (parts.length > 1) {
      const results: CanonicalSignalDraft[] = [];
      for (let i = 0; i < parts.length; i++) {
        const partText = parts[i];
        // If part doesn't contain action or update phrase, append the trailing action from the main text
        let blockText = partText;
        if (!/HOLD|BUY|SELL|EXIT|CMP|TRG/i.test(blockText) && /HOLD|BUY|SELL|EXIT|CMP|TRG/i.test(parts[parts.length - 1])) {
          const mainActionMatch = parts[parts.length - 1].match(/(HOLD|BUY|SELL|EXIT|CMP|TRG).*/i);
          if (mainActionMatch) {
            blockText += " " + mainActionMatch[0];
          }
        }
        results.push(parseSingleGoodwillBlock(blockText, text));
      }
      return results;
    }
  }

  // Split multi-line messages if they represent distinct signals
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length > 1) {
    // If lines contain multiple buy/signal indicators, process them separately or as one block
    const signalLines = lines.filter((l) => /NIFTY|SENSEX|BANKNIFTY|FINNIFTY|MIDCPNIFTY|BUY|SELL|ALERT|CMP|HERO|CRUDE|GOLD|COPPER/i.test(l));
    if (signalLines.length > 1 && lines.some((l) => /BUY|CMP|HERO ZERO|ALERT/i.test(l))) {
      // Check if entire text can be parsed as one signal (e.g. Hero Zero \n Buy nifty 24500ce @ 25/20)
      const combinedParse = parseSingleGoodwillBlock(text, text);
      if (combinedParse.strike != null || combinedParse.action === "BUY") {
        return [combinedParse];
      }
    }
  }

  return [parseSingleGoodwillBlock(text, text)];
}

function parseSingleGoodwillBlock(block: string, fullRawMessage: string): CanonicalSignalDraft {
  const warnings: string[] = [];
  const upper = block.toUpperCase();

  // 1. Detect Instrument & Type
  let instrument = "NIFTY";
  let instrumentType: CanonicalSignalDraft["instrumentType"] = "INDEX_OPTION";

  let foundInst = false;
  for (const idx of KNOWN_INDEXES) {
    const cleanIdx = idx.replace("_", "");
    if (upper.replace(/\s+/g, "").includes(cleanIdx)) {
      instrument = idx === "BANK_NIFTY" ? "BANKNIFTY" : idx === "MIDCAPNIFTY" ? "MIDCPNIFTY" : idx;
      instrumentType = "INDEX_OPTION";
      foundInst = true;
      break;
    }
  }

  if (!foundInst) {
    for (const stk of KNOWN_STOCKS) {
      if (upper.includes(stk)) {
        instrument = stk;
        instrumentType = "STOCK_OPTION";
        foundInst = true;
        break;
      }
    }
  }

  if (!foundInst) {
    for (const cmd of KNOWN_COMMODITIES) {
      if (upper.includes(cmd)) {
        instrument = cmd;
        instrumentType = "COMMODITY_OPTION";
        foundInst = true;
        break;
      }
    }
  }

  if (!foundInst) {
    // Attempt regex fallback for unknown stock symbols before strike/CE/PE
    const unknownStockMatch = block.match(/([A-Z]{2,10})\s+\d{2,6}\s*(?:CE|PE)/i);
    if (unknownStockMatch) {
      instrument = unknownStockMatch[1].toUpperCase();
      instrumentType = "STOCK_OPTION";
      foundInst = true;
    } else {
      warnings.push("Could not detect specific instrument; defaulted to NIFTY");
    }
  }

  // 2. Strike & Option Type (CE/PE)
  const strikeTypeMatch = block.match(/(\d{2,6})\s*(CE|PE)/i);
  const strike = strikeTypeMatch ? parseInt(strikeTypeMatch[1], 10) : null;
  const optionType = strikeTypeMatch ? (strikeTypeMatch[2].toUpperCase() as OptionTypeLiteral) : null;

  // 3. Parse Context & Tags
  const context: string[] = [];
  
  if (/HERO[\s\/]*ZERO/i.test(block)) context.push("Hero Zero");
  if (/POSTIONAL|POSITIONAL/i.test(block) && /BREAKOUT/i.test(block)) context.push("Positional Breakout");
  if (/RESULT\s+BASED/i.test(block)) context.push("Result Based Trade");
  if (/RISK\s+TRADE/i.test(block)) context.push("Risk Trade");
  if (/SMALL\s+QUANTITY/i.test(block)) context.push("Small Quantity Only");
  if (/BUY\s+ON\s+LOW/i.test(block)) context.push("Buy On Low");
  if (/\bHOLD\b/i.test(block)) context.push("Hold");
  if (/CLOSING\s+TIME\s+EXIT/i.test(block)) context.push("Closing Time Exit");
  if (/TRG\s+OPEN|TARGET\s+OPEN/i.test(block)) context.push("Trg Open");

  // Determine signalType
  let signalType = "Intraday";
  if (context.includes("Positional Breakout")) signalType = "Positional Breakout";
  else if (context.includes("Hero Zero")) signalType = "Hero Zero";

  // 4. Action & Lifecycle Identification
  let action: CanonicalSignalDraft["action"] = "BUY";
  let isUpdate = false;
  let updateType: CanonicalSignalDraft["updateType"] = undefined;
  let status: CanonicalSignalDraft["status"] = "OPEN";

  if (/EXIT|CLOSING TIME EXIT/i.test(block)) {
    action = "EXIT";
    isUpdate = true;
    updateType = "EXIT";
    status = "CLOSED_MANUAL";
  } else if (/CMP|NOW\s+\d+|FROM\s+\d+\s+TO\s+\d+/i.test(block) && !/BUY\s+AROUND|BUY\s+NIFTY|BUY\s+CRUDE|BUY\s+COPPER|BUY\s+TCS/i.test(block)) {
    action = "UPDATE";
    isUpdate = true;
    updateType = "CMP_UPDATE";
  } else if (/\bHOLD\b|HOLD TILL NEXT UPDATE/i.test(block) && !/BUY/i.test(block)) {
    action = "HOLD";
    isUpdate = true;
    updateType = "HOLD";
  } else if (/SELL/i.test(block)) {
    action = "SELL";
  }

  // 5. Entry Price Range Normalization (e.g. 22/10, 20/15, 6/5, 1.50/1, 82/70, 149/100, 21.5/20, @ 25/20)
  let entryLow: number | null = null;
  let entryHigh: number | null = null;
  let entryPrice: number | null = null;

  // Match range like "AROUND 22/10", "@ 25/20", "@110/100", "BUY AROUND 1.50/1", "21.5/20"
  const rangeMatch = block.match(/(?:AROUND|@|BUY|\s|^)\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/i);
  if (rangeMatch) {
    const valA = parseFloat(rangeMatch[1]);
    const valB = parseFloat(rangeMatch[2]);
    if (Number.isFinite(valA) && Number.isFinite(valB)) {
      entryLow = Math.min(valA, valB);
      entryHigh = Math.max(valA, valB);
      entryPrice = entryLow;
    }
  }

  // Single entry price if range not found (e.g. "@ 25", "BUY 100", "FROM 21")
  if (entryLow == null) {
    const singleEntryMatch = block.match(/(?:AROUND|@|BUY|FROM)\s+(\d+(?:\.\d+)?)/i);
    if (singleEntryMatch) {
      const val = parseFloat(singleEntryMatch[1]);
      if (Number.isFinite(val)) {
        entryLow = val;
        entryHigh = val;
        entryPrice = val;
      }
    }
  }

  // 6. Average Price (e.g. AVRG 17)
  let averagePrice: number | null = null;
  const avrgMatch = block.match(/(?:AVRG|AVERAGE)\s*(\d+(?:\.\d+)?)/i);
  if (avrgMatch) {
    averagePrice = parseFloat(avrgMatch[1]);
    if (isUpdate) updateType = "AVERAGE_UPDATE";
  }

  // 7. CMP (Current Market Price) (e.g. CMP 28, CMP 30, NOW 1600, TO 95)
  let cmp: number | null = null;
  const cmpMatch = block.match(/(?:CMP|NOW|TO)\s*(\d+(?:\.\d+)?)/i);
  if (cmpMatch) {
    cmp = parseFloat(cmpMatch[1]);
  }

  // 8. Targets & Stop Loss
  let target1: number | null = null;
  let target2: number | null = null;
  const targets: number[] = [];

  // Parse Target patterns like "TRG 98/134", "TARGET 25/30", "Target 140 & 170", "TRG 9/16"
  const trgRangeMatch = block.match(/(?:TRG|TARGET)\.?\s*(\d+(?:\.\d+)?)\s*(?:\/|&|\s+AND\s+)\s*(\d+(?:\.\d+)?)/i);
  if (trgRangeMatch) {
    const t1 = parseFloat(trgRangeMatch[1]);
    const t2 = parseFloat(trgRangeMatch[2]);
    if (Number.isFinite(t1)) {
      target1 = t1;
      targets.push(t1);
    }
    if (Number.isFinite(t2)) {
      target2 = t2;
      targets.push(t2);
    }
  } else {
    // Single target or TRG OPEN
    const singleTrgMatch = block.match(/(?:TRG|TARGET)\.?\s*(\d+(?:\.\d+)?)/i);
    if (singleTrgMatch) {
      target1 = parseFloat(singleTrgMatch[1]);
      targets.push(target1);
    }
  }

  // Target Hit Detection (e.g. TRG1 hit, NEAR TI 1TRG)
  if (/TRG1\s+HIT|1TRG\s+HIT|TARGET\s+1\s+HIT|NEAR\s+.*1TRG/i.test(block)) {
    status = "TARGET_HIT";
    if (cmp != null && target1 == null) target1 = cmp;
    if (isUpdate) updateType = "TARGET_HIT";
  }

  // Stop Loss (e.g. STOP@58, STOP@ 24.60, STOP@1, STOP@2, Sl 90, sl 17, STOPLOSS)
  let stopLoss: number | null = null;
  const slMatch = block.match(/(?:STOP@?|SL|STOPLOSS)\s*@?\s*(\d+(?:\.\d+)?)/i);
  if (slMatch) {
    stopLoss = parseFloat(slMatch[1]);
  }

  // 9. Notes extraction (e.g. NOTE price came low 87, NOTE CMP 98 BUY ON LOW, RESULT BASED TRADE)
  let notes: string | null = null;
  const noteMatch = block.match(/NOTE\s+([^(\n]+)/i);
  if (noteMatch) {
    notes = noteMatch[0].trim();
  } else {
    const bracketMatch = block.match(/\(\s*([^)]+)\s*\)/);
    if (bracketMatch) {
      notes = bracketMatch[1].trim();
    }
  }

  // 10. Calculate Confidence
  let confidence: ParserConfidence = "HIGH";
  if (strike == null && !["GOLD", "CRUDE", "COPPER"].includes(instrument) && !isUpdate && action !== "HOLD") {
    confidence = "MEDIUM";
    warnings.push("Strike and option type could not be confidently identified");
  }
  if (entryPrice == null && cmp == null && !isUpdate && action !== "HOLD") {
    confidence = "LOW";
    warnings.push("Missing entry price and CMP");
  }
  if (targets.length === 0 && stopLoss == null && !isUpdate && !context.includes("Trg Open") && action !== "HOLD") {
    if (confidence === "HIGH") confidence = "MEDIUM";
    warnings.push("Missing targets and stop loss");
  }

  return {
    customer: "GOODWILL",
    instrument,
    mappedInstrument: mapToThcInstrument(instrument),
    instrumentType,
    strike,
    optionType,
    action,
    entryLow,
    entryHigh,
    entryPrice: entryPrice ?? entryLow,
    averagePrice,
    cmp,
    target1,
    target2,
    targets,
    stopLoss,
    signalType,
    context,
    status,
    notes,
    rawMessage: fullRawMessage,
    parserName: "GOODWILL",
    parserVersion: "1.0.0",
    confidence,
    warnings,
    isUpdate,
    updateType,
    priceAtSignal: cmp ?? entryPrice ?? entryLow,
  };
}
