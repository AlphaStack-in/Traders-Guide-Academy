import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { TocSidebar, type TocEntry } from "@/components/site/toc-sidebar";
import { LegalSection as Section } from "@/components/site/legal-section";
import { clientConfig } from "@/lib/client-config";

const SECTIONS: TocEntry[] = [
  { id: "information-we-collect", label: "Information We Collect" },
  { id: "how-we-use-it", label: "How We Use It" },
  { id: "payments", label: "Payments" },
  { id: "third-parties", label: "Third Parties" },
  { id: "cookies", label: "Cookies & Tracking" },
  { id: "data-storage", label: "Data Storage & Security" },
  { id: "your-choices", label: "Your Choices" },
  { id: "contact", label: "Contact Us" },
];

export default function PrivacyPage() {
  const { siteNameShort } = clientConfig;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto flex-1 w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold sm:text-4xl">
            Privacy <span className="signalflow-gold-text">Policy</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            What we collect, why, and how it&apos;s handled — in plain language.
          </p>
        </div>

        <div className="flex gap-10">
          <TocSidebar entries={SECTIONS} />

          <div className="signalflow-glass signalflow-neutral-border flex min-w-0 flex-1 flex-col gap-6 rounded-2xl border p-6 sm:p-8">
            <Section id="information-we-collect" title="Information We Collect">
              <p>
                When you fill out the{" "}
                <a href="/register" className="text-primary underline underline-offset-2">
                  Register Premium
                </a>{" "}
                form, we collect your{" "}
                <span className="font-semibold text-foreground">name, phone number</span>, and
                optionally your <span className="font-semibold text-foreground">email</span>.
                That&apos;s the only personal information {siteNameShort} collects — we don&apos;t ask for
                your address, ID proof, or any payment card/bank details.
              </p>
              <p>
                Browsing the Trade Log, Dashboard, or Contact pages doesn&apos;t collect any
                personal information — those pages are public and read-only.
              </p>
            </Section>

            <Section id="how-we-use-it" title="How We Use It">
              <p>
                We use your name and phone number to add you to the correct WhatsApp group and
                Zoom sessions for your batch, and to reach you about your membership. We don&apos;t
                use your information for anything beyond running the community — no marketing
                lists, no reselling, no sharing with unrelated third parties.
              </p>
            </Section>

            <Section id="payments" title="Payments">
              <p>
                {siteNameShort} does not process payments or store any payment information. Membership fees
                are paid manually via the UPI IDs or manager contacts shown on the Register page —
                we never see or store your card, bank, or UPI app credentials.
              </p>
            </Section>

            <Section id="third-parties" title="Third Parties">
              <p>
                Joining our WhatsApp group, Telegram channel, or Instagram page means your
                interactions there are subject to that platform&apos;s own privacy policy — {siteNameShort}
                {" "}doesn&apos;t control how WhatsApp, Telegram, or Instagram handle your data.
              </p>
              <p>
                Our signal data and your registration details are stored with our infrastructure
                providers (a managed Postgres database and hosting platform) solely to run the
                site — they don&apos;t use your data for their own purposes.
              </p>
            </Section>

            <Section id="cookies" title="Cookies & Tracking">
              <p>
                {siteNameShort} does not use any analytics, advertising, or tracking cookies. The only cookies
                set by this site are session cookies for the admin login, scoped strictly to the{" "}
                <span className="font-semibold text-foreground">/admin</span> area — visitors
                browsing the public site never have a cookie set.
              </p>
            </Section>

            <Section id="data-storage" title="Data Storage & Security">
              <p>
                Registration details are stored in a managed Postgres database and are accessible
                only to {siteNameShort} admins through an authenticated admin dashboard. We take reasonable
                steps to keep this data secure, but no online system can be guaranteed 100% secure.
              </p>
            </Section>

            <Section id="your-choices" title="Your Choices">
              <p>
                You can ask us to update or delete your registration details at any time — just
                reach out using the contact details below. Leaving our WhatsApp/Telegram groups is
                always your choice and doesn&apos;t affect anything stored on this site.
              </p>
            </Section>

            <Section id="contact" title="Contact Us">
              <p>
                Questions about this policy or your data? Reach out via the{" "}
                <a href="/contact" className="text-primary underline underline-offset-2">
                  Contact page
                </a>
                , or message one of our managers there directly.
              </p>
            </Section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
