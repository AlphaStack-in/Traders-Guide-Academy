import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { TocSidebar, type TocEntry } from "@/components/site/toc-sidebar";
import { LegalSection as Section } from "@/components/site/legal-section";
import { clientConfig } from "@/lib/client-config";

export default function FaqPage() {
  const { batchInfo, pricingPlans, siteName, siteNameShort, dhanOfferEnabled } = clientConfig;
  const brokerOfferBrand = clientConfig.brokerOffer?.brandName ?? "Dhan";

  const SECTIONS: TocEntry[] = [
    { id: "what-is-thc", label: `What is ${siteName}?` },
    { id: "membership-benefits", label: "What do I get as a member?" },
    { id: "pricing", label: "How much does it cost?" },
    { id: "timings", label: "When are signals and live sessions sent?" },
    { id: "how-to-join", label: "How do I join / pay?" },
    { id: "refund-policy", label: "What is the refund policy?" },
    { id: "guaranteed-profit", label: "Are signals guaranteed to profit?" },
    { id: "win-rate", label: "How is the Win Rate calculated?" },
    { id: "receiving-signals", label: "How will I receive signals?" },
    { id: "sebi", label: `Is ${siteNameShort} SEBI-registered?` },
    { id: "who-can-join", label: "Who can join?" },
    ...(dhanOfferEnabled
      ? [{ id: "dhan-referral", label: `What is the ${brokerOfferBrand} referral offer?` }]
      : []),
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto flex-1 w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold sm:text-4xl">
            Frequently Asked <span className="signalflow-gold-text">Questions</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Everything you need to know before joining {siteName}.
          </p>
        </div>

        <div className="flex gap-10">
          <TocSidebar entries={SECTIONS} />

          <div className="signalflow-glass signalflow-neutral-border flex min-w-0 flex-1 flex-col gap-6 rounded-2xl border p-6 sm:p-8">
            <Section id="what-is-thc" title={`What is ${siteName}?`}>
              <p>
                {siteName} ({siteNameShort}) is an intraday options-buying signals community. We
                publish every CE/PE call — entry, stop-loss, and target — openly on our{" "}
                <span className="font-semibold text-foreground">Trade Log</span> and{" "}
                <span className="font-semibold text-foreground">Performance Dashboard</span>, and
                run live Zoom sessions to teach the reasoning behind each trade.
              </p>
            </Section>

            <Section id="membership-benefits" title="What do I get as a member?">
              <ul className="flex flex-col gap-1.5 [&>li]:pl-4 [&>li]:-indent-4">
                {batchInfo.benefits.map((benefit) => (
                  <li key={benefit}>• {benefit}</li>
                ))}
              </ul>
            </Section>

            <Section id="pricing" title="How much does it cost?">
              <p>
                We offer three plans — pick whichever billing period suits you, all with the same
                benefits:
              </p>
              <ul className="mt-2 flex flex-col gap-1 [&>li]:pl-4 [&>li]:-indent-4">
                {pricingPlans.map((plan) => (
                  <li key={plan.id}>
                    •{" "}
                    <span className="font-semibold text-foreground">
                      {plan.label}: ₹{plan.priceInr.toLocaleString("en-IN")}
                      {plan.periodLabel}
                    </span>{" "}
                    (₹{plan.existingMemberPriceInr.toLocaleString("en-IN")} renewal price for
                    existing members{plan.savingsLabel ? ` — ${plan.savingsLabel}` : ""})
                  </li>
                ))}
              </ul>
              <p className="mt-2">
                See the{" "}
                <a href="/#pricing" className="text-primary underline underline-offset-2">
                  pricing section
                </a>{" "}
                on the home page for full details.
              </p>
            </Section>

            <Section id="timings" title="When are signals and live sessions sent?">
              <p>
                <span className="font-semibold text-foreground">Live Zoom sessions:</span>{" "}
                {batchInfo.zoomTimings.join(" · ")}
              </p>
              <p>
                <span className="font-semibold text-foreground">WhatsApp signal hours:</span>{" "}
                {batchInfo.whatsappTimings}
              </p>
            </Section>

            <Section id="how-to-join" title="How do I join / pay?">
              <p>
                Fill in your details on the{" "}
                <a href="/register" className="text-primary underline underline-offset-2">
                  Register Premium
                </a>{" "}
                page, then complete payment via the UPI ID or manager contact shown there. Once
                payment is confirmed, you&apos;ll be added to the WhatsApp group and live Zoom
                sessions for your plan&apos;s billing period.
              </p>
            </Section>

            <Section id="refund-policy" title="What is the refund policy?">
              <p>{batchInfo.refundPolicy} All fees are charged for educational training and live sessions, not for guaranteed trading returns.</p>
            </Section>

            <Section id="guaranteed-profit" title="Are signals guaranteed to profit?">
              <p>
                No. Every call is for educational purposes only. Trading involves substantial
                risk, profits are never guaranteed, and losses can occur. Please read our full{" "}
                <a href="/terms#risk-disclosure" className="text-primary underline underline-offset-2">
                  Risk Disclosure
                </a>{" "}
                before trading.
              </p>
            </Section>

            <Section id="win-rate" title="How is the Win Rate calculated?">
              <p>
                The Win Rate and Total Capture % shown on our{" "}
                <a href="/dashboard" className="text-primary underline underline-offset-2">
                  Performance Dashboard
                </a>{" "}
                are computed live from every signal we&apos;ve published — wins and losses both —
                not a curated highlight reel. These are historical figures, not a forecast of
                future results.
              </p>
            </Section>

            <Section id="receiving-signals" title="How will I receive signals?">
              <p>
                Signals go out on WhatsApp during market hours and are explained live in our Zoom
                sessions. You can also track every call in real time on the{" "}
                <a href="/signals" className="text-primary underline underline-offset-2">
                  Trade Log
                </a>{" "}
                — tap the bell icon there to get a sound alert whenever a signal is posted or
                updated.
              </p>
            </Section>

            <Section id="sebi" title={`Is ${siteNameShort} SEBI-registered?`}>
              <p>
                No. We are not a SEBI-registered Research Analyst or Investment Adviser. Nothing
                shared here — Zoom sessions, WhatsApp calls, or dashboard stats — should be taken
                as a buy or sell recommendation.
              </p>
            </Section>

            <Section id="who-can-join" title="Who can join?">
              <p>
                Anyone serious about learning intraday options trading, provided they can trade
                only with money they can afford to lose. College students are not allowed to join
                this group.
              </p>
            </Section>

            {dhanOfferEnabled && (
              <Section id="dhan-referral" title={`What is the ${brokerOfferBrand} referral offer?`}>
                <p>
                  Existing {brokerOfferBrand} account holders can win free premium group access for the next
                  batch by referring friends and family — subject to a minimum of 10 referrals and
                  50 trades in 1 account. Full details are in our{" "}
                  <a
                    href="/terms#dhan-referral"
                    className="text-primary underline underline-offset-2"
                  >
                    Terms &amp; Conditions
                  </a>
                  .
                </p>
              </Section>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
