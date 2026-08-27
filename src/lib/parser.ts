// This module is the entry point for the shared, multi-vendor parser
// library this project was forked from — it still carries Goodwill's
// (a different client's signal-group format) parser and the auto-detecting
// resolveCustomerParser/parseSignalMessage that guesses between the two.
//
// TGA is single-tenant and only ever receives its own signal format, so
// TGA's live UI (src/components/admin/add-signal-form.tsx) deliberately
// imports parseSignalFlowMessage directly, NOT parseSignalMessage/
// resolveCustomerParser below — see that file's handleParse comment.
// The generic/Goodwill exports here are kept only for the standalone
// scripts/test_full_validation.ts and scripts/test_instrument_detection.ts
// dev scripts (not part of `npm run build` or `npm test`), which exercise
// the shared library in isolation; nothing reachable from TGA's app routes
// calls them.
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
