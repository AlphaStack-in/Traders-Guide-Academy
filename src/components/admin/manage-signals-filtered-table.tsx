"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ManageSignalsTable, type ManageSignalRow } from "@/components/admin/manage-signals-table";

export type RangePreset = "all" | "today" | "week" | "month" | "custom";

export interface SignalsDateFilter {
  range: RangePreset;
  from: string;
  to: string;
}

const PRESETS: { value: RangePreset; label: string }[] = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "custom", label: "Custom Range" },
];

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
function istPartsNow() {
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

function subtractDays(year: number, month: number, day: number, days: number) {
  const utc = new Date(Date.UTC(year, month - 1, day));
  utc.setUTCDate(utc.getUTCDate() - days);
  return { year: utc.getUTCFullYear(), month: utc.getUTCMonth() + 1, day: utc.getUTCDate() };
}

function computeBoundaries() {
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

function rowDateKey(signalTime: string) {
  return new Date(signalTime).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

function matchesFilter(
  row: ManageSignalRow,
  filter: SignalsDateFilter,
  boundaries: ReturnType<typeof computeBoundaries>,
) {
  if (filter.range === "all") return true;
  const key = rowDateKey(row.signalTime);
  if (filter.range === "today") return key === boundaries.todayKey;
  if (filter.range === "week") return key >= boundaries.weekStartKey && key <= boundaries.todayKey;
  if (filter.range === "month") return key >= boundaries.monthStartKey && key <= boundaries.todayKey;
  // custom
  if (filter.from && key < filter.from) return false;
  if (filter.to && key > filter.to) return false;
  return true;
}

export function ManageSignalsFilteredTable({
  rows,
  initialFilter,
}: {
  rows: ManageSignalRow[];
  initialFilter: SignalsDateFilter;
}) {
  const pathname = usePathname();
  const [filter, setFilter] = useState<SignalsDateFilter>(initialFilter);
  const boundaries = useMemo(() => computeBoundaries(), []);

  const filteredRows = useMemo(
    () => rows.filter((row) => matchesFilter(row, filter, boundaries)),
    [rows, filter, boundaries],
  );

  function applyFilter(next: SignalsDateFilter) {
    setFilter(next);

    // Plain History API replace — keeps the URL shareable/refresh-safe without
    // triggering a Next.js server round-trip for what is a client-side filter.
    const params = new URLSearchParams();
    if (next.range !== "all") {
      params.set("range", next.range);
      if (next.range === "custom") {
        if (next.from) params.set("from", next.from);
        if (next.to) params.set("to", next.to);
      }
    }
    const query = params.toString();
    window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => applyFilter({ ...filter, range: preset.value })}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              filter.range === preset.value
                ? "border-primary/60 bg-primary/10 text-primary"
                : "border-white/10 bg-black/20 text-muted-foreground hover:border-primary/40 hover:text-primary",
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {filter.range === "custom" && (
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="date"
            value={filter.from}
            onChange={(e) => applyFilter({ ...filter, from: e.target.value })}
            className="h-8 w-auto"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <Input
            type="date"
            value={filter.to}
            onChange={(e) => applyFilter({ ...filter, to: e.target.value })}
            className="h-8 w-auto"
          />
        </div>
      )}

      {filter.range !== "all" && (
        <p className="text-xs text-muted-foreground">
          Showing {filteredRows.length} of {rows.length} signal{rows.length === 1 ? "" : "s"}
        </p>
      )}

      <ManageSignalsTable signals={filteredRows} />
    </div>
  );
}
