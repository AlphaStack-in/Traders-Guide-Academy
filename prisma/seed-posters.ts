/**
 * One-off seed for the batch of WhatsApp promo posters found in
 * "1 Proposals/1 TGA/Plan posters" (webinar invites + the PMS explainer
 * graphics) — copied into public/posters/ alongside this script.
 *
 * Run once after `npx prisma migrate deploy` (or `migrate dev`) has applied
 * 20260911120000_add_news_alert_poster_image. Run `npx tsx prisma/seed-products.ts`
 * first (or at some point before) if the catalog is empty — the product-image
 * backfill below is a no-op with a console warning for any productSlug it
 * can't find, it doesn't fail the whole run:
 *
 *   npx tsx prisma/seed-posters.ts
 *
 * Idempotent — each row uses a fixed id (seed-poster-01..11) and is
 * upserted, so re-running this is safe.
 *
 * Most of the 11 are seeded with isActive: false — dated "today"/"Sunday
 * 8PM" webinar invites for sessions that have already passed, so showing
 * them live on the site now would be stale/misleading. Flip any of those
 * back on from /admin/news-alerts if still useful, or just add fresh ones
 * there going forward.
 *
 * Four posters (Option Hedging, Ready Made Signal, and the two PMS
 * explainers) DO match a real /products catalog entry (see
 * prisma/seed-products.ts) and are seeded Active with productSlug set —
 * each becomes a "View & Buy" link to that product's page, and also
 * backfills that product's own (currently null) imageUrl with the poster
 * image, same as the News & Alerts admin form does for a new poster (see
 * createNewsAlert in src/app/admin/(protected)/news-alerts/actions.ts).
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface PosterSeed {
  id: string;
  title: string;
  category: string;
  summary: string;
  imageUrl: string;
  sourceUrl?: string;
  // Slug of a matching /products catalog entry — see seed-products.ts.
  // Present only for the 4 evergreen product posters; the rest are
  // one-off/expired webinar invites with nothing to link to.
  productSlug?: string;
  // Defaults to false (see file header) — set true only for the posters
  // that link to a real, currently-sold product.
  isActive?: boolean;
  publishedAt: string; // ISO, IST offset
}

const POSTERS: PosterSeed[] = [
  {
    id: "seed-poster-01",
    title: "Live Webinar — Intraday Breakout Strategy",
    category: "Webinar",
    summary: "Break the range, capture the move — Sunday 8 PM.",
    imageUrl: "/posters/webinar-intraday-breakout-2026-07-25.jpeg",
    publishedAt: "2026-07-25T16:56:22+05:30",
  },
  {
    id: "seed-poster-02",
    title: "Intraday Breakout Strategy — Join Session Today 8 PM",
    category: "Webinar",
    summary: "2 signal powerful moves — small risk, big reward.",
    imageUrl: "/posters/webinar-intraday-breakout-join-2026-07-26.jpeg",
    publishedAt: "2026-07-26T18:05:18+05:30",
  },
  {
    id: "seed-poster-03",
    title: "Learn Intraday Breakout Strategy — Smart Traders Use This Method",
    category: "Webinar",
    summary: "Sunday 8 PM — limit risk, better control of trades.",
    imageUrl: "/posters/webinar-intraday-breakout-stats-2026-07-26.jpeg",
    publishedAt: "2026-07-26T09:23:51+05:30",
  },
  {
    id: "seed-poster-04",
    title: "Exclusive Webinar — Option Hedging Strategy",
    category: "Webinar",
    summary: "Protect. Manage. Profit. Free live session, Sunday 8 PM.",
    imageUrl: "/posters/webinar-option-hedging-2026-08-29.jpeg",
    productSlug: "option-hedging-strategy",
    isActive: true,
    publishedAt: "2026-08-29T20:55:48+05:30",
  },
  {
    id: "seed-poster-05",
    title: "Live Webinar — Option Trading Strategy with Satish Rathod",
    category: "Webinar",
    summary: "Proven strategies, risk management, live market insights — today 8 PM.",
    imageUrl: "/posters/webinar-option-trading-satish-2026-08-30.jpeg",
    publishedAt: "2026-08-30T17:39:44+05:30",
  },
  {
    id: "seed-poster-06",
    title: "Live Masterclass — The Secret Formula to Making ₹1 Lakh+ in One Trade",
    category: "Webinar",
    summary: "Topic: Sniper Trading Strategy, with Satish Rathod (23 years experience).",
    imageUrl: "/posters/masterclass-sniper-1lakh-2026-08-31.jpeg",
    sourceUrl: "https://zoom.tagmango.com/redirect/webinar/group/6a380cd5523e3cf78bd823ce",
    publishedAt: "2026-08-31T14:01:26+05:30",
  },
  {
    id: "seed-poster-07",
    title: "Sniper Trading Indicator and Strategy",
    category: "Community Update",
    summary: "Find precise entries, maximize profits — pinpoint perfect entry.",
    imageUrl: "/posters/sniper-trading-indicator-1-2026-09-01.jpeg",
    publishedAt: "2026-09-01T18:28:54+05:30",
  },
  {
    id: "seed-poster-08",
    title: "Sniper Trading Indicator — Precise Entry, Small Risk, Big Reward",
    category: "Community Update",
    summary: "2 signal powerful moves — fill the form to try it once.",
    imageUrl: "/posters/sniper-trading-indicator-2-2026-09-01.jpeg",
    publishedAt: "2026-09-01T19:07:12+05:30",
  },
  {
    id: "seed-poster-09",
    title: "Ready Made Signal Strategy Indicator — Access Given",
    category: "Community Update",
    summary: "Access to the Ready Made Signal Strategy Indicator has been given to all members.",
    imageUrl: "/posters/update-ready-made-signal-indicator-2026-09-08.jpeg",
    productSlug: "ready-made-signal",
    isActive: true,
    publishedAt: "2026-09-08T11:47:39+05:30",
  },
  {
    id: "seed-poster-10",
    title: "PMS — People Multiplier Strategy",
    category: "PMS",
    summary: "Small contributions, bigger opportunities — our target is ₹1 Crore, together.",
    imageUrl: "/posters/pms-people-multiplier-strategy-2026-09-10.jpeg",
    productSlug: "portfolio-management-service",
    isActive: true,
    publishedAt: "2026-09-10T16:49:53+05:30",
  },
  {
    id: "seed-poster-11",
    title: "Portfolio Management System (PMS)",
    category: "PMS",
    summary: "A disciplined group investment approach backed by strategy, technology & experience.",
    imageUrl: "/posters/pms-portfolio-management-system-2026-09-10.jpeg",
    productSlug: "portfolio-management-service",
    isActive: true,
    publishedAt: "2026-09-10T17:33:01+05:30",
  },
];

async function main() {
  for (const poster of POSTERS) {
    const isActive = poster.isActive ?? false;
    await prisma.newsAlert.upsert({
      where: { id: poster.id },
      create: {
        id: poster.id,
        title: poster.title,
        category: poster.category,
        severity: "INFO",
        summary: poster.summary,
        content: poster.summary,
        imageUrl: poster.imageUrl,
        sourceUrl: poster.sourceUrl ?? null,
        productSlug: poster.productSlug ?? null,
        publishedAt: new Date(poster.publishedAt),
        isBreaking: false,
        isActive,
      },
      update: {
        title: poster.title,
        category: poster.category,
        summary: poster.summary,
        content: poster.summary,
        imageUrl: poster.imageUrl,
        sourceUrl: poster.sourceUrl ?? null,
        productSlug: poster.productSlug ?? null,
        publishedAt: new Date(poster.publishedAt),
      },
    });
    console.log(`Seeded: ${poster.title}`);

    // Backfill the linked product's own thumbnail from this poster — only
    // when it doesn't already have one, same guard as the admin form's
    // createNewsAlert (never clobber an image an admin later set directly
    // on the product).
    if (poster.productSlug) {
      const product = await prisma.product.findUnique({ where: { slug: poster.productSlug } });
      if (product && !product.imageUrl) {
        await prisma.product.update({
          where: { slug: poster.productSlug },
          data: { imageUrl: poster.imageUrl },
        });
        console.log(`  → backfilled ${poster.productSlug}'s product image`);
      } else if (!product) {
        console.warn(`  ⚠ product "${poster.productSlug}" not found — run seed-products.ts first?`);
      }
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
