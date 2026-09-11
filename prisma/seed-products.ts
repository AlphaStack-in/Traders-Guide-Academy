/**
 * Seeds the /products catalog — migrated from the Graphy store
 * (https://tradersguideacademy.graphy.com/s/store/courses). Deliberately
 * NOT wired into `npm run db:seed` (prisma/seed.ts nukes signals/subscribers
 * on every run — this must never run alongside that). Run by hand:
 *
 *   npx tsx prisma/seed-products.ts
 *
 * Idempotent — upserts by slug, so re-running after editing a row below
 * just updates it rather than duplicating it.
 */
import { PrismaClient, type ProductCategory } from "@prisma/client";

const prisma = new PrismaClient();

interface SeedProduct {
  slug: string;
  name: string;
  category: ProductCategory;
  description: string;
  longDescription: string;
  priceInPaise: number;
  originalPriceInPaise?: number;
  rating?: number;
  ratingCount?: number;
  isFeatured?: boolean;
  // Real promo poster from public/posters/ (see prisma/seed-posters.ts,
  // which these same files were copied in for) — only set for the few
  // products with actual marketing art today. Left unset everywhere else;
  // the home-page products marquee and catalog fall back to a category
  // icon box when this is null.
  imageUrl?: string;
}

const PRODUCTS: SeedProduct[] = [
  {
    slug: "option-mastery",
    name: "Option Mastery",
    category: "COURSE",
    description: "A structured options-trading course covering strategy selection, Greeks and risk sizing.",
    longDescription:
      "A structured options-trading course covering strategy selection, the Greeks, and position/risk sizing for intraday and swing option buyers. Includes recorded modules plus practical examples drawn from live market conditions.",
    priceInPaise: 499900,
    originalPriceInPaise: 1250000,
    rating: 5.0,
    ratingCount: 3,
  },
  {
    slug: "a-to-z-stock-market-course",
    name: "A to Z Basic To Advance Level Stock Market Course",
    category: "COURSE",
    description: "A complete beginner-to-advanced stock market course covering the full trading fundamentals.",
    longDescription:
      "A complete beginner-to-advanced stock market course — starts from the basics of how markets work and builds up to advanced technical and fundamental analysis techniques used by active traders.",
    priceInPaise: 1400000,
    rating: 5.0,
    ratingCount: 2,
  },
  {
    slug: "option-hedging-strategy",
    name: "Option Hedging Strategy",
    category: "COURSE",
    description: "A free course on hedging option positions to manage downside risk.",
    longDescription:
      "A free course on hedging option positions — practical techniques to protect an existing position against adverse moves without giving up all of the upside.",
    priceInPaise: 0,
    rating: 5.0,
    ratingCount: 24,
    imageUrl: "/posters/webinar-option-hedging-2026-08-29.jpeg",
  },
  {
    slug: "technical-analysis-on-index",
    name: "Technical Analysis On Index",
    category: "COURSE",
    description: "Index-focused technical analysis: chart patterns, levels and index-specific setups.",
    longDescription:
      "Technical analysis focused specifically on index trading (Nifty/Bank Nifty) — chart patterns, key levels, and setups tailored to how indices actually move intraday.",
    priceInPaise: 499900,
    originalPriceInPaise: 3000000,
  },
  {
    slug: "best-ways-to-learn-technical-analysis",
    name: "Best Ways To Learn Technical Analysis",
    category: "COURSE",
    description: "A practical roadmap for learning technical analysis the right way, without overwhelm.",
    longDescription:
      "A practical roadmap for learning technical analysis without getting lost in indicator overload — what to study first, how to practice, and how to validate a setup before trading it live.",
    priceInPaise: 299900,
    originalPriceInPaise: 1200000,
    rating: 5.0,
    ratingCount: 3,
  },
  {
    slug: "lakshman-rekha-line-indicator",
    name: "Lakshman Rekha Line Indicator",
    category: "INDICATOR",
    description: "A proprietary line indicator marking key intraday support/resistance boundaries.",
    longDescription:
      "A proprietary charting indicator that plots key intraday support/resistance boundaries ('Lakshman Rekha') to help time entries and exits around levels price tends to respect.",
    priceInPaise: 2500000,
  },
  {
    slug: "ready-made-signal",
    name: "Ready Made Signal",
    category: "INDICATOR",
    description: "A ready-to-use signal indicator for quick entry/exit reference on your own charts.",
    longDescription:
      "A ready-to-use signal indicator you install on your own charting platform — flags potential entry/exit points directly on the chart for quick reference during the trading session.",
    priceInPaise: 100000,
    imageUrl: "/posters/update-ready-made-signal-indicator-2026-09-08.jpeg",
  },
  {
    slug: "indicator-and-ready-made-signal",
    name: "Indicator & Ready Made Signal",
    category: "INDICATOR",
    description: "The full indicator + ready-made signal bundle, our most popular indicator package.",
    longDescription:
      "The full bundle — the proprietary indicator plus the ready-made signal overlay together — our most popular indicator package, combining level-based analysis with quick-reference signal markers.",
    priceInPaise: 499900,
    originalPriceInPaise: 2400000,
    rating: 5.0,
    ratingCount: 53,
  },
  {
    slug: "golden-line-and-btc-indicator",
    name: "Golden Line & BTC Indicator",
    category: "INDICATOR",
    description: "A dual-indicator combo pairing the Golden Line with a breakout/trend-confirmation (BTC) tool.",
    longDescription:
      "A dual-indicator combo pairing the Golden Line level-tool with a breakout/trend-confirmation (BTC) indicator, so a signal from one can be cross-checked against the other before acting on it.",
    priceInPaise: 200000,
    originalPriceInPaise: 500000,
    rating: 5.0,
    ratingCount: 5,
  },
  {
    slug: "bonuses-and-ebooks-on-stock-market",
    name: "Bonuses and E-books On Stock Market",
    category: "EBOOK",
    description: "A free bundle of e-books and bonus material covering core stock market concepts.",
    longDescription:
      "A free bundle of e-books and bonus reference material covering core stock market concepts — a lightweight starting point before moving on to the paid courses.",
    priceInPaise: 0,
    rating: 4.8,
    ratingCount: 10,
  },
  {
    slug: "portfolio-management-service",
    name: "Portfolio Management Service",
    category: "PMS",
    // Copy summarized from the client's own "Invest Together, Grow Together"
    // PMS marketing graphic — a disciplined group-investment plan, not a
    // discretionary account-by-account PMS. The "we bear any loss" / "min.
    // 15% return" / "20% profit-share commission" lines are the client's own
    // existing marketing claims, transcribed as-is; flag these to legal/
    // compliance before this goes live, since a guaranteed-return promise is
    // exactly the kind of language SEBI scrutinizes (see the site's own FAQ
    // disclaimers on this).
    description:
      "A 50-member group investment plan — ₹30,000 per member builds a ₹15,00,000 pool, professionally traded toward a ₹1 crore target.",
    longDescription:
      "A disciplined group investment approach backed by strategy, technology and experience. 50 like-minded investors form one group, each contributing ₹30,000 (₹15,00,000 total capital). We trade the pooled fund using proven strategies, advanced indicators and real market experience, reinvesting profits to compound growth faster. The target is to grow the fund to ₹1,00,00,000 as quickly as possible — once reached, the full amount is divided among all members.\n\nIncludes free access to a 1-year mentorship program, all premium indicators, important study notes, and live support and guidance, plus a like-minded trading community.\n\nRisk cover: if there is any loss, we bear it. Minimum return guarantee: even if the ₹1 crore target isn't reached, members get a minimum 15% return in year 1. Profit share: after profits are distributed to the group, a 20% commission is taken.",
    priceInPaise: 3000000,
    isFeatured: true,
    imageUrl: "/posters/pms-portfolio-management-system-2026-09-10.jpeg",
  },
  {
    slug: "alfa-venture-credit-link",
    name: "Alfa Venture Credit Link",
    category: "MEMBERSHIP",
    // Placeholder copy — Graphy's store page exposed only the title/price
    // for this listing. Replace with real copy once the client supplies it
    // (see build-prompt.md §1).
    description: "Membership-linked credit access plan — placeholder copy, pending real description from the client.",
    longDescription:
      "Membership-linked credit access plan. This description is placeholder copy — Graphy's store listing didn't expose more than the title and price, so get the client to supply the real details before this goes live.",
    priceInPaise: 2500000,
  },
  {
    slug: "live-session",
    name: "Live Session",
    category: "MEMBERSHIP",
    // Placeholder copy — see note above.
    description: "Interactive live trading session — placeholder copy, pending real description from the client.",
    longDescription:
      "An interactive live trading session. This description is placeholder copy — Graphy's store listing didn't expose more than the title and price, so get the client to supply the real details before this goes live.",
    priceInPaise: 2500000,
  },
  {
    slug: "super-elite-group",
    name: "Super Elite Group",
    category: "MEMBERSHIP",
    // Placeholder copy — see note above.
    description: "Premium elite membership group — placeholder copy, pending real description from the client.",
    longDescription:
      "A premium elite membership group. This description is placeholder copy — Graphy's store listing didn't expose more than the title and price, so get the client to supply the real details before this goes live.",
    priceInPaise: 2000000,
    rating: 5.0,
    ratingCount: 1,
  },
];

async function main() {
  for (const p of PRODUCTS) {
    const { slug, ...data } = p;
    await prisma.product.upsert({
      where: { slug },
      create: { slug, ...data },
      update: data,
    });
    console.log(`Upserted product: ${slug}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
