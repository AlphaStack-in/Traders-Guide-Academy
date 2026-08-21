import { splitSignalFlowSignalBlocks, parseSignalFlowSignalBlock } from "./parsers/signalflow-parser";
import { parseSignalMessage as parseResolvedSignalMessage } from "./parsers/resolver";

export type { OptionTypeLiteral, CanonicalSignalDraft, CustomerType, ParserConfidence, ParserOptions } from "./parsers/types";
export type ParsedSignalDraft = ReturnType<typeof parseSignalFlowSignalBlock>;

export const splitSignalBlocks = splitSignalFlowSignalBlocks;
export const parseSignalBlock = parseSignalFlowSignalBlock;

export function parseSignalMessage(rawText: string, options?: any): any[] {
  return parseResolvedSignalMessage(rawText, options);
}

export { parseSignalFlowMessage, parseSignalFlowSignalBlock, splitSignalFlowSignalBlocks } from "./parsers/signalflow-parser";
export { parseGoodwillMessage } from "./parsers/goodwill-parser";
export { parseSignalMessage as parseCustomerSignalMessage, resolveCustomerParser } from "./parsers/resolver";
