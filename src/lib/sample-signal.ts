import { nextWeeklyExpiry } from "@/lib/expiry";
import type { SetupTypeValue } from "@/lib/setup-types";

const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function ordinal(day: number): string {
  if (day >= 11 && day <= 13) return `${day}th`;
  switch (day % 10) {
    case 1: return `${day}st`;
    case 2: return `${day}nd`;
    case 3: return `${day}rd`;
    default: return `${day}th`;
  }
}

/** Defaults for Manual Signal Entry fields that raw parse text does not carry. */
export const SAMPLE_SETUP_TYPE: SetupTypeValue = "GOLDEN_LINE";
export const SAMPLE_COMMENTS =
  "Hold till T1; trail SL to cost after first target.";

export function sampleManualEntryExtras() {
  return {
    risk: "Medium" as const,
    setupType: SAMPLE_SETUP_TYPE,
    comments: SAMPLE_COMMENTS,
  };
}

// Built fresh each time so EXPIRY always names NIFTY's actual next weekly
// contract as of today (see add-signal-form "Insert Sample Signal").
export function buildSampleSignalTemplate(): string {
  const [, monthStr, dayStr] = nextWeeklyExpiry().split("-");
  const expiryText = `${ordinal(parseInt(dayStr, 10))} ${MONTH_ABBR[parseInt(monthStr, 10) - 1]}`;
  return `BUY #NIFTY 24300 CE
ABOVE 160-170
TARGET- 18/40/80/150 POINT
SL-145
NOW 165
EXPIRY ${expiryText}`;
}
