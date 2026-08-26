import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { Hero } from "@/components/landing/hero";
import { TrustStats } from "@/components/landing/trust-stats";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Testimonials } from "@/components/landing/testimonials";
import { Pricing } from "@/components/landing/pricing";
import { NewsAlertsSection } from "@/components/news/news-alerts-section";
import { InstagramGrid } from "@/components/landing/instagram-grid";
import { clientConfig } from "@/lib/client-config";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <TrustStats />
        <HowItWorks />
        <Testimonials />
        <Pricing />
        {clientConfig.newsAlertsEnabled && (
          <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <NewsAlertsSection />
          </section>
        )}
        <InstagramGrid />
      </main>
      <Footer />
    </div>
  );
}
