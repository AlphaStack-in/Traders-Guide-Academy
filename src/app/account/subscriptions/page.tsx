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
 * one place: signals membership status, a unified purchase history, My
 * Courses (with validity), Indicators & E-books, Memberships, and PMS
 * account summary/growth. See src/lib/subscriptions.ts for the data-shaping
 * helper this page renders, and TGA_Subscriptions_Module_BuildPrompt.md for
 * the original feature spec.
 */
export default async function SubscriptionsPage() {
  const subscriber = await getCurrentSubscriber();
  if (!subscriber) {
    redirect("/login?redirectTo=/account/subscriptions");
  }

  const summary = await getSubscriberSubscriptionsSummary(subscriber.id);

  return (
    <div className="flex min-h-screen flex-col md:pl-64">
      <Navbar />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-4 py-12 sm:px-6">
        <h1 className="font-heading text-2xl font-bold">
          My <span className="signalflow-gold-text">Subscriptions</span>
        </h1>

        <MembershipStatusCard membership={summary.membership} />
        <PurchaseHistoryList items={summary.purchaseHistory} />
        <MyCoursesSection courses={summary.courses} />
        <SimplePurchasesSection
          title="My Indicators & E-books"
          emptyLabel="You haven't purchased an indicator or e-book yet."
          items={summary.indicatorsAndEbooks}
        />
        <PmsAccountSection accounts={summary.pmsAccounts} />
        <SimplePurchasesSection
          title="Memberships"
          emptyLabel="No membership plan purchases on record."
          items={summary.memberships}
        />
      </main>
      <Footer />
    </div>
  );
}
