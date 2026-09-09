"use client";

import { useMemo, useState } from "react";
import type { Product, ProductCategory } from "@prisma/client";
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

type SortOption = "popularity" | "price-asc" | "price-desc" | "rating";

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
 * and renders the sidebar + results bar + featured band + row list — the
 * two-column "bus booking site" layout from the approved mockup.
 */
export function ProductCatalog({
  products,
  isAuthenticated,
}: {
  products: Product[];
  isAuthenticated: boolean;
}) {
  const [filters, setFilters] = useState<ProductFilterState>({
    types: new Set(),
    priceBucket: "all",
    minRating: 0,
  });
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

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <ProductFilters counts={counts} filters={filters} onChange={setFilters} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {totalCount} product{totalCount === 1 ? "" : "s"} found
          </p>
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

        <div className="mt-4 flex flex-col gap-4">
          {showFeatured && featured && (
            <ProductRow product={featured} isAuthenticated={isAuthenticated} />
          )}
          {visible.map((product) => (
            <ProductRow key={product.id} product={product} isAuthenticated={isAuthenticated} />
          ))}
          {totalCount === 0 && (
            <p className="rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center text-sm text-muted-foreground">
              No products match these filters.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
