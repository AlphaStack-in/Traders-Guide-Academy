"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import {
  computeBoundaries,
  matchesDateFilter,
  type SignalsDateFilter,
} from "@/lib/date-filter";
import { DateFilterChips } from "@/components/signals/date-filter-chips";
import { changelogTimestamp, type ChangelogEntry } from "@/lib/changelog";

export function ChangelogTimeline({
  entries,
  currentVersion,
  initialFilter,
}: {
  entries: ChangelogEntry[];
  currentVersion: string;
  initialFilter: SignalsDateFilter;
}) {
  const pathname = usePathname();
  const [filter, setFilter] = useState<SignalsDateFilter>(initialFilter);
  const boundaries = useMemo(() => computeBoundaries(), []);

  // Only the first entry whose version matches the running version is marked
  // as currently deployed — prevents duplicate badges when multiple entries
  // share the same version string (iterative patches under one release).
  const currentIndex = entries.findIndex((entry) => entry.version === currentVersion);

  const filteredEntries = useMemo(
    () =>
      entries
        .map((entry, index) => ({ entry, index }))
        .filter(({ entry }) => matchesDateFilter(changelogTimestamp(entry.date), filter, boundaries)),
    [entries, filter, boundaries],
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
    <div className="flex flex-col gap-6">
      <DateFilterChips filter={filter} onFilterChange={applyFilter} />

      {filter.range !== "all" && (
        <p className="-mt-2 text-xs text-muted-foreground">
          Showing {filteredEntries.length} of {entries.length} release{entries.length === 1 ? "" : "s"}
        </p>
      )}

      {filteredEntries.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-[#0d0e14]/80 p-6 text-center text-sm text-muted-foreground">
          No releases in this range.
        </p>
      ) : (
        filteredEntries.map(({ entry, index }) => {
          const isCurrent = index === currentIndex;

          return (
            <div
              key={`${entry.version}-${index}`}
              className={`relative rounded-2xl border p-5 transition-all duration-200 ${
                isCurrent
                  ? "border-emerald-500/40 bg-emerald-950/10 shadow-xl"
                  : "border-white/10 bg-[#0d0e14]/80 hover:border-white/20"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3 mb-4">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="px-2.5 py-1 rounded-lg bg-primary/20 text-primary border border-primary/30 text-xs font-bold font-mono">
                    v{entry.version}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">{entry.date}</span>
                </div>

                {isCurrent && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-emerald-400 bg-emerald-500/20 border border-emerald-500/40 animate-pulse w-fit">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Currently Deployed
                  </span>
                )}
              </div>

              <h3 className="text-base font-bold text-foreground leading-snug mb-3">{entry.title}</h3>

              <ul className="flex flex-col gap-2 pl-2 text-xs text-muted-foreground">
                {entry.highlights.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-primary font-bold shrink-0">•</span>
                    <span className="text-foreground/90">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })
      )}
    </div>
  );
}
