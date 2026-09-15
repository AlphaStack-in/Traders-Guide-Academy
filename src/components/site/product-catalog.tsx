"use client";

import { useMemo, useState } from "react";
import type { Product, ProductCategory } from "@prisma/client";
import { PackageSearch } from "lucide-react";
import { ProductRow } from "@/components/site/product-row";
import { ProductFilters, type ProductFilterState, type PriceBucket } from "@/components/site/product-filters";
import { PRODUCT_CATEGORY_ORDER, PRODUCT_CATEGORY_LABELS, PRODUCT_CATEGORY_ICONS } from "@/lib/products";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type SortOption = "popularity" | "price-asc" | "price-desc" | "rating";

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
}: {
  products: Product[];
  isAuthenticated: boolean;
  telegramUrl?: string;
}) {
  const [filters, setFilters] = useState<ProductFilterState>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortOption>("popularity");

  const counts = useMemo(() => {
    const result = Object.fromEntries(PRODUCT_CATEGORY_ORDER.map((c) => [c, 0])) as Record<
      ProductCategory,
      number
    >;
    for (const p of products) result[p.category] += 1;
    return result;
  }, [products]);

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
  }

  function setSingleType(category: ProductCategory | null) {
    if (category === null) {
      setFilters((f) => ({ ...f, types: new Set() }));
      return;
    }
    setFilters((f) => {
      const alreadyOnlyThis = f.types.size === 1 && f.types.has(category);
      return { ...f, types: alreadyOnlyThis ? new Set() : new Set([category]) };
    });
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <ProductFilters
        counts={counts}
        totalCount={products.length}
        filters={filters}
        onChange={setFilters}
        onReset={resetFilters}
        hasActiveFilters={hasActiveFilters}
        telegramUrl={telegramUrl}
      />

      <div className="min-w-0 flex-1">
        {/* Quick category pill row — a fast single-tap shortcut on top of the
            sidebar's full multi-select controls, mirroring the reference's
            horizontal filter bar. */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSingleType(null)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
              filters.types.size === 0
                ? "bg-primary text-primary-foreground"
                : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground",
            )}
          >
            All Products ({products.length})
          </button>
          {PRODUCT_CATEGORY_ORDER.map((category) => {
            const Icon = PRODUCT_CATEGORY_ICONS[category];
            const active = filters.types.size === 1 && filters.types.has(category);
            return (
              <button
                key={category}
                type="button"
                onClick={() => setSingleType(category)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {PRODUCT_CATEGORY_LABELS[category]} ({counts[category] ?? 0})
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white/[0.02] px-4 py-2.5">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{totalCount}</span> of{" "}
            <span className="font-semibold text-foreground">{products.length}</span> product
            {products.length === 1 ? "" : "s"}
          </p>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">Sort by</span>
            <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
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
