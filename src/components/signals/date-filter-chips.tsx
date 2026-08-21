"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PRESETS, type SignalsDateFilter } from "@/lib/date-filter";

interface DateFilterChipsProps {
  filter: SignalsDateFilter;
  onFilterChange: (next: SignalsDateFilter) => void;
}

export function DateFilterChips({ filter, onFilterChange }: DateFilterChipsProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => onFilterChange({ ...filter, range: preset.value })}
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
            onChange={(e) => onFilterChange({ ...filter, from: e.target.value })}
            className="h-8 w-auto"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <Input
            type="date"
            value={filter.to}
            onChange={(e) => onFilterChange({ ...filter, to: e.target.value })}
            className="h-8 w-auto"
          />
        </div>
      )}
    </div>
  );
}
