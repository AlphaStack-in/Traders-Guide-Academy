import { redirect } from "next/navigation";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { MembershipStatusCard } from "@/components/account/subscriptions/membership-status-card";
import { PurchaseHistoryList } from "@/components/account/subscriptions/purchase-history-list";
import { MyCoursesSection } from "@/components/account/subscriptions/my-courses-section";
import { SimplePurchasesSection } from "@/components/account/subscriptions/simple-purchases-section";
import { PmsAccountSection } from "@/components/account/subscriptions/pms-account-section";
import { getCurrentSubscriber } from "@/lib/subscriber-auth";
import { getSubscriberSubscriptionsSummary } from "@/lib/subscriptions";

/**
 * "My Subscriptions" hub — everything a subscriber has bought from TGA in
 * one place, laid out as a 3-column executive-terminal dashboard (Plan &
 * Billing + Billing history | PMS Portfolio Terminal | Courses/Indicators/
 * Memberships) that collapses to a single column on mobile. See
 * src/lib/subscriptions.ts for the data-shaping helper this page renders,
 * src/components/account/subscriptions/ui.tsx for the shared card/stat-tile/
 * progress-ring building blocks every section below uses, and
 * TGA_Subscriptions_Module_BuildPrompt.md for the original feature spec.
 */
export default async function SubscriptionsPage() {
  const subscriber = await getCurrentSubscriber();
  if (!subscriber) {
    redirect("/login?redirectTo=/account/subscriptions");
  }

  const summary = await getSubscriberSubscriptionsSummary(subscriber);

  return (
    <div className="flex min-h-screen flex-col md:pl-64">
      <Navbar />
      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-heading text-2xl font-bold">
            My <span className="signalflow-gold-text">Subscriptions</span>
          </h1>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--signalflow-win)]" />
            Account synced
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-12">
          {/* Column 1: Plan & Billing hub */}
          <section className="flex flex-col gap-5 xl:col-span-3">
            <MembershipStatusCard
              membership={summary.membership}
              planBilling={summary.planBilling}
              phone={subscriber.phone}
            />
            <PurchaseHistoryList items={summary.purchaseHistory} />
          </section>

          {/* Column 2: PMS Portfolio Terminal centerpiece */}
          <section className="flex flex-col gap-5 xl:col-span-5">
            <PmsAccountSection accounts={summary.pmsAccounts} />
          </section>

          {/* Column 3: Products & assets */}
          <section className="flex flex-col gap-5 xl:col-span-4">
            <MyCoursesSection courses={summary.courses} />
            <SimplePurchasesSection
              title="My Indicators & E-books"
              emptyLabel="You haven't purchased an indicator or e-book yet."
              items={summary.indicatorsAndEbooks}
            />
            <SimplePurchasesSection
              title="Memberships"
              emptyLabel="No membership plan purchases on record."
              items={summary.memberships}
            />
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
