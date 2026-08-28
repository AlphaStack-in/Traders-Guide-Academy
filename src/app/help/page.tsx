import Link from "next/link";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { TocSidebar, type TocEntry } from "@/components/site/toc-sidebar";
import { LegalSection as Section } from "@/components/site/legal-section";
import { clientConfig } from "@/lib/client-config";
import { REFERRAL_CONFIG } from "@/lib/referral-config";

// Subscriber-facing "how do I use this" manual — deliberately scoped to
// features that are actually live for this deployment (see AGENTS.md /
// project standing facts: single-tenant, TGA only). Dhan/Goodwill
// broker-connect, the digest email, and news alerts are all switched off
// (see clientConfig) and intentionally not documented here — nothing to
// walk a subscriber through on a feature they can't see.
//
// Same TocSidebar + LegalSection pattern as /faq, kept out of the main
// top nav for the same reason FAQ is (see main-navigation.tsx's
// deliberately short Home/Dashboard/Signals/Contact list) — linked from
// the footer instead.
export default function HelpPage() {
  const { siteName, siteNameShort, pricingPlans, batchInfo, whatsappUrl, telegramUrl } =
    clientConfig;
  const brokerOfferBrand = clientConfig.brokerOffer?.brandName;

  const SECTIONS: TocEntry[] = [
    { id: "getting-started", label: "Getting started" },
    { id: "registering", label: "How do I register?" },
    { id: "logging-in", label: "How do I log in?" },
    { id: "receiving-signals", label: "How do I actually receive signals?" },
    { id: "reading-dashboard", label: "How do I read the Dashboard?" },
    { id: "using-signals-page", label: "How do I use the Signals page?" },
    { id: "your-profile", label: "How do I manage my profile?" },
    { id: "upgrade-extend", label: "How do I upgrade or extend my plan?" },
    { id: "refer-and-earn", label: "How does Refer & Earn work?" },
    ...(clientConfig.dhanOfferEnabled && brokerOfferBrand
      ? [{ id: "broker-offer", label: `What is the ${brokerOfferBrand} offer?` }]
      : []),
    { id: "getting-help", label: "How do I get help or reset my password?" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto flex-1 w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold sm:text-4xl">
            Help <span className="signalflow-gold-text">Manual</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            A step-by-step guide to every feature on {siteName} — for questions about pricing
            or policy instead, see the{" "}
            <Link href="/faq" className="text-primary underline underline-offset-2">
              FAQ
            </Link>
            .
          </p>
        </div>

        <div className="flex gap-10">
          <TocSidebar entries={SECTIONS} />

          <div className="signalflow-glass signalflow-neutral-border flex min-w-0 flex-1 flex-col gap-6 rounded-2xl border p-6 sm:p-8">
            <Section id="getting-started" title="Getting started">
              <p>
                {siteName} works on a transparency-first model: our{" "}
                <Link href="/dashboard" className="text-primary underline underline-offset-2">
                  Dashboard
                </Link>{" "}
                and{" "}
                <Link href="/signals" className="text-primary underline underline-offset-2">
                  Signals
                </Link>{" "}
                pages are public — anyone can see our full track record, win rate, and every
                signal we&apos;ve ever posted, entry to exit, without logging in. That&apos;s
                intentional: you can verify performance before you pay anything.
              </p>
              <p>
                An account (registering + logging in) is only needed for two things: managing
                your own membership on the{" "}
                <span className="font-semibold text-foreground">Account Profile</span> page, and
                the{" "}
                <span className="font-semibold text-foreground">Refer &amp; Earn</span> program.
                The live trade calls themselves arrive over WhatsApp/Telegram, not by refreshing
                this website — see &ldquo;How do I actually receive signals?&rdquo; below.
              </p>
            </Section>

            <Section id="registering" title="How do I register?">
              <p>Go to the home page and click any plan&apos;s Register button. You&apos;ll fill in:</p>
              <ul className="mt-2 flex flex-col gap-1 [&>li]:pl-4 [&>li]:-indent-4">
                <li>• Your name, phone, and email</li>
                <li>• A password (this logs you into your account going forward — see below)</li>
                <li>• Your current trading broker (or &ldquo;Other&rdquo; if it&apos;s not listed)</li>
                <li>• Which plan you want — {pricingPlans.map((p) => p.label).join(", ")}</li>
              </ul>
              <p className="mt-2">
                Submitting the form creates your account and logs you in automatically — you
                don&apos;t need a separate first login. You&apos;ll then see payment instructions
                (UPI + WhatsApp confirmation to a payment manager); membership becomes active once
                that payment is confirmed on our end. If you&apos;ve been a member before, use the{" "}
                <span className="font-semibold text-foreground">Continue Premium</span> button
                on the pricing section instead — it looks up your existing account by phone number
                and offers the renewal price shown in{" "}
                <Link href="/faq#pricing" className="text-primary underline underline-offset-2">
                  the FAQ&apos;s pricing table
                </Link>
                .
              </p>
            </Section>

            <Section id="logging-in" title="How do I log in?">
              <p>
                Use the Login link (top-right of the site, or in the footer) with the email and
                password you set at registration. Once logged in, your name appears top-right with
                a small arrow — click it to reach your{" "}
                <Link href="/account/profile" className="text-primary underline underline-offset-2">
                  Profile
                </Link>{" "}
                or{" "}
                <Link href="/account/refer" className="text-primary underline underline-offset-2">
                  Refer &amp; Earn
                </Link>{" "}
                pages, or to log out.
              </p>
              <p className="mt-2">
                There&apos;s no self-service &ldquo;forgot password&rdquo; link yet — if you&apos;re
                locked out, contact us (see &ldquo;How do I get help&rdquo; below) and we&apos;ll
                reset it for you.
              </p>
            </Section>

            <Section id="receiving-signals" title="How do I actually receive signals?">
              <p>
                This is the single most common point of confusion, so it&apos;s worth being
                explicit: paid signals are delivered live over{" "}
                <span className="font-semibold text-foreground">WhatsApp and Telegram</span>{" "}
                during market hours ({batchInfo.whatsappTimings}), plus live Zoom sessions (
                {batchInfo.zoomTimings.join(" and ")}) where the reasoning behind each trade is
                explained. Once your payment is confirmed, our team adds you to those groups
                directly — there&apos;s no in-website &ldquo;live feed&rdquo; you need to watch.
              </p>
              <p className="mt-2">
                The website&apos;s public{" "}
                <Link href="/signals" className="text-primary underline underline-offset-2">
                  Signals
                </Link>{" "}
                page mirrors every call after it&apos;s sent, mainly so you (and anyone
                considering joining) can audit the track record — it&apos;s a record, not the
                delivery channel.
              </p>
            </Section>

            <Section id="reading-dashboard" title="How do I read the Dashboard?">
              <p>
                The{" "}
                <Link href="/dashboard" className="text-primary underline underline-offset-2">
                  Dashboard
                </Link>{" "}
                is public performance analytics computed from every signal we&apos;ve published —
                the same numbers our admin sees, no login required. Use the date-range chips and
                the instrument filter (Nifty / Sensex / Bank Nifty / Midcap Nifty) near the top to
                narrow the numbers to a specific period or instrument.
              </p>
              <ul className="mt-2 flex flex-col gap-1.5 [&>li]:pl-4 [&>li]:-indent-4">
                <li>
                  • <span className="font-semibold text-foreground">Total % Won</span> and the
                  donut chart below it show cumulative return and how it breaks down by
                  instrument.
                </li>
                <li>
                  • <span className="font-semibold text-foreground">Win Rate</span> is the share of
                  closed signals that hit a target rather than stop-loss, shown as its own donut.
                </li>
                <li>
                  • <span className="font-semibold text-foreground">Profit vs. Loss % by Day</span>{" "}
                  charts daily performance over the selected range.
                </li>
                <li>
                  • <span className="font-semibold text-foreground">Best &amp; Worst Trades</span>{" "}
                  and <span className="font-semibold text-foreground">Recent Signals</span> list
                  the actual individual calls behind those numbers.
                </li>
              </ul>
              <p className="mt-2">
                Click <span className="font-semibold text-foreground">Share Performance</span>{" "}
                (top right) to generate a shareable image of your current view — useful if you
                want to show someone the track record directly.
              </p>
            </Section>

            <Section id="using-signals-page" title="How do I use the Signals page?">
              <p>
                The{" "}
                <Link href="/signals" className="text-primary underline underline-offset-2">
                  Signals
                </Link>{" "}
                page is the full, filterable trade log — every call we&apos;ve ever posted, open
                or closed. Filter by date range, CE/PE, instrument, or result (Win / Loss / Still
                Open) using the controls above the table. Each row shows entry, stop-loss,
                target(s), and current status:
              </p>
              <ul className="mt-2 flex flex-col gap-1 [&>li]:pl-4 [&>li]:-indent-4">
                <li>
                  • <span className="font-semibold text-foreground">Open*</span> — still running
                </li>
                <li>
                  • <span className="font-semibold text-foreground">Target Hit</span> — closed at
                  a profit target
                </li>
                <li>
                  • <span className="font-semibold text-foreground">SL Hit</span> — closed at
                  stop-loss
                </li>
                <li>
                  • <span className="font-semibold text-foreground">Closed</span> — manually
                  closed at a different price
                </li>
                <li>
                  • <span className="font-semibold text-foreground">Expired</span> — reached
                  expiry without being closed
                </li>
              </ul>
              <p className="mt-2">
                The bell icon in the navbar toggles a sound alert that chimes when a new signal is
                posted or an existing one updates, while you have the site open in a tab.
              </p>
            </Section>

            <Section id="your-profile" title="How do I manage my profile?">
              <p>
                Once logged in, go to{" "}
                <Link href="/account/profile" className="text-primary underline underline-offset-2">
                  Account &rarr; Profile
                </Link>
                . You&apos;ll see your details — Name, Phone, Email, Current Broker, Plan, an
                estimated current billing period, and when you joined — laid out in a simple
                two-column table. Click{" "}
                <span className="font-semibold text-foreground">Edit</span> to change your name,
                phone, email, or broker, then{" "}
                <span className="font-semibold text-foreground">Save</span>. Note the estimated
                billing period is a projection from your registration date and plan length, not a
                tracked exact renewal date — treat it as approximate.
              </p>
            </Section>

            <Section id="upgrade-extend" title="How do I upgrade or extend my plan?">
              <p>
                On your Profile page, next to your current Plan, you&apos;ll see{" "}
                <span className="font-semibold text-foreground">Extend</span> (renew your current
                plan) and, unless you&apos;re already on the top tier,{" "}
                <span className="font-semibold text-foreground">Upgrade</span> (move to the next
                tier up). Both open the same panel: enter your phone number and click{" "}
                <span className="font-semibold text-foreground">Validate</span> to confirm your
                membership, then click{" "}
                <span className="font-semibold text-foreground">Continue via WhatsApp</span> — this
                opens WhatsApp with a message to our payment manager already filled in with the
                right plan and price, so all that&apos;s left is sending it and completing payment
                the same manual UPI + WhatsApp-confirmation way as your original registration.
              </p>
            </Section>

            <Section id="refer-and-earn" title="How does Refer & Earn work?">
              <p>
                From{" "}
                <Link href="/account/refer" className="text-primary underline underline-offset-2">
                  Account &rarr; Refer &amp; Earn
                </Link>
                , click{" "}
                <span className="font-semibold text-foreground">Copy Referral Link</span> and
                share it with a friend. There are two ways to earn:
              </p>
              <ul className="mt-2 flex flex-col gap-1.5 [&>li]:pl-4 [&>li]:-indent-4">
                <li>
                  •{" "}
                  <span className="font-semibold text-foreground">
                    {REFERRAL_CONFIG.CURRENCY_SYMBOL}
                    {REFERRAL_CONFIG.SUCCESSFUL_REFERRAL_REWARD.toLocaleString("en-IN")} per
                    successful referral
                  </span>{" "}
                  — credited once someone you referred completes a paid subscription.
                </li>
                <li>
                  •{" "}
                  <span className="font-semibold text-foreground">
                    {REFERRAL_CONFIG.CURRENCY_SYMBOL}
                    {REFERRAL_CONFIG.SOCIAL_PROMOTION_DAILY_REWARD} per day
                  </span>{" "}
                  for sharing/promoting {siteNameShort} on social media (once per day, capped at{" "}
                  {REFERRAL_CONFIG.CURRENCY_SYMBOL}
                  {REFERRAL_CONFIG.MAX_MONTHLY_SOCIAL_REWARD} a month) — use the{" "}
                  <span className="font-semibold text-foreground">Promote &amp; Earn</span>{" "}
                  buttons on the same page.
                </li>
              </ul>
              <p className="mt-2">
                All of this accumulates as{" "}
                <span className="font-semibold text-foreground">
                  {REFERRAL_CONFIG.CREDIT_LABEL}
                </span>{" "}
                — it&apos;s not a cash payout. Click{" "}
                <span className="font-semibold text-foreground">Redeem Credits</span> to queue
                your available balance toward your <em>next</em> subscription renewal (mention it
                when you renew via WhatsApp so it&apos;s applied). The page also shows your
                referral history and a leaderboard of top referrers.
              </p>
            </Section>

            {clientConfig.dhanOfferEnabled && brokerOfferBrand && (
              <Section id="broker-offer" title={`What is the ${brokerOfferBrand} offer?`}>
                <p>
                  The banner on the pricing section (and a card on some pages) offers{" "}
                  {clientConfig.brokerOffer?.brokerageDiscountPercent}% off brokerage with{" "}
                  {brokerOfferBrand} for {siteNameShort} members. Click{" "}
                  <span className="font-semibold text-foreground">Grab it</span> to open the
                  referral link/WhatsApp flow for that offer.
                </p>
              </Section>
            )}

            <Section id="getting-help" title="How do I get help or reset my password?">
              <p>
                Use the{" "}
                <Link href="/contact" className="text-primary underline underline-offset-2">
                  Contact
                </Link>{" "}
                page for the fastest response — it reaches our team directly, including for a
                password reset (there&apos;s no self-service reset yet, so this is also how you
                recover a locked account). You can also reach us on{" "}
                {whatsappUrl && whatsappUrl !== "#" ? (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-2"
                  >
                    WhatsApp
                  </a>
                ) : (
                  "WhatsApp"
                )}{" "}
                or{" "}
                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-2"
                >
                  Telegram
                </a>{" "}
                directly. For pricing, refund, and policy questions, check the{" "}
                <Link href="/faq" className="text-primary underline underline-offset-2">
                  FAQ
                </Link>{" "}
                first — most of those are answered there.
              </p>
            </Section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
