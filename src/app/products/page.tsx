import Link from "next/link";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { ProductCatalog } from "@/components/site/product-catalog";
import { getActiveProducts } from "@/lib/products";
import { getCurrentSubscriber } from "@/lib/subscriber-auth";
import { clientConfig } from "@/lib/client-config";
import { getBuildInfo } from "@/lib/build-info";
import { ShieldCheck, LayoutGrid, Star, Gift, Lock, SlidersHorizontal } from "lucide-react";

export const metadata = {
  title: `Products — ${process.env.NEXT_PUBLIC_SITE_NAME_SHORT ?? "TGA"}`,
};

export default async function ProductsPage() {
  const [products, subscriber] = await Promise.all([getActiveProducts(), getCurrentSubscriber()]);
  const { version } = getBuildInfo();

  // Real, computed stats for the hero strip below — no fabricated figures.
  // Weighted average rating (weighted by each product's own review count,
  // falling back to a weight of 1 for a rated product with no count yet)
  // rather than a flat average, so a handful of 5-star ratings with dozens
  // of reviews behind them count for more than a single unreviewed 5.0.
  const ratedProducts = products.filter((p) => p.rating != null);
  const ratingWeightSum = ratedProducts.reduce((sum, p) => sum + (p.ratingCount ?? 1), 0);
  const avgRating =
    ratedProducts.length > 0
      ? ratedProducts.reduce((sum, p) => sum + (p.rating ?? 0) * (p.ratingCount ?? 1), 0) / ratingWeightSum
      : null;
  const totalReviews = products.reduce((sum, p) => sum + (p.ratingCount ?? 0), 0);
  const freeCount = products.filter((p) => p.priceInPaise === 0).length;
  const categoryCount = new Set(products.map((p) => p.category)).size;

  const statTiles = [
    {
      icon: LayoutGrid,
      value: `${products.length}`,
      label: `Product${products.length === 1 ? "" : "s"} across ${categoryCount} categor${categoryCount === 1 ? "y" : "ies"}`,
    },
    avgRating != null
      ? {
          icon: Star,
          value: avgRating.toFixed(1),
          label: totalReviews > 0 ? `${totalReviews.toLocaleString("en-IN")} verified reviews` : "Average rating",
        }
      : null,
    freeCount > 0
      ? {
          icon: Gift,
          value: `${freeCount}`,
          label: `Free starter resource${freeCount === 1 ? "" : "s"}`,
        }
      : null,
    {
      icon: Lock,
      value: "Secure",
      label: "Checkout via Cashfree",
    },
  ].filter((tile): tile is { icon: typeof LayoutGrid; value: string; label: string } => tile != null);

  return (
    <div className="flex min-h-screen flex-col md:pl-64">
      <Navbar />
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-10 sm:px-6 lg:px-10 xl:px-12">
        <div className="mb-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Link href="/" className="hover:text-primary">
                Home
              </Link>
              <span>/</span>
              <span className="font-medium text-primary">Products</span>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 font-semibold text-[var(--signalflow-win)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--signalflow-win)]" />
              Catalog Live · v{version}
            </span>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold tracking-wide text-primary uppercase">
            <ShieldCheck className="h-3.5 w-3.5" />
            High-Consequence Trading Architecture
          </span>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="font-heading text-3xl font-bold sm:text-4xl">
                <span className="signalflow-gold-text">Master the Markets with Professional Edge</span>
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Institutional-grade PineScript indicators, battle-tested options masterclasses, automated
                signal suites, and private desk mentorship — forged for quantitative execution.
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Courses, indicators, e-books, our PMS and membership plans from {clientConfig.siteName} — all
                in one place.
              </p>
            </div>
            <a
              href="#quick-filter"
              className="signalflow-glow inline-flex shrink-0 items-center gap-2 self-start rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 lg:self-auto"
            >
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              Advanced Facets
            </a>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1 sm:grid-cols-4">
            {statTiles.map(({ icon: Icon, value, label }) => (
              <div
                key={label}
                className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.03] p-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-heading text-base font-bold text-foreground">{value}</div>
                  <div className="truncate text-xs text-muted-foreground">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div id="quick-filter">
          <ProductCatalog
            products={products}
            isAuthenticated={Boolean(subscriber)}
            telegramUrl={clientConfig.telegramUrl || undefined}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
