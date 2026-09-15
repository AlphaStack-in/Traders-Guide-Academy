"use client";

import type { ProductCategory } from "@prisma/client";
import { Filter, RotateCcw, Headset, Star, LayoutGrid } from "lucide-react";
import {
  PRODUCT_CATEGORY_LABELS,
  PRODUCT_CATEGORY_ORDER,
  PRODUCT_CATEGORY_ICONS,
  PRODUCT_CATEGORY_COLOR_VAR,
} from "@/lib/products";
import { cn } from "@/lib/utils";

export type PriceBucket = "all" | "free" | "under-5000" | "5000-20000" | "20000-plus";

export interface ProductFilterState {
  types: Set<ProductCategory>;
  priceBucket: PriceBucket;
  minRating: 0 | 4 | 5;
}

const PRICE_CHIPS: { value: PriceBucket; label: string; tier: string }[] = [
  { value: "all", label: "All prices", tier: "" },
  { value: "free", label: "Free", tier: "" },
  { value: "under-5000", label: "Under ₹5,000", tier: "₹" },
  { value: "5000-20000", label: "₹5,000 – ₹20,000", tier: "₹₹" },
  { value: "20000-plus", label: "₹20,000 & above", tier: "₹₹₹" },
];

const RATING_CHIPS: { value: 0 | 4 | 5; label: string }[] = [
  { value: 0, label: "All ratings" },
  { value: 4, label: "4★ & up" },
  { value: 5, label: "5★ only" },
];

/**
 * Left sidebar filter panel — restyled after the "Apex Quant Dark"
 * institutional-marketplace reference (glass panel, icon+count category
 * rows, pill-style price/rating chips, a help CTA) while keeping this
 * site's existing brand tokens and the original filter model: Type stays
 * multi-select (a Set), Price and Rating stay single-select. State lives in
 * the parent (product-catalog.tsx) and is applied client-side against the
 * already-fetched product list, rather than round-tripping through the URL
 * query string — a deliberate simplification of the original spec (which
 * called for shareable/bookmarkable filter URLs); revisit if that turns out
 * to matter in practice.
 */
export function ProductFilters({
  counts,
  totalCount,
  filters,
  onChange,
  onReset,
  hasActiveFilters,
  telegramUrl,
}: {
  counts: Record<ProductCategory, number>;
  /** Total product count across all categories — shown on the "All Types" row. */
  totalCount: number;
  filters: ProductFilterState;
  onChange: (next: ProductFilterState) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
  /** Real, working chat link for "need help choosing" — omit to hide that panel. */
  telegramUrl?: string;
}) {
  function toggleType(category: ProductCategory) {
    const next = new Set(filters.types);
    if (next.has(category)) next.delete(category);
    else next.add(category);
    onChange({ ...filters, types: next });
  }

  return (
    <aside className="flex w-full shrink-0 flex-col gap-4 lg:sticky lg:top-20 lg:max-w-[280px]">
      <div className="signalflow-glass space-y-5 rounded-2xl p-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <span className="font-heading text-sm font-semibold text-foreground">Filters</span>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
          )}
        </div>

        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Product Class</h3>
          <button
            type="button"
            onClick={() => onChange({ ...filters, types: new Set() })}
            className={cn(
              "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
              filters.types.size === 0
                ? "bg-primary/10 text-primary"
                : "text-foreground/90 hover:bg-white/5",
            )}
          >
            <span className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              All Types
            </span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-muted-foreground">
              {totalCount}
            </span>
          </button>
          {PRODUCT_CATEGORY_ORDER.map((category) => {
            const Icon = PRODUCT_CATEGORY_ICONS[category];
            const colorVar = PRODUCT_CATEGORY_COLOR_VAR[category];
            const active = filters.types.has(category);
            return (
              <button
                key={category}
                type="button"
                onClick={() => toggleType(category)}
                aria-pressed={active}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                  active ? "bg-white/[0.06]" : "hover:bg-white/5",
                )}
              >
                <span className="flex items-center gap-2 text-foreground/90">
                  <Icon className="h-4 w-4" style={{ color: `var(${colorVar})` }} />
                  {PRODUCT_CATEGORY_LABELS[category]}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs",
                    active ? "text-white" : "bg-white/10 text-muted-foreground",
                  )}
                  style={active ? { background: `color-mix(in oklab, var(${colorVar}) 55%, transparent)` } : undefined}
                >
                  {counts[category] ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        <div className="space-y-1.5 border-t border-white/10 pt-4">
          <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Valuation Range</h3>
          <div className="flex flex-col gap-1.5">
            {PRICE_CHIPS.map((chip) => (
              <button
                key={chip.value}
                type="button"
                onClick={() => onChange({ ...filters, priceBucket: chip.value })}
                aria-pressed={filters.priceBucket === chip.value}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors",
                  filters.priceBucket === chip.value
                    ? "border-primary/50 bg-primary/15 text-primary"
                    : "border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground",
                )}
              >
                <span>{chip.label}</span>
                {chip.tier && <span className="text-[10px] tracking-wide opacity-70">{chip.tier}</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5 border-t border-white/10 pt-4">
          <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Quality &amp; Rating</h3>
          <div className="flex flex-col gap-1.5">
            {RATING_CHIPS.map((chip) => (
              <button
                key={chip.value}
                type="button"
                onClick={() => onChange({ ...filters, minRating: chip.value })}
                aria-pressed={filters.minRating === chip.value}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors",
                  filters.minRating === chip.value
                    ? "border-primary/50 bg-primary/15 text-primary"
                    : "border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground",
                )}
              >
                {chip.value > 0 && (
                  <span className="flex items-center gap-0.5 text-[var(--signalflow-gold-start)]">
                    {Array.from({ length: chip.value }).map((_, i) => (
                      <Star key={i} className="h-3 w-3" fill="currentColor" strokeWidth={0} />
                    ))}
                  </span>
                )}
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {telegramUrl && (
        <div className="space-y-1.5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-primary">
            <Headset className="h-4 w-4" /> Desk Guidance
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Not sure which course, indicator or plan fits your trading style? Chat directly with our team on
            Telegram.
          </p>
          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            Chat with Trading Desk →
          </a>
        </div>
      )}
    </aside>
  );
}
