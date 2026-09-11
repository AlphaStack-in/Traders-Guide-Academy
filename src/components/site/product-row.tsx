"use client";

import { useState, type KeyboardEvent, type MouseEvent } from "react";
import Link from "next/link";
import type { Product } from "@prisma/client";
import { ChevronDown, GraduationCap, LineChart, BookOpen, Briefcase, Crown, Check } from "lucide-react";
import { StarRating } from "@/components/site/star-rating";
import { ProductCheckoutButton } from "@/components/site/product-checkout-button";
import { Button } from "@/components/ui/button";
import { PRODUCT_CATEGORY_LABELS, formatPriceInPaise } from "@/lib/products";
import { cn } from "@/lib/utils";

const CATEGORY_META: Record<
  Product["category"],
  { icon: typeof GraduationCap; colorVar: string }
> = {
  COURSE: { icon: GraduationCap, colorVar: "--signalflow-text-accent-start" },
  INDICATOR: { icon: LineChart, colorVar: "--signalflow-ce" },
  EBOOK: { icon: BookOpen, colorVar: "--signalflow-gold-start" },
  PMS: { icon: Briefcase, colorVar: "--signalflow-gold-start" },
  MEMBERSHIP: { icon: Crown, colorVar: "--signalflow-pe" },
};

/** What-you-get bullets shown in the expanded panel — generic per category
 * since the migrated Graphy data doesn't include structured feature lists.
 * Swap for real per-product bullets once the client supplies them. */
const CATEGORY_FEATURES: Record<Product["category"], string[]> = {
  COURSE: ["Lifetime access to recorded modules", "Practical, example-driven lessons"],
  INDICATOR: ["Installs on your own charting platform", "Ongoing updates included"],
  EBOOK: ["Instant download after enrolling", "Reference material you keep"],
  PMS: [
    "₹30,000 contribution joins a 50-member group (₹15,00,000 pooled capital)",
    "Free 1-year mentorship, premium indicators & study notes",
    "Loss covered by us, plus a minimum 15% return guaranteed in year 1",
  ],
  MEMBERSHIP: ["Priority access and updates", "Direct onboarding after purchase"],
};

/**
 * A single horizontal product row on /products (and the "related products"
 * section on the detail page) — thumbnail, details, price/buy column, with
 * a click-to-expand inline detail panel. Rows are intentionally taller than
 * a typical list item (generous padding) to comfortably fit the bigger
 * thumbnail and two-line description, per the approved mockup.
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
 */
export function ProductRow({
  product,
  isAuthenticated,
}: {
  product: Product;
  isAuthenticated: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const meta = CATEGORY_META[product.category];
  const Icon = meta.icon;
  const iconSize = product.isFeatured ? 54 : 48;
  const titleSize = product.isFeatured ? "text-lg" : "text-base";

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

  return (
    <div
      className={cn(
        "signalflow-glow overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-colors",
        product.isFeatured && "signalflow-gold-border",
      )}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={toggle}
        onKeyDown={handleKeyDown}
        aria-expanded={expanded}
        className="flex w-full cursor-pointer items-center gap-6 px-5 py-8 text-left"
      >
        <div
          className="flex h-[120px] w-[120px] shrink-0 items-center justify-center overflow-hidden rounded-xl"
          style={{
            background: product.imageUrl
              ? undefined
              : `color-mix(in oklab, var(${meta.colorVar}) 16%, transparent)`,
          }}
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
              style={{ color: `var(${meta.colorVar})`, width: iconSize, height: iconSize }}
              strokeWidth={1.5}
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <span
            className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
            style={{
              background: `color-mix(in oklab, var(${meta.colorVar}) 15%, transparent)`,
              color: `var(${meta.colorVar})`,
            }}
          >
            {PRODUCT_CATEGORY_LABELS[product.category]}
          </span>

          <h3 className={cn("font-heading mt-1.5 font-bold text-foreground", titleSize)}>{product.name}</h3>

          {product.rating != null && (
            <StarRating rating={product.rating} count={product.ratingCount} className="mt-1" />
          )}

          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>
        </div>

        <div className="flex w-[140px] shrink-0 flex-col items-stretch gap-2" onClick={stopPropagation}>
          {product.originalPriceInPaise != null && (
            <span className="text-right text-xs text-muted-foreground line-through">
              {formatPriceInPaise(product.originalPriceInPaise)}
            </span>
          )}
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
          className={cn("h-5 w-5 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")}
        />
      </div>

      {expanded && (
        <div className="border-t border-white/10 px-5 py-5">
          <p className="text-sm leading-relaxed text-muted-foreground">{product.longDescription}</p>
          <ul className="mt-3 flex flex-col gap-1.5">
            {CATEGORY_FEATURES[product.category].map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-foreground/90">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--signalflow-win)]" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
