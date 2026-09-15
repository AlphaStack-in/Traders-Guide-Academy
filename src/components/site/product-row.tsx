"use client";

import { useState, type KeyboardEvent, type MouseEvent } from "react";
import Link from "next/link";
import type { Product } from "@prisma/client";
import { ChevronDown, Check, Sparkles } from "lucide-react";
import { StarRating } from "@/components/site/star-rating";
import { ProductCheckoutButton } from "@/components/site/product-checkout-button";
import { Button } from "@/components/ui/button";
import {
  PRODUCT_CATEGORY_LABELS,
  PRODUCT_CATEGORY_ICONS,
  PRODUCT_CATEGORY_COLOR_VAR,
  PRODUCT_CATEGORY_FEATURES,
  formatPriceInPaise,
  computeSavingsPercent,
} from "@/lib/products";
import { cn } from "@/lib/utils";

// Thumbnail side length (px) in the collapsed row vs. the expanded detail
// panel — the expanded view nearly doubles it (120 → 220) since there's a
// full row of width to spend on it once the panel opens, and a bigger
// image reads much better next to the full longDescription copy than the
// list-row-sized crop does. The bare icon fallback (no product.imageUrl)
// scales its stroke size to match at each size.
const COLLAPSED_THUMB_PX = 120;
const EXPANDED_THUMB_PX = 220;

/**
 * A single horizontal product row on /products (and the "related products"
 * section on the detail page) — thumbnail, details, price/buy column, with
 * a click-to-expand inline detail panel. Rows are intentionally taller than
 * a typical list item (generous padding) to comfortably fit the bigger
 * thumbnail and two-line description, per the approved mockup.
 *
 * Visual language (badges, category tinting, glass card, expand drawer) is
 * modeled on the "Apex Quant Dark" institutional-marketplace reference the
 * user supplied — adapted to this site's existing teal/gold brand tokens
 * (see globals.css) rather than introducing a new palette, and to the real
 * Product fields in prisma/schema.prisma (no fabricated stats like fake
 * durations or lesson counts that aren't in the data model).
 *
 * The row itself is a div (role="button"), not a real <button> — the price
 * button and "View Details" button inside it are real interactive elements,
 * and nesting a button/link inside a button is invalid HTML. Both stop
 * propagation so clicking them doesn't also toggle the row, per the
 * approved spec.
 *
 * Each row manages its own expand/collapse state independently (a
 * simplification vs. the mockup's single-shared-expanded-row behavior) —
 * simpler to reason about and still satisfies "click a row to see more
 * detail" without one row's state depending on another's.
 *
 * The expanded panel repeats the thumbnail at a larger size
 * (EXPANDED_THUMB_PX) alongside the long description and a "What's
 * included" feature grid — an image-beside-text layout (row on sm+, stacked
 * on mobile) rather than the earlier text-only expansion, so the reader
 * gets a genuinely bigger, more legible picture of the product instead of
 * just more paragraphs.
 */
