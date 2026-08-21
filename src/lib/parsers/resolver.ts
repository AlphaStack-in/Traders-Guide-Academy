import { parseSignalFlowMessage } from "./signalflow-parser";
import { parseGoodwillMessage } from "./goodwill-parser";
import type { CanonicalSignalDraft, CustomerType, ParserOptions } from "./types";

export function resolveCustomerParser(customer?: CustomerType | string, rawText?: string): CustomerType {
  if (customer) {
    const norm = customer.toUpperCase().trim();
    if (norm === "GOODWILL") return "GOODWILL";
    // "SignalFlow" / "TRADERS_HUB_CENTER" kept as accepted aliases for backward compatibility
    // with any caller still passing the pre-rebrand customer value.
    if (norm === "SIGNALFLOW" || norm === "SignalFlow" || norm === "TRADERS_HUB_CENTER") return "SIGNALFLOW";
  }

  // Auto-detection based on message heuristics if customer is unspecified
  if (rawText) {
    const isGoodwill = /ALERT\s*:|CMP|POSTIONAL|POSITIONAL|HERO[\s\/]*ZERO|STOP@|BUY\s+AROUND|\b\d+(?:\.\d+)?\/\d+(?:\.\d+)?\b|CRUDE|GOLD|COPPER|JUBILANT|RVNL|TCS|ADANI|HOLD TILL|AVRG|TRG|CLOSING TIME/i.test(rawText);
    if (isGoodwill) return "GOODWILL";
  }

  return "SIGNALFLOW";
}

export function parseSignalMessage(
  rawText: string,
  options?: ParserOptions | CustomerType | string
): CanonicalSignalDraft[] {
  let customer: CustomerType | undefined;

  if (typeof options === "string") {
    customer = resolveCustomerParser(options, rawText);
  } else if (options && typeof options === "object") {
    customer = resolveCustomerParser(options.customer || options.defaultCustomer, rawText);
  } else {
    customer = resolveCustomerParser(undefined, rawText);
  }

  if (customer === "GOODWILL") {
    return parseGoodwillMessage(rawText);
  }

  return parseSignalFlowMessage(rawText);
}
