import { splitThcSignalBlocks, parseThcSignalBlock } from "./parsers/thc-parser";
import { parseSignalMessage as parseResolvedSignalMessage } from "./parsers/resolver";

export type { OptionTypeLiteral, CanonicalSignalDraft, CustomerType, ParserConfidence, ParserOptions } from "./parsers/types";
export type ParsedSignalDraft = ReturnType<typeof parseThcSignalBlock>;

export const splitSignalBlocks = splitThcSignalBlocks;
export const parseSignalBlock = parseThcSignalBlock;

export function parseSignalMessage(rawText: string, options?: any): any[] {
  return parseResolvedSignalMessage(rawText, options);
}

export { parseThcMessage, parseThcSignalBlock, splitThcSignalBlocks } from "./parsers/thc-parser";
export { parseGoodwillMessage } from "./parsers/goodwill-parser";
export { parseSignalMessage as parseCustomerSignalMessage, resolveCustomerParser } from "./parsers/resolver";
