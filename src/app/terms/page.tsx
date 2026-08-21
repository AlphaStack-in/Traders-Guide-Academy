import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { TocSidebar, type TocEntry } from "@/components/site/toc-sidebar";
import { LegalSection as Section } from "@/components/site/legal-section";
import { clientConfig } from "@/lib/client-config";

export default function TermsPage() {
  const { siteName, siteNameShort, dhanOfferEnabled } = clientConfig;

  const SECTIONS: TocEntry[] = [
    { id: "disclaimer", label: "Disclaimer" },
    { id: "market-analysis", label: "Market Analysis & Education" },
    { id: "candidate-information", label: "Candidate Information" },
    { id: "beginner-guidance", label: "Beginner Guidance" },
    { id: "risk-management", label: "Risk Management Rules" },
    { id: "risk-disclosure", label: "Risk Disclosure" },
    ...(dhanOfferEnabled ? [{ id: "dhan-referral", label: "Dhan Referral Offer" }] : []),
    { id: "group-rules", label: "Group Rules" },
    { id: "payment-acceptance", label: "Acceptance of Terms" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto flex-1 w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold sm:text-4xl">
            Terms &amp; <span className="signalflow-gold-text">Conditions</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Please read this in full before joining any {siteName} batch.
          </p>
        </div>

        <div className="flex gap-10">
          <TocSidebar entries={SECTIONS} />

          <div className="signalflow-glass signalflow-neutral-border flex min-w-0 flex-1 flex-col gap-6 rounded-2xl border p-6 sm:p-8">
            <Section id="disclaimer" title="⚠ Disclaimer">
              <ul className="flex flex-col gap-1.5 [&>li]:pl-4 [&>li]:-indent-4">
                <li>
                  • Not SEBI-registered. All Zoom sessions, charts, messages, and discussions are
                  for educational purposes only and are not financial or investment advice.
                </li>
                <li>
                  • We do not promise or guarantee any specific return number or percentage. Our
                  live Win Rate and Total Capture % are historical figures computed from every
                  signal we&apos;ve published, not a forecast of future results.
                </li>
                <li>
                  • Trading involves substantial risk. Profits are not guaranteed, and losses can
                  occur. The mentor, community admins, and members shall not be held responsible
                  for any trading profits or losses.
                </li>
                <li>• Do not take loans, borrow money, or trade with funds you cannot afford to lose.</li>
                <li>
                  • Inform your family members that you are participating in trading and understand
                  the risks involved.
                </li>
                <li>• Always do your own research and make your own trading decisions.</li>
                <li>
                  • Fees are charged only for educational training and live sessions, not for
                  guaranteed profits or trading returns.
                </li>
                <li>
                  • All fees are non-refundable after payment, regardless of trading results,
                  profits, losses, attendance, or participation.
                </li>
              </ul>
            </Section>

            <Section id="market-analysis" title="Market Analysis & Education">
              <p>
                We share our trading approach through live Zoom sessions and WhatsApp messages for
                educational purposes only.
              </p>
              <p>
                <span className="font-semibold text-foreground">Important:</span> Our sessions are
                designed to teach how to trade using our strategy. They are not intended to fully
                reveal our complete strategy, proprietary level-marking methods, or every aspect of
                our trading system.
              </p>
              <p>
                We are committed to sharing our knowledge as much as possible. Members are
                requested to focus on learning first before entering live trading. Building
                knowledge, discipline, risk management, and confidence is more important than
                depending on anyone else for trading decisions.
              </p>
            </Section>

            <Section id="candidate-information" title="Candidate Information">
              <p>
                Members are requested to share their age, trading experience, and current trading
                capital situation so we can understand their background and provide general
                guidance. Any suggestions provided are for educational purposes only and should not
                be considered personal financial advice.
              </p>
            </Section>

            <Section id="beginner-guidance" title="Beginner Guidance">
              <ul className="flex flex-col gap-1.5 [&>li]:pl-4 [&>li]:-indent-4">
                <li>
                  • Beginners are advised to start with a small amount (for example, ₹10,000) until
                  they gain confidence and develop their own trading skills.
                </li>
                <li>• Do not trust anyone blindly or invest large amounts based only on someone else&apos;s suggestions.</li>
                <li>• Trade only with money you can afford to lose.</li>
                <li>
                  • Increase your trading size only after developing your own strategy, knowledge,
                  and confidence.
                </li>
              </ul>
            </Section>

            <Section id="risk-management" title="Risk Management Rules">
              <ul className="flex flex-col gap-1.5 [&>li]:pl-4 [&>li]:-indent-4">
                <li>• Set your own daily and monthly profit and loss limits before trading.</li>
                <li>• Avoid overtrading or increasing risk after losses.</li>
                <li>• Follow proper risk management and trade according to your own plan.</li>
              </ul>
            </Section>

            <Section id="risk-disclosure" title="Risk Disclosure">
              <p>
                Trading and investing in financial markets carry inherent risks, and losses may
                exceed initial expectations. Historical performance should not be considered a
                reliable indicator of future outcomes. Any examples, case studies, or testimonials
                presented are for illustrative purposes only and do not represent typical results or
                guarantee future performance. Always conduct your own research, assess your risk
                tolerance, and trade only with funds you can afford to lose.
              </p>
            </Section>

            {dhanOfferEnabled && (
              <Section id="dhan-referral" title="Dhan Referral Offer">
                <p>
                  Existing Dhan account holders can win free premium group access for the next
                  batch by referring friends and family, subject to:
                </p>
                <ul className="flex flex-col gap-1.5 [&>li]:pl-4 [&>li]:-indent-4">
                  <li>• Minimum 10 referrals.</li>
                  <li>• Minimum 50 trades in 1 account.</li>
                </ul>
              </Section>
            )}

            <Section id="group-rules" title="Group Rules">
              <ul className="flex flex-col gap-1.5 [&>li]:pl-4 [&>li]:-indent-4">
                <li>• Members must maintain respectful behavior in personal messages and live Zoom sessions.</li>
                <li>
                  • Members are not allowed to share their personal trading losses during live
                  sessions to keep discussions focused on learning and strategy.
                </li>
                <li>
                  • Any violation of group rules, misconduct, or disruption may result in removal
                  from the group without notice.
                </li>
              </ul>
              <p className="font-semibold text-foreground">
                College students are not allowed to join this group.
              </p>
            </Section>

            <Section id="payment-acceptance" title="Acceptance of Terms">
              <p>
                By making payment to join our program/group, you confirm that you have read,
                understood, and accepted all terms, conditions, disclaimers, and group rules.
              </p>
              <p>Payment confirms your agreement to participate under these terms.</p>
            </Section>

            <p className="border-t border-white/5 pt-6 text-xs text-muted-foreground/80">
              By joining this group and making payment, you acknowledge that you have read,
              understood, and accepted all terms, disclaimer, and group rules. Kindly read all these
              points before joining our community — after payment, we do not refund under any
              circumstances.
            </p>
            <p className="text-sm font-medium text-foreground">Thanks and wish you all success,<br />{siteNameShort} — Founder and Admins</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
