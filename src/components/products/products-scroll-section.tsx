import Link from "next/link";
import type { Product } from "@prisma/client";
import { ShoppingBag, GraduationCap, LineChart, BookOpen, Briefcase, Crown } from "lucide-react";
import { clientConfig } from "@/lib/client-config";
import { repeatForMarquee } from "@/lib/marquee";
import { PRODUCT_CATEGORY_LABELS, formatPriceInPaise } from "@/lib/products";

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

// w-[172px] card + mr-3 (12px) — see repeatForMarquee in @/lib/marquee.
const CARD_WIDTH_PX = 184;

/**
 * Home-page companion to NewsAlertsSection (same panel chrome — rounded
 * glass card, gold-text heading, icon chip) but an auto-scrolling marquee
 * strip of product thumbnails instead of an expandable list — same
 * repeatForMarquee + signalflow-marquee-track pattern as Testimonials and
 * IndexTicker (see src/lib/marquee.ts and .signalflow-marquee-track in
 * globals.css: linear infinite scroll, -50% loop, pauses on hover).
 * Deliberately NOT the click-to-expand pattern product-row.tsx uses on the
 * /products catalog page itself — every thumbnail here is a plain Link
 * straight to its /products/[slug] detail page, so there's no client-side
 * state at all and this can stay a server component.
 *
 * Thumbnails use the product's own imageUrl (a real poster, e.g. backfilled
 * from prisma/seed-posters.ts) when set, falling back to the category-icon
 * box otherwise — same imageUrl convention as NewsAlertsSection: a
 * same-origin /public path or a base64 data: URL, rendered via a plain
 * <img> rather than next/image since a data: URL breaks its optimizer.
 *
 * Gated by AppSettings.productsScrollEnabled (src/lib/app-settings.ts),
 * toggled from the admin Settings page — same on/off pattern as the News &
 * Market Alerts panel above it on the home page.
 */
export function ProductsScrollSection({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  const repeated = repeatForMarquee(products, CARD_WIDTH_PX);
  const items = [...repeated, ...repeated];

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#0d0e14]/90 p-5 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-primary/10 p-2 text-primary">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-heading text-base font-bold tracking-wide text-foreground">
              <span className="signalflow-gold-text">Explore Our Products</span>
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Courses, indicators, PMS &amp; membership plans from {clientConfig.siteName}
            </p>
          </div>
        </div>
        <Link
          href="/products"
          className="shrink-0 text-xs font-medium text-primary underline underline-offset-2"
        >
          View all
        </Link>
      </div>

      <div
        className="relative overflow-hidden"
        style={{
          maskImage: "linear-gradient(90deg, transparent, black 4%, black 96%, transparent)",
        }}
      >
        <div
          className="signalflow-marquee-track flex w-max"
          style={{ ["--signalflow-marquee-duration" as string]: "40s" }}
        >
          {items.map((product, i) => {
            const meta = CATEGORY_META[product.category];
            const Icon = meta.icon;
            return (
              <Link
                key={`${product.id}-${i}`}
                href={`/products/${product.slug}`}
                className="signalflow-glow mr-3 flex w-[172px] shrink-0 flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 transition-colors hover:border-white/20"
              >
                {product.imageUrl ? (
                  <div className="h-24 w-full overflow-hidden rounded-lg bg-black/20">
                    {/* eslint-disable-next-line @next/next/no-img-element -- imageUrl can be a base64 data: URL, which next/image can't optimize. */}
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className="flex h-24 w-full items-center justify-center rounded-lg"
                    style={{ background: `color-mix(in oklab, var(${meta.colorVar}) 16%, transparent)` }}
                  >
                    <Icon
                      style={{ color: `var(${meta.colorVar})`, width: 30, height: 30 }}
                      strokeWidth={1.5}
                    />
                  </div>
                )}

                <span
                  className="w-fit rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                  style={{
                    background: `color-mix(in oklab, var(${meta.colorVar}) 15%, transparent)`,
                    color: `var(${meta.colorVar})`,
                  }}
                >
                  {PRODUCT_CATEGORY_LABELS[product.category]}
                </span>

                <h4 className="line-clamp-2 text-xs font-semibold leading-snug text-foreground">
                  {product.name}
                </h4>

                <span className="text-xs font-bold text-foreground">
                  {formatPriceInPaise(product.priceInPaise)}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