export function ProductRow({
  product,
  isAuthenticated,
}: {
  product: Product;
  isAuthenticated: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const Icon = PRODUCT_CATEGORY_ICONS[product.category];
  const colorVar = PRODUCT_CATEGORY_COLOR_VAR[product.category];
  const iconSize = product.isFeatured ? 54 : 48;
  const expandedIconSize = product.isFeatured ? 96 : 88;
  const titleSize = product.isFeatured ? "text-lg" : "text-base";
  const isFree = product.priceInPaise === 0;
  const savingsPercent = computeSavingsPercent(product.originalPriceInPaise, product.priceInPaise);

  function toggle() {
    setExpanded((v) => !v);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  }

  function stopPropagation(e: MouseEvent) {
    e.stopPropagation();
  }

  const thumbBackground = product.imageUrl
    ? undefined
    : `color-mix(in oklab, var(${colorVar}) 16%, transparent)`;

  return (
    <div
      className={cn(
        "signalflow-glow relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-colors",
        product.isFeatured ? "signalflow-gold-border" : "hover:border-white/20",
      )}
    >
      {/* Rim accent for the featured/highlighted listing — mirrors the
          reference's "golden rim" flourish, using the brand teal→gold
          gradient tokens already defined for this site. */}
      {product.isFeatured && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[2px]"
          style={{
            background:
              "linear-gradient(90deg, var(--signalflow-text-accent-start), var(--signalflow-gold-start), transparent)",
          }}
        />
      )}

      <div
        role="button"
        tabIndex={0}
        onClick={toggle}
        onKeyDown={handleKeyDown}
        aria-expanded={expanded}
        className="flex w-full cursor-pointer flex-col items-stretch gap-4 px-5 py-6 text-left sm:flex-row sm:items-center sm:gap-6 sm:py-8"
      >
        <div
          className="relative flex shrink-0 items-center justify-center self-start overflow-hidden rounded-xl"
          style={{ background: thumbBackground, height: COLLAPSED_THUMB_PX, width: COLLAPSED_THUMB_PX }}
        >
          {product.imageUrl ? (
            // Plain <img>, not next/image — a poster's imageUrl backfilled
            // here (see News & Alerts admin actions) can be a base64 data:
            // URL, which next/image's optimizer can't process.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <Icon
              style={{ color: `var(${colorVar})`, width: iconSize, height: iconSize }}
              strokeWidth={1.5}
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide"
              style={{
                background: `color-mix(in oklab, var(${colorVar}) 15%, transparent)`,
                color: `var(${colorVar})`,
              }}
            >
              <Icon className="h-3 w-3" />
              {PRODUCT_CATEGORY_LABELS[product.category]}
            </span>
            {product.isFeatured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[color-mix(in_oklab,var(--signalflow-gold-start)_18%,transparent)] px-2 py-0.5 text-xs font-semibold text-[var(--signalflow-gold-start)]">
                <Sparkles className="h-3 w-3" /> Featured
              </span>
            )}
          </div>

          <h3 className={cn("font-heading mt-1.5 font-bold text-foreground", titleSize)}>{product.name}</h3>

          {product.rating != null && (
            <StarRating rating={product.rating} count={product.ratingCount} className="mt-1" />
          )}

          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>
        </div>

        <div
          className="flex w-full shrink-0 flex-col items-stretch gap-2 border-t border-white/10 pt-3 sm:w-[150px] sm:border-t-0 sm:pt-0"
          onClick={stopPropagation}
        >
          <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-end sm:gap-0.5">
            {product.originalPriceInPaise != null && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground line-through">
                  {formatPriceInPaise(product.originalPriceInPaise)}
                </span>
                {savingsPercent != null && (
                  <span className="rounded bg-[var(--signalflow-gold-start)]/15 px-1.5 py-0.5 text-[10px] font-bold text-[var(--signalflow-gold-start)]">
                    SAVE {savingsPercent}%
                  </span>
                )}
              </div>
            )}
            {isFree && (
              <span className="text-xs font-semibold text-[var(--signalflow-win)]">100% Free</span>
            )}
          </div>
          <ProductCheckoutButton
            productId={product.id}
            priceInPaise={product.priceInPaise}
            isAuthenticated={isAuthenticated}
            className="w-full"
            style={{ fontSize: product.isFeatured ? "18px" : "16px", fontWeight: 700 }}
          />
          <Button
            asChild
            variant="outline"
            size="sm"
            className="signalflow-glow w-full border-white/10 bg-white/[0.03] text-xs font-semibold"
          >
            <Link href={`/products/${product.slug}`}>View Details</Link>
          </Button>
        </div>

        <ChevronDown
          className={cn(
            "hidden h-5 w-5 shrink-0 self-center text-muted-foreground transition-transform sm:block",
            expanded && "rotate-180",
          )}
        />
      </div>

      {expanded && (
        <div className="border-t border-white/10 bg-black/20 px-5 py-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
            <div
              className="mx-auto flex shrink-0 items-center justify-center overflow-hidden rounded-xl sm:mx-0"
              style={{ background: thumbBackground, height: EXPANDED_THUMB_PX, width: EXPANDED_THUMB_PX }}
            >
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Icon
                  style={{ color: `var(${colorVar})`, width: expandedIconSize, height: expandedIconSize }}
                  strokeWidth={1.5}
                />
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-4">
              <p className="text-sm leading-relaxed text-muted-foreground">{product.longDescription}</p>

              <div>
                <span
                  className="mb-2 block text-xs font-semibold tracking-wider uppercase"
                  style={{ color: `var(${colorVar})` }}
                >
                  What&apos;s Included
                </span>
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {PRODUCT_CATEGORY_FEATURES[product.category].map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/[0.02] p-2.5 text-sm text-foreground/90"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--signalflow-win)]" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex w-full items-center gap-2 sm:w-auto" onClick={stopPropagation}>
                  <ProductCheckoutButton
                    productId={product.id}
                    priceInPaise={product.priceInPaise}
                    isAuthenticated={isAuthenticated}
                    className="flex-1 sm:w-48 sm:flex-initial"
                    style={{ fontSize: "16px", fontWeight: 700 }}
                  />
                  <Button asChild variant="outline" size="sm" className="border-white/10 bg-white/[0.03] text-xs font-semibold">
                    <Link href={`/products/${product.slug}`}>Full details</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
