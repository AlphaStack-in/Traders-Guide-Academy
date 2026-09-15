"use client";

import { useMemo, useState } from "react";
import type { Product, ProductCategory } from "@prisma/client";
import { PackageSearch } from "lucide-react";
import { ProductRow } from "@/components/site/product-row";
import { ProductFilters, type ProductFilterState, type PriceBucket } from "@/components/site/product-filters";
import { PRODUCT_CATEGORY_ORDER } from "@/lib/products";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type SortOption = "popularity" | "price-asc" | "price-desc" | "rating";

/** The five quick-filter shortcuts shown as pills above the results — real
 * filter/sort presets (not decorative), matching the reference mockup's
 * quick-filter bar labels ("All Products", "Best Selling", "Free Starter
 * Kits", "Highly Rated", "Elite Inner Circle"). Tracked as its own bit of
 * state (rather than derived from filters/sort) so exactly one pill can be
 * highlighted at a time and it cleanly clears whenever the sidebar or sort
 * dropdown is used directly instead. */
type QuickPreset = "all" | "best-selling" | "free" | "highly-rated" | "elite";

const DEFAULT_FILTERS: ProductFilterState = {
  types: new Set(),
  priceBucket: "all",
  minRating: 0,
};

function matchesPriceBucket(priceInPaise: number, bucket: PriceBucket): boolean {
  const rupees = priceInPaise / 100;
  switch (bucket) {
    case "all":
      return true;
    case "free":
      return rupees === 0;
    case "under-5000":
      return rupees > 0 && rupees < 5000;
    case "5000-20000":
      return rupees >= 5000 && rupees <= 20000;
    case "20000-plus":
      return rupees > 20000;
  }
}

/**
 * Client-side orchestrator for /products: holds filter/sort state, derives
 * the visible product list from the full (already server-fetched) catalog,
 * and renders the sidebar + quick-filter pill bar + results bar + featured
 * band + row list. Visual language modeled on the "Apex Quant Dark"
 * institutional-marketplace reference the user supplied, adapted to this
 * site's own product data and brand tokens.
 */
