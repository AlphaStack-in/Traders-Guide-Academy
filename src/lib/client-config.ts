// This repo is single-tenant: one client (Traders Guide Academy), one
// deployment. NEXT_PUBLIC_CLIENT / the CLIENTS record are kept only because
// the shared SignalFlow codebase (where this was forked from) uses them to
// render multiple brands from one repo — harmless to leave the pattern here,
// but there is only the one entry below for it to resolve to.
export type ClientId = "tga";

export interface BatchInfo {
  // Cohort number for admin/referral tracking — independent of pricing now
  // (see PricingPlan below). Not shown as a "batch" concept to visitors.
  batchNumber: number;
  zoomTimings: string[];
  whatsappTimings: string;
  benefits: string[];
  refundPolicy: string;
}

// One of the 3 recurring-duration pricing tiers (replaces the old single
// dated-batch price). All tiers share the same BatchInfo.benefits — this
// models "cheaper per-period the longer you commit," not different feature
// sets per tier. See pricing.tsx and register-form.tsx.
export interface PricingPlan {
  id: "monthly" | "quarterly" | "yearly";
  label: string;
  priceInr: number;
  periodLabel: string;
  existingMemberPriceInr: number;
  // e.g. "Save 13%" vs. paying monthly for the same duration. Omit for the
  // baseline (monthly) tier.
  savingsLabel?: string;
  // Visually highlighted as the recommended tier. At most one plan should
  // set this.
  highlight?: boolean;
}

export interface PaymentInfo {
  upiIds: { vpa: string; name: string }[];
  managers: { name: string; phone: string }[];
}

export interface Testimonial {
  name: string;
  role: string;
  date: string;
  quote: string;
}

export interface InstagramThumbnail {
  thumbnailUrl: string;
  videoUrl: string;
  label: string;
}

export interface BrokerOfferConfig {
  brandName: string;
  logoSrc: string;
  logoAlt: string;
  logoWidth?: number;
  logoHeight?: number;
  brokerageDiscountPercent: number;
}

export interface ClientConfig {
  id: ClientId;
  // Gate on /admin/* login + auth-checked server actions. This is a real
  // paying customer's deployment — keep this true once real subscriber/signal
  // data exists; only ever false for a short-lived window while still being
  // configured pre-launch.
  requireAdminAuth: boolean;
  siteName: string;
  siteNameShort: string;
  // Short caption shown under the hero title on the home page. Omit for a
  // client that doesn't have one.
  tagline?: string;
  // Overrides the default "Intraday Option Buying Signals" hero badge — set
  // for a client that also sells (not just buys) options.
  heroBadgeLabel?: string;
  siteDescription: string;
  logoSrc: string;
  logoAlt: string;
  faviconSrc: string;
  goldStart: string;
  goldEnd: string;
  // Optional secondary brand color sampled from the client's actual logo —
  // used sparingly (logo glow, a secondary button accent), never for
  // gradient text/buttons which stay gold-only. Omit for clients without one.
  logoAccent?: string;
  // 4 shades (light to dark) differentiating instrument slices in the
  // Total % Won donut chart — same hue family, not tied to win/loss colors.
  instrumentDonutColors: [string, string, string, string];
  instagramUrl: string;
  whatsappUrl: string;
  telegramUrl: string;
  // Empty string means "not shown" — only render a link/icon when set, same
  // convention for all four below.
  facebookUrl: string;
  twitterUrl: string;
  youtubeUrl: string;
  linkedinUrl: string;
  // Overrides the default "{batchNumber}th Batch" pricing headline when a
  // client doesn't use this batch model.
  pricingHeadline?: string;
  pricingSubheadline?: string;
  pricingRegisterLabel?: string;
  // Shown when dhanOfferEnabled is true — TGA uses AliceBlue, other clients
  // may still use Dhan (see pricing.tsx fallback).
  brokerOffer?: BrokerOfferConfig;
  // Where instagramThumbnails' videos actually come from — defaults to
  // "Instagram". Set to e.g. "YouTube" when a client's reels come from a
  // different platform (thumbnails/links still use the same shape).
  reelsSourceLabel?: string;
  dhanOfferEnabled: boolean;
  // Gates the "Connect Dhan" broker-connect feature (place real orders from
  // signals). SignalFlow-only while this is being built out.
  dhanConnectEnabled: boolean;
  // Gates Goodwill's own "Place Order" UI (their broker is GIGAPRO, not
  // Dhan — no personal-token connect step, and no real order API yet). For
  // now this only logs an order *request* for the team to process manually.
  // Goodwill-only; must never be true alongside dhanConnectEnabled.
  goodwillBrokerEnabled: boolean;
  // Gates the weekly performance digest email cron. Set to true once the
  // Resend domain is verified and the digest is ready for production.
  digestEnabled: boolean;
  // Gates the home-page News & Market Alerts panel.
  newsAlertsEnabled: boolean;
  batchInfo: BatchInfo;
  pricingPlans: PricingPlan[];
  paymentInfo: PaymentInfo;
  testimonials: Testimonial[];
  instagramThumbnails: InstagramThumbnail[];
}

