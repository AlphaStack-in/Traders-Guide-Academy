"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { ManageSignalsTable, type ManageSignalRow } from "@/components/admin/manage-signals-table";
import {
  computeBoundaries,
  matchesDateFilter,
  type RangePreset,
  type SignalsDateFilter,
} from "@/lib/date-filter";
import { DateFilterChips } from "@/components/signals/date-filter-chips";

export type { RangePreset, SignalsDateFilter };

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
    () => rows.filter((row) => matchesDateFilter(row.signalTime, filter, boundaries)),
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
      <DateFilterChips filter={filter} onFilterChange={applyFilter} />

      {filter.range !== "all" && (
        <p className="text-xs text-muted-foreground">
          Showing {filteredRows.length} of {rows.length} signal{rows.length === 1 ? "" : "s"}
        </p>
      )}

      <ManageSignalsTable signals={filteredRows} />
    </div>
  );
}

