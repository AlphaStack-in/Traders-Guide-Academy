import { Newspaper } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getActiveProducts } from "@/lib/products";
import { AddNewsAlertForm } from "@/components/admin/add-news-alert-form";
import { NewsAlertsTable, type NewsAlertRow } from "@/components/admin/news-alerts-table";

export const dynamic = "force-dynamic";

// Manages the NewsAlert table — both the plain text market alerts the
// public News & Market Alerts panel already supported, and the
// image-carrying "poster" entries (live-webinar promos, community
// announcements) this page was added for. See
// src/components/news/news-alerts-section.tsx for how these render on the
// home page, and prisma/seed-posters.ts for the initial batch of posters
// seeded (inactive by default — most were dated/expired webinar invites).
export default async function NewsAlertsAdminPage() {
  const [alerts, products] = await Promise.all([
    prisma.newsAlert.findMany({
      orderBy: [{ isBreaking: "desc" }, { publishedAt: "desc" }],
    }),
    getActiveProducts(),
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

  const productOptions = products.map((p) => ({ slug: p.slug, name: p.name }));

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
          Everything shown in the home page&apos;s News &amp; Market Alerts panel — plain market
          alerts and image posters (webinar promos, community updates) both live here. Only{" "}
          <strong>Active</strong> entries show on the site; toggle one off instead of deleting it
          to keep it for later.
        </p>
      </div>

      <AddNewsAlertForm products={productOptions} />

      <div className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-bold">
          All Entries <span className="text-sm font-normal text-muted-foreground">({rows.length})</span>
        </h2>
        <NewsAlertsTable rows={rows} />
      </div>
    </div>
  );
}
