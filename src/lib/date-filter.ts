export type RangePreset = "all" | "today" | "week" | "month" | "custom";

export interface SignalsDateFilter {
  range: RangePreset;
  from: string;
  to: string;
}

export const PRESETS: { value: RangePreset; label: string }[] = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "custom", label: "Custom Range" },
];

export const RANGE_PRESETS: RangePreset[] = ["all", "today", "week", "month", "custom"];

// Monday-first index, matching the short weekday names Intl gives us.
const WEEKDAY_INDEX: Record<string, number> = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function dateKey(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

// Calendar boundaries (today/week-start/month-start) computed in IST, matching
// how signal dates are displayed elsewhere (see lib/utils.ts's timeZone pin).
export function istPartsNow() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(new Date());
  const map: Record<string, string> = {};
  for (const part of parts) map[part.type] = part.value;
  return {
    year: parseInt(map.year, 10),
    month: parseInt(map.month, 10),
    day: parseInt(map.day, 10),
    weekday: map.weekday,
  };
}

export function subtractDays(year: number, month: number, day: number, days: number) {
  const utc = new Date(Date.UTC(year, month - 1, day));
  utc.setUTCDate(utc.getUTCDate() - days);
  return { year: utc.getUTCFullYear(), month: utc.getUTCMonth() + 1, day: utc.getUTCDate() };
}

export function computeBoundaries() {
  const now = istPartsNow();
  const todayKey = dateKey(now.year, now.month, now.day);
  const daysSinceMonday = WEEKDAY_INDEX[now.weekday] ?? 0;
  const weekStart = subtractDays(now.year, now.month, now.day, daysSinceMonday);
  return {
    todayKey,
    weekStartKey: dateKey(weekStart.year, weekStart.month, weekStart.day),
    monthStartKey: dateKey(now.year, now.month, 1),
  };
}

export function rowDateKey(signalTime: string) {
  return new Date(signalTime).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

export function matchesDateFilter(
  signalTime: string,
  filter: SignalsDateFilter,
  boundaries: ReturnType<typeof computeBoundaries>,
) {
  if (filter.range === "all") return true;
  const key = rowDateKey(signalTime);
  if (filter.range === "today") return key === boundaries.todayKey;
  if (filter.range === "week") return key >= boundaries.weekStartKey && key <= boundaries.todayKey;
  if (filter.range === "month") return key >= boundaries.monthStartKey && key <= boundaries.todayKey;
  // custom
  if (filter.from && key < filter.from) return false;
  if (filter.to && key > filter.to) return false;
  return true;
}
