// Trade setup classification for a Signal (see Signal.setupType in
// schema.prisma) — a fixed vocabulary the admin picks from at signal
// creation, distinct from the dormant, unused CanonicalSignalDraft.signalType
// free-text field in the parser layer (src/lib/parsers/types.ts).
export type SetupTypeValue =
  | "ORB"
  | "BREAKOUT"
  | "BREAKDOWN"
  | "REVERSAL"
  | "CONTINUATION"
  | "TREND_FOLLOWING"
  | "RANGE_BOUND"
  | "SCALP"
  | "NEWS_BASED"
  | "OTHER";

export const SETUP_TYPES: SetupTypeValue[] = [
  "ORB",
  "BREAKOUT",
  "BREAKDOWN",
  "REVERSAL",
  "CONTINUATION",
  "TREND_FOLLOWING",
  "RANGE_BOUND",
  "SCALP",
  "NEWS_BASED",
  "OTHER",
];

export const SETUP_TYPE_LABEL: Record<SetupTypeValue, string> = {
  ORB: "ORB",
  BREAKOUT: "Breakout",
  BREAKDOWN: "Breakdown",
  REVERSAL: "Reversal",
  CONTINUATION: "Continuation",
  TREND_FOLLOWING: "Trend Following",
  RANGE_BOUND: "Range Bound",
  SCALP: "Scalp",
  NEWS_BASED: "News Based",
  OTHER: "Other",
};

// Short badge label — same as SETUP_TYPE_LABEL except ORB keeps its full
// expansion only in longer contexts (dropdowns); cards/badges want the
// terse form everywhere, which is already what SETUP_TYPE_LABEL holds.
export function formatSetupTypeLabel(setupType: SetupTypeValue | null | undefined): string | null {
  if (!setupType) return null;
  return SETUP_TYPE_LABEL[setupType];
}