// Everything below is a placeholder pending real TGA input — brand assets,
// colors, social links, pricing, and payment details all need to be swapped
// for the real thing before this deployment goes live. Never reuse another
// client's payment/social identifiers here. requireAdminAuth stays true
// throughout, per policy for a real paying customer.
const CLIENTS: Record<ClientId, ClientConfig> = {
  tga: {
    id: "tga",
    requireAdminAuth: true,
    siteName: "Traders Guide Academy",
    siteNameShort: "TGA",
    siteDescription:
      "Traders Guide Academy publishes intraday options-buying trade signals to premium subscribers, backed by transparent performance analytics. Powered by SignalFlow technology.",
    // TODO: upload real logo/favicon to public/ and point these at them.
    logoSrc: "/tga-logo.png",
    logoAlt: "Traders Guide Academy",
    faviconSrc: "/tga-favicon.png",
    // TODO: replace with TGA's real brand colors once a logo is supplied —
    // this is just the shared template's default gold.
    goldStart: "#d4af37",
    goldEnd: "#f0c949",
    instrumentDonutColors: ["#f5d576", "#d4af37", "#a8842a", "#7a5f1c"],
    instagramUrl: "https://www.instagram.com/traders_guide_academy/",
    whatsappUrl: "#",
    telegramUrl: "https://t.me/tradersguideacademy01",
    facebookUrl: "",
    twitterUrl: "",
    youtubeUrl: "https://www.youtube.com/@tradersguideacademy",
    linkedinUrl: "",
    pricingHeadline: "Premium community",
    pricingSubheadline: "All signals, Live sessions reach you on time — one flat price.",
    pricingRegisterLabel: "Register Premium",
    // Business-model decisions already made for TGA (see onboarding runbook):
    // same signal-subscription + batch pricing model, broker-connect off,
    // manual UPI + WhatsApp payment confirmation.
    dhanOfferEnabled: true,
    brokerOffer: {
      brandName: "AliceBlue",
      logoSrc: "/aliceblue-logo.png",
      logoAlt: "AliceBlue",
      logoWidth: 140,
      logoHeight: 40,
      brokerageDiscountPercent: 20,
    },
    dhanConnectEnabled: false,
    goodwillBrokerEnabled: false,
    digestEnabled: false,
    newsAlertsEnabled: false,
    batchInfo: {
      batchNumber: 1,
      zoomTimings: ["9:00 AM - 11:30 AM", "2:00 PM - 3:30 PM"],
      whatsappTimings: "9:15 AM - 3:30 PM",
      benefits: [
        "Unlimited intraday CE/PE calls during market hours",
        "Live Zoom sessions — trades explained and copy-traded live",
      ],
      refundPolicy: "Refund not applicable once the current billing period has started.",
    },
    // TODO: starter placeholder pricing — derived from the previous single
    // ₹4,999/batch price (Monthly = same, Quarterly/Yearly discounted for
    // longer commitment). Replace with real numbers before this goes live;
    // same "TODO, not fabricated-looking real data" convention as
    // paymentInfo below.
    pricingPlans: [
      {
        id: "monthly",
        label: "Monthly",
        priceInr: 4999,
        periodLabel: "/month",
        existingMemberPriceInr: 3999,
      },
      {
        id: "quarterly",
        label: "Quarterly",
        priceInr: 12999,
        periodLabel: "/quarter",
        existingMemberPriceInr: 10499,
        savingsLabel: "Save 13%",
        highlight: true,
      },
      {
        id: "yearly",
        label: "Yearly",
        priceInr: 44999,
        periodLabel: "/year",
        existingMemberPriceInr: 35999,
        savingsLabel: "Save 25%",
      },
    ],
    paymentInfo: {
      upiIds: [{ vpa: "TODO@upi", name: "TODO: TGA payee name" }],
      managers: [{ name: "TODO: TGA manager", phone: "+91 00000 00000" }],
    },
    testimonials: [
      {
        name: "Veeramanikandan",
        role: "Premium Trader",
        date: "18 Jul 2026",
        quote:
          "Every call comes with an exact entry, SL and target — no guesswork. Been following for 2 batches now.",
      },
      {
        name: "Rohan Deshmukh",
        role: "Premium Trader",
        date: "15 Jul 2026",
        quote:
          "What I like most is they track every signal openly on the dashboard, wins and losses both.",
      },
      {
        name: "Pavithran Krishnan",
        role: "Premium Trader",
        date: "12 Jul 2026",
        quote:
          "Live Zoom sessions actually explain the reasoning behind each trade, not just the call.",
      },
      {
        name: "Siddharth Mehta",
        role: "Premium Trader",
        date: "10 Jul 2026",
        quote: "Signals come on time during market hours, entries and SL are always clear.",
      },
      {
        name: "Kiran Venkataraj",
        role: "Premium Trader",
        date: "05 Jul 2026",
        quote:
          "Transparent track record is what convinced me — the win rate on the dashboard is real, not marketing.",
      },
      {
        name: "Aditya Kulkarni",
        role: "Premium Trader",
        date: "02 Jul 2026",
        quote: "Good risk management focus — they always remind capital protection first.",
      },
    ],
    // Leave empty, or add clearly-labeled placeholders, until real reels are
    // supplied.
    instagramThumbnails: [],
  },
};

const CLIENT_ID = ((process.env.NEXT_PUBLIC_CLIENT as ClientId | undefined) ?? "tga") in CLIENTS
  ? ((process.env.NEXT_PUBLIC_CLIENT as ClientId | undefined) ?? "tga")
  : "tga";

export const clientConfig: ClientConfig = CLIENTS[CLIENT_ID];

export type OrderBroker = "dhan" | "goodwill";

// Live control has moved to the admin-editable AppSettings table — see
// getActiveBroker() in src/lib/app-settings.ts. dhanConnectEnabled /
// goodwillBrokerEnabled / digestEnabled / newsAlertsEnabled below are only
// consulted once, as the seed default for a fresh deployment's first
// AppSettings row (before any admin has visited /admin/settings) — they no
// longer gate anything directly.
