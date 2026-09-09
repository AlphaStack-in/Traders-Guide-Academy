"use client";

import type { ProductCategory } from "@prisma/client";
import { Checkbox } from "@/components/ui/checkbox";
import { PRODUCT_CATEGORY_LABELS, PRODUCT_CATEGORY_ORDER } from "@/lib/products";
import { cn } from "@/lib/utils";

export type PriceBucket = "all" | "free" | "under-5000" | "5000-20000" | "20000-plus";

export interface ProductFilterState {
  types: Set<ProductCategory>;
  priceBucket: PriceBucket;
  minRating: 0 | 4 | 5;
}

const PRICE_CHIPS: { value: PriceBucket; label: string }[] = [
  { value: "all", label: "All prices" },
  { value: "free", label: "Free" },
  { value: "under-5000", label: "Under ₹5,000" },
  { value: "5000-20000", label: "₹5,000 – ₹20,000" },
  { value: "20000-plus", label: "₹20,000 & above" },
];

/**
 * Left sidebar filter panel — bus-booking-site pattern (Type / Price /
 * Rating), sticky alongside the product row list. Filter state lives in
 * the parent (product-catalog.tsx) and is applied client-side against the
 * already-fetched product list, rather than round-tripping through the
 * URL query string — a deliberate simplification of the original spec
 * (which called for shareable/bookmarkable filter URLs); revisit if that
 * turns out to matter in practice.
 */
export function ProductFilters({
  counts,
  filters,
  onChange,
}: {
  counts: Record<ProductCategory, number>;
  filters: ProductFilterState;
  onChange: (next: ProductFilterState) => void;
}) {
  function toggleType(category: ProductCategory) {
    const next = new Set(filters.types);
    if (next.has(category)) next.delete(category);
    else next.add(category);
    onChange({ ...filters, types: next });
  }

  return (
    <aside className="sticky top-20 flex w-full max-w-[240px] shrink-0 flex-col gap-6">
      <div>
        <h3 className="font-heading text-sm font-semibold text-foreground">Type</h3>
        <div className="mt-2 flex flex-col gap-2">
          {PRODUCT_CATEGORY_ORDER.map((category) => (
            <label key={category} className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2">
                <Checkbox
                  checked={filters.types.has(category)}
                  onCheckedChange={() => toggleType(category)}
                />
                <span className="text-foreground/90">{PRODUCT_CATEGORY_LABELS[category]}</span>
              </span>
              <span className="text-xs text-muted-foreground">{counts[category] ?? 0}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-heading text-sm font-semibold text-foreground">Price</h3>
        <div className="mt-2 flex flex-col gap-1.5">
          {PRICE_CHIPS.map((chip) => (
            <button
              key={chip.value}
              type="button"
              onClick={() => onChange({ ...filters, priceBucket: chip.value })}
              className={cn(
                "rounded-full border px-3 py-1.5 text-left text-xs font-medium transition-colors",
                filters.priceBucket === chip.value
                  ? "border-primary/50 bg-primary/15 text-primary"
                  : "border-white/10 text-muted-foreground hover:border-white/20",
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-heading text-sm font-semibold text-foreground">Rating</h3>
        <div className="mt-2 flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={filters.minRating === 4}
              onCheckedChange={(checked) => onChange({ ...filters, minRating: checked ? 4 : 0 })}
            />
            <span className="text-foreground/90">4★ &amp; up</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={filters.minRating === 5}
              onCheckedChange={(checked) => onChange({ ...filters, minRating: checked ? 5 : 0 })}
            />
            <span className="text-foreground/90">5★ only</span>
          </label>
        </div>
      </div>
    </aside>
  );
}
