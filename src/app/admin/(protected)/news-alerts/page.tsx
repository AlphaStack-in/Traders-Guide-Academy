import { Newspaper } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getActiveProducts } from "@/lib/products";
import { ContentManager } from "@/components/admin/content-manager";
import type { NewsAlertRow } from "@/components/admin/news-alerts-table";
import type { ProductRow } from "@/components/admin/products-table";

export const dynamic = "force-dynamic";

// Manages both entities the site's home page can show promotional content
// for: the NewsAlert table (plain text market alerts + image "poster"
// entries — live-webinar promos, community announcements) this page
// originally covered, and — as of the Products tab below — the full
// /products catalog (courses, indicators, e-books, PMS, membership plans).
// One admin page, one ContentManager tab switch, two independent
// backends (see src/app/admin/(protected)/news-alerts/actions.ts and its
// sibling product-actions.ts) — see src/components/news/news-alerts-section.tsx
// for how alerts render on the home page, and prisma/seed-posters.ts /
// prisma/seed-products.ts for the initial seed data of each.
export default async function NewsAlertsAdminPage() {
  const [alerts, activeProducts, allProducts] = await Promise.all([
    prisma.newsAlert.findMany({
      orderBy: [{ isBreaking: "desc" }, { publishedAt: "desc" }],
    }),
    getActiveProducts(),
    // Unlike the news-alert "link to product" dropdown below (which only
    // ever offers active products worth promoting), the admin's own
    // Products tab needs to manage inactive/hidden catalog entries too —
    // that's the whole point of the Active toggle in ProductsTable.
    prisma.product.findMany({
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  const rows: NewsAlertRow[] = alerts.map((a) => ({
    id: a.id,
    title: a.title,
    category: a.category,
    summary: a.summary,
    imageUrl: a.imageUrl,
    sourceUrl: a.sourceUrl,
    productSlug: a.productSlug,
    isBreaking: a.isBreaking,
    isActive: a.isActive,
    publishedAt: a.publishedAt.toISOString(),
  }));

  const productOptions = activeProducts.map((p) => ({ slug: p.slug, name: p.name }));

  const productRows: ProductRow[] = allProducts.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category,
    description: p.description,
    longDescription: p.longDescription,
    priceInPaise: p.priceInPaise,
    originalPriceInPaise: p.originalPriceInPaise,
    rating: p.rating,
    ratingCount: p.ratingCount,
    imageUrl: p.imageUrl,
    isFeatured: p.isFeatured,
    isActive: p.isActive,
    accessValidityDays: p.accessValidityDays,
    courseAccessUrl: p.courseAccessUrl,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold sm:text-3xl flex items-center gap-2.5">
          <Newspaper className="h-7 w-7 text-primary" />
          <span>
            News &amp; <span className="signalflow-gold-text">Alerts</span>
          </span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The home page&apos;s News &amp; Market Alerts panel and the full /products catalog both
          live here — pick a tab below. Only <strong>Active</strong> entries show on the site;
          toggle one off instead of deleting it to keep it for later.
        </p>
      </div>

      <ContentManager alerts={rows} products={productRows} productOptions={productOptions} />
    </div>
  );
}