export function ProductCatalog({
  products,
  isAuthenticated,
  telegramUrl,
  liveVersionLabel,
}: {
  products: Product[];
  isAuthenticated: boolean;
  telegramUrl?: string;
  /** Real deployed build version (e.g. "v1.0.70") for the "catalog live" status
   * pill next to the results count — never a fabricated version/feed number. */
  liveVersionLabel?: string;
}) {
  const [filters, setFilters] = useState<ProductFilterState>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortOption>("popularity");
  const [activePreset, setActivePreset] = useState<QuickPreset>("all");

  const counts = useMemo(() => {
    const result = Object.fromEntries(PRODUCT_CATEGORY_ORDER.map((c) => [c, 0])) as Record<
      ProductCategory,
      number
    >;
    for (const p of products) result[p.category] += 1;
    return result;
  }, [products]);

  const freeCount = useMemo(() => products.filter((p) => p.priceInPaise === 0).length, [products]);

  const featured = products.find((p) => p.isFeatured);

  const visible = useMemo(() => {
    let list = products.filter((p) => !p.isFeatured);

    if (filters.types.size > 0) {
      list = list.filter((p) => filters.types.has(p.category));
    }
    list = list.filter((p) => matchesPriceBucket(p.priceInPaise, filters.priceBucket));
    if (filters.minRating > 0) {
      list = list.filter((p) => (p.rating ?? 0) >= filters.minRating);
    }

    const sorted = [...list];
    switch (sort) {
      case "price-asc":
        sorted.sort((a, b) => a.priceInPaise - b.priceInPaise);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.priceInPaise - a.priceInPaise);
        break;
      case "rating":
        sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      case "popularity":
      default:
        sorted.sort((a, b) => (b.ratingCount ?? 0) - (a.ratingCount ?? 0));
        break;
    }
    return sorted;
  }, [products, filters, sort]);

  // Featured band only shows when it also matches the active filters — a
  // filtered-out featured product disappearing entirely (rather than
  // ignoring the filter) keeps the results count honest.
  const showFeatured =
    featured &&
    (filters.types.size === 0 || filters.types.has(featured.category)) &&
    matchesPriceBucket(featured.priceInPaise, filters.priceBucket) &&
    (filters.minRating === 0 || (featured.rating ?? 0) >= filters.minRating);

  const totalCount = visible.length + (showFeatured ? 1 : 0);

  const hasActiveFilters =
    filters.types.size > 0 || filters.priceBucket !== "all" || filters.minRating !== 0;

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
    setSort("popularity");
    setActivePreset("all");
  }

  /** Sidebar edits are a direct, deliberate action — clear whichever quick
   * preset pill was highlighted so the UI never shows a pill "active" that
   * no longer matches the real filter state. */
  function updateFilters(next: ProductFilterState) {
    setFilters(next);
    setActivePreset("all");
  }

  function updateSort(next: SortOption) {
    setSort(next);
    setActivePreset("all");
  }

  function applyPreset(key: QuickPreset) {
    setActivePreset(key);
    switch (key) {
      case "all":
        setFilters(DEFAULT_FILTERS);
        setSort("popularity");
        break;
      case "best-selling":
        setFilters(DEFAULT_FILTERS);
        setSort("popularity");
        break;
      case "free":
        setFilters({ ...DEFAULT_FILTERS, priceBucket: "free" });
        setSort("popularity");
        break;
      case "highly-rated":
        setFilters({ ...DEFAULT_FILTERS, minRating: 5 });
        setSort("rating");
        break;
      case "elite":
        setFilters({ ...DEFAULT_FILTERS, types: new Set<ProductCategory>(["MEMBERSHIP"]) });
        setSort("popularity");
        break;
    }
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
      <ProductFilters
        counts={counts}
        totalCount={products.length}
        filters={filters}
        onChange={updateFilters}
        onReset={resetFilters}
        hasActiveFilters={hasActiveFilters}
        telegramUrl={telegramUrl}
      />

      <div className="min-w-0 flex-1">
        {/* Quick preset pill row — real filter/sort shortcuts (not decorative
            category tabs), matching the reference mockup's horizontal
            quick-filter bar: All Products / Best Selling / Free Starter Kits /
            Highly Rated / Elite Inner Circle. */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => applyPreset("all")}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
              activePreset === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground",
            )}
          >
            All Products ({products.length})
          </button>
          <button
            type="button"
            onClick={() => applyPreset("best-selling")}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
              activePreset === "best-selling"
                ? "bg-primary text-primary-foreground"
                : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground",
            )}
          >
            <span className="text-[var(--signalflow-gold-start)]">⚡</span> Best Selling
          </button>
          {freeCount > 0 && (
            <button
              type="button"
              onClick={() => applyPreset("free")}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                activePreset === "free"
                  ? "bg-primary text-primary-foreground"
                  : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground",
              )}
            >
              <span>📘</span> Free Starter Kits ({freeCount})
            </button>
          )}
          <button
            type="button"
            onClick={() => applyPreset("highly-rated")}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
              activePreset === "highly-rated"
                ? "bg-primary text-primary-foreground"
                : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground",
            )}
          >
            <span>📈</span> Highly Rated
          </button>
          {(counts.MEMBERSHIP ?? 0) > 0 && (
            <button
              type="button"
              onClick={() => applyPreset("elite")}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                activePreset === "elite"
                  ? "bg-primary text-primary-foreground"
                  : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground",
              )}
            >
              <span>💎</span> Elite Inner Circle
            </button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white/[0.02] px-4 py-2.5">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{totalCount}</span> of{" "}
              <span className="font-semibold text-foreground">{products.length}</span> product
              {products.length === 1 ? "" : "s"}
            </p>
            {liveVersionLabel && (
              <span className="hidden items-center gap-1.5 text-xs font-semibold text-[var(--signalflow-win)] sm:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--signalflow-win)]" />
                Catalog live · {liveVersionLabel}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">Sort by</span>
            <Select value={sort} onValueChange={(v) => updateSort(v as SortOption)}>
              <SelectTrigger className="h-8 w-[170px] border-white/10 bg-white/[0.03] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-[#12131a]">
                <SelectItem value="popularity">Popularity</SelectItem>
                <SelectItem value="price-asc">Price: low to high</SelectItem>
                <SelectItem value="price-desc">Price: high to low</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-4">
          {showFeatured && featured && (
            <ProductRow product={featured} isAuthenticated={isAuthenticated} />
          )}
          {visible.map((product) => (
            <ProductRow key={product.id} product={product} isAuthenticated={isAuthenticated} />
          ))}
          {totalCount === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-10 text-center">
              <PackageSearch className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No products match these filters.</p>
              <button
                type="button"
                onClick={resetFilters}
                className="text-sm font-semibold text-primary hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
