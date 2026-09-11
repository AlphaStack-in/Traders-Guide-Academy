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

// w-[520px] card + mr-4 (16px) — ~3x the original 172px thumbnail so poster
// art (and the fallback icon box) reads clearly at a glance mid-scroll.
const CARD_WIDTH_PX = 536;

// Testimonials scrolls its ~4032px half-width (6 cards x 336px, doubled to
// clear the 3200px MIN_HALF_WIDTH_PX floor — see src/lib/marquee.ts) over
// 56s, i.e. ~72px/s. This catalog is wider (more, bigger cards), so matching
// that fixed 56s duration would visibly scroll faster — matching *speed*
// instead means deriving the duration from this track's own half-width, so
// it keeps pace with Testimonials regardless of how many products there are.
const REFERENCE_SPEED_PX_PER_SEC = 72;

/**
 * Home-page companion to NewsAlertsSection, restyled to match Testimonials'
 * bare marquee treatment — no surrounding card/box, full-bleed edge-to-edge
 * track with only a mask-fade at the seams (see the section wrapper below,
 * and Testimonials for the same pattern) — auto-scrolling via the same
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
 * Market Alerts panel above it on the home page. Rendered bare (no wrapping
 * <section> with a max-width) directly in src/app/page.tsx, same as
 * <Testimonials /> — this component owns its own full-width <section>.
 */
export function ProductsScrollSection({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  const repeated = repeatForMarquee(products, CARD_WIDTH_PX);
  const items = [...repeated, ...repeated];
  const halfWidthPx = repeated.length * CARD_WIDTH_PX;
  const durationSeconds = Math.round(halfWidthPx / REFERENCE_SPEED_PX_PER_SEC);

  return (
    <section className="py-16">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-primary/10 p-2 text-primary">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-heading text-2xl font-bold sm:text-3xl">
              <span className="signalflow-gold-text">Explore Our Products</span>
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
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
        className="relative mt-10 overflow-hidden"
        style={{
          maskImage: "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
        }}
      >
        <div
          className="signalflow-marquee-track flex w-max"
          style={{ ["--signalflow-marquee-duration" as string]: `${durationSeconds}s` }}
        >
          {items.map((product, i) => {
            const meta = CATEGORY_META[product.category];
            const Icon = meta.icon;
            return (
              <Link
                key={`${product.id}-${i}`}
                href={`/products/${product.slug}`}
                className="signalflow-glass signalflow-glow mr-4 flex w-[520px] shrink-0 flex-col gap-3 rounded-2xl border border-white/5 p-4 text-left transition-colors hover:border-white/20"
              >
                {product.imageUrl ? (
                  <div className="h-72 w-full overflow-hidden rounded-xl bg-black/20">
                    {/* eslint-disable-next-line @next/next/no-img-element -- imageUrl can be a base64 data: URL, which next/image can't optimize. */}
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className="flex h-72 w-full items-center justify-center rounded-xl"
                    style={{ background: `color-mix(in oklab, var(${meta.colorVar}) 16%, transparent)` }}
                  >
                    <Icon
                      style={{ color: `var(${meta.colorVar})`, width: 84, height: 84 }}
                      strokeWidth={1.25}
                    />
                  </div>
                )}

                <span
                  className="w-fit rounded-full px-2.5 py-1 text-xs font-medium"
                  style={{
                    background: `color-mix(in oklab, var(${meta.colorVar}) 15%, transparent)`,
                    color: `var(${meta.colorVar})`,
                  }}
                >
                  {PRODUCT_CATEGORY_LABELS[product.category]}
                </span>

                <h3 className="line-clamp-2 text-lg font-semibold leading-snug text-foreground">
                  {product.name}
                </h3>

                <span className="text-lg font-bold text-foreground">
                  {formatPriceInPaise(product.priceInPaise)}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
