/**
 * Seeds the /products catalog with the offers extracted from the September
 * 2026 seminar promo recording (NotebookLM extraction, sanitized for SEBI
 * compliance — see chat history for the full review). Kept as a SEPARATE
 * file from prisma/seed-products.ts (rather than appended to it) so this
 * batch can be reviewed/edited/re-run independently of the original Graphy
 * migration catalog. Deliberately NOT wired into `npm run db:seed`. Run by
 * hand:
 *
 *   npx tsx prisma/seed-products-webinar.ts
 *
 * Idempotent — upserts by slug, so re-running after editing a row below
 * just updates it rather than duplicating it.
 *
 * NOT INCLUDED: the webinar's "PMS / managed account" offer (20% profit
 * share, capital pooling) is deliberately left out of this file. It needs
 * SEBI (Portfolio Managers) Regulations review — a discretionary/pooled PMS
 * requires formal registration and a ₹50L+ minimum ticket size — before any
 * version of it is added to the catalog. Do not add it here without that
 * sign-off; see the existing "portfolio-management-service" entry in
 * seed-products.ts for the same open flag on the pre-existing PMS listing.
 *
 * TWO POSSIBLE NEAR-DUPLICATES to resolve before/after running this —
 * check the live catalog and decide whether to fold these into the
 * existing rows (update by slug) instead of adding a second listing:
 *   1. "a-to-z-masterclass-mentorship" below vs. the existing
 *      "a-to-z-stock-market-course" in seed-products.ts — same subject,
 *      different price/scope (this one adds live mentorship + indicators).
 *   2. "golden-line-speedometer-volatility-suite" below vs. the existing
 *      "golden-line-and-btc-indicator" in seed-products.ts — same Golden
 *      Line tool, bundled differently. Its ₹25,000 price also matches the
 *      flagship course price exactly, which is more likely a transcription
 *      slip than an intended figure — confirm the real price before this
 *      goes live.
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
  accessValidityDays?: number;
  courseAccessUrl?: string;
  imageUrl?: string;
}

const PRODUCTS: SeedProduct[] = [
  {
    slug: "tga-annual-trading-indicator-membership",
    name: "TGA Annual Trading & Indicator Membership",
    category: "MEMBERSHIP",
    description:
      "Complete 1-year access to TGA's suite of proprietary TradingView indicators, live strategy webinars, and community support.",
    longDescription:
      "The TGA Annual Membership provides complete 365-day access to all proprietary TradingView scripts, including the Sniper Trading Strategy and Jadoo Ki Chhadi rules. Members receive continuous live guidance, strategy updates, and interactive community sessions to build disciplined execution habits. Designed for traders seeking systematic rules and structured market analysis throughout the year. Includes complete setup assistance and ongoing technical support for all supported trading setups.",
    priceInPaise: 1500000,
    originalPriceInPaise: 2400000,
    accessValidityDays: 365,
  },
  {
    slug: "tga-quarterly-trading-indicator-access",
    name: "TGA Quarterly Trading & Indicator Access",
    category: "MEMBERSHIP",
    description:
      "90-day subscription providing full access to TGA TradingView scripts, live market analysis, and trader guidance.",
    longDescription:
      "A comprehensive 3-month membership plan designed for active traders looking to integrate rule-based trading systems into their workflow. Includes 90 days of access to TGA TradingView scripts, live session walk-throughs, and setup guidance. Members learn how to identify low-risk entry zones, manage positional options trades, and apply systematic risk management rules. Perfect for evaluating performance before committing to an annual membership plan.",
    priceInPaise: 500000,
    originalPriceInPaise: 600000,
    accessValidityDays: 90,
  },
  {
    slug: "a-to-z-masterclass-mentorship",
    name: "A-to-Z Stock Market Masterclass & Mentorship",
    category: "COURSE",
    description:
      "Comprehensive trading program covering basic-to-advanced technical analysis, 6 intraday strategies, 5 positional systems, and live mentorship.",
    longDescription:
      "The flagship TGA training program covers complete stock market fundamentals up through advanced option buying and positional trade execution. Students receive direct live mentorship, interactive chart walk-throughs, 6 specialized intraday strategies (including Diamond and Blue Candle), and 5 positional trading frameworks. The course also includes access to proprietary TradingView indicator scripts like Golden Line and Jadoo Ki Chhadi, alongside hands-on guidance on risk management, position sizing, and trade journaling. Designed to transform retail traders into disciplined, rule-based market participants.",
    priceInPaise: 2500000,
    originalPriceInPaise: 3500000,
    isFeatured: true,
  },
  {
    slug: "sniper-setup-free-trial-masterclass",
    name: "1-Week Free Trading Masterclass & Sniper Setup",
    category: "COURSE",
    description:
      "Introductory 7-day live mentorship program covering rule-based trading, risk-reward fundamentals, and the Sniper Trading setup.",
    longDescription:
      "An introductory 7-day mentorship series hosted live by TGA, introducing retail traders to rule-based execution and asymmetric risk-reward principles. Participants learn the core concepts behind the Sniper Trading approach, market structure evaluation, and proper option expiry selection. Includes temporary 24-hour setup access to test indicator integration on TradingView. A zero-cost entry point designed to help traders experience TGA's structured methodology firsthand.",
    priceInPaise: 0,
    originalPriceInPaise: 250000,
    accessValidityDays: 7,
  },
  {
    slug: "jadoo-ki-chhadi-indicator",
    name: "Jadoo Ki Chhadi Option Compounding Indicator (1-Month Pass)",
    category: "INDICATOR",
    description:
      "Proprietary TradingView script designed for directional option buying, market bias identification, and systematic profit targets.",
    longDescription:
      "A specialized TradingView indicator that generates systematic bullish and bearish market bias signals for options trading. Features built-in entry rules, directional split guidance, and defined profit target levels to assist option buyers in holding winning moves. Comes with a complete video walkthrough on script installation, time-frame configuration, and option strike selection. Includes 30 days of full invite-only script access on TradingView.",
    priceInPaise: 99900,
    originalPriceInPaise: 200000,
    accessValidityDays: 30,
  },
  {
    slug: "golden-line-speedometer-volatility-suite",
    name: "Golden Line & Speedometer Volatility Suite",
    category: "INDICATOR",
    description:
      "Advanced TradingView indicator suite featuring Golden Line levels and ATR-based market regime volatility filters.",
    longDescription:
      "Built for active intraday and positional traders, this indicator suite combines TGA's Golden Line key price levels with a Speedometer volatility filter. The ATR-based volatility filter helps traders identify low-momentum regimes to avoid choppy market conditions and false breakouts. Integrates easily onto TradingView charts with clear visual cues for trend confirmation and risk management. Comes with lifetime script access and complete setup instructions.",
    // FLAG: ₹25,000 (see file header) — matches the flagship course price
    // exactly; confirm against the actual webinar quote before publishing.
    priceInPaise: 2500000,
    originalPriceInPaise: 3000000,
  },
  {
    slug: "commodity-crypto-alpha-indicator",
    name: "Commodity & Crypto Alpha TradingView Script",
    category: "INDICATOR",
    description:
      "Specialized TradingView indicator tuned for high-volatility Silver commodities and Bitcoin/crypto market setups.",
    longDescription:
      "A dedicated TradingView script engineered specifically for commodity and cryptocurrency traders focusing on Silver futures and Bitcoin setups. Pre-configured with specific target range alerts (300-500 points on Silver) and clear momentum confirmation signals. Helps traders systematically navigate volatile commodity sessions without manual over-analysis. Includes full access, installation guide, and setup parameters for active commodity sessions.",
    priceInPaise: 1000000,
    originalPriceInPaise: 1500000,
    accessValidityDays: 365,
  },
  {
    slug: "intraday-positional-strategy-playbook",
    name: "TGA Intraday & Positional Strategy Playbook",
    category: "EBOOK",
    description:
      "Concise digital handbook detailing TGA's 6 intraday and 5 positional strategy rules, entry checklists, and exit filters.",
    longDescription:
      "A structured reference playbook providing step-by-step rules for TGA's core trading setups, including the Intraday Diamond, Blue Candle, Breakout, and Reversal strategies. Includes clear entry checklists, option strike selection guidelines, and the 75/75 moving average ribbon profit-locking rules. Serves as a handy desk reference for traders seeking to review trade parameters before entering live positions. Delivered as a downloadable PDF with visual chart examples.",
    priceInPaise: 99900,
    originalPriceInPaise: 199900,
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
