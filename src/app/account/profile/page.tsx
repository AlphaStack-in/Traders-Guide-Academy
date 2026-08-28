import { redirect } from "next/navigation";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { BrokerConnectPanel } from "@/components/account/broker-connect-panel";
import { PaymentDetailsCard } from "@/components/account/payment-details-card";
import { ProfileEditForm } from "@/components/account/profile-edit-form";
import { getCurrentSubscriber } from "@/lib/subscriber-auth";
import { prisma } from "@/lib/prisma";
import { clientConfig, type PricingPlan } from "@/lib/client-config";
import { formatDateOnly, formatFullTimestamp } from "@/lib/utils";
import type { SubscriptionStatus } from "@prisma/client";

const TIER_ORDER: PricingPlan["id"][] = ["monthly", "quarterly", "yearly"];

// No renewal/payment tracking exists yet (payment is manual, off-platform —
// see PaymentDetailsCard), so there's no real "current billing period" date
// on record. This estimates one from registration date + plan length, purely
// informational — it won't reflect an actual renewal. Labeled "(est.)" in
// the UI for that reason; see profile-edit-form.tsx.
function addCycleInterval(date: Date, cycle: "MONTHLY" | "QUARTERLY" | "YEARLY"): Date {
  const d = new Date(date);
  if (cycle === "MONTHLY") d.setMonth(d.getMonth() + 1);
  else if (cycle === "QUARTERLY") d.setMonth(d.getMonth() + 3);
  else d.setFullYear(d.getFullYear() + 1);
  return d;
}

export default async function ProfilePage() {
  const subscriber = await getCurrentSubscriber();
  if (!subscriber) {
    redirect("/login?redirectTo=/account/profile");
  }

  const connection = clientConfig.dhanConnectEnabled
    ? await prisma.brokerConnection.findUnique({
        where: { subscriberId: subscriber.id },
        select: { dhanClientId: true, dhanClientName: true, status: true, tokenExpiresAt: true },
      })
    : null;

  // Most recent self-service Subscription on record (see
  // prisma/schema.prisma) — null for a subscriber who has never used the
  // Cashfree Autopay checkout (still purely on the manual/WhatsApp flow).
  const latestSubscription = await prisma.subscription.findFirst({
    where: { subscriberId: subscriber.id },
    orderBy: { createdAt: "desc" },
    select: { status: true, currentPeriodEnd: true },
  });

  const AUTOPAY_STATUS_LABEL: Record<SubscriptionStatus, string> = {
    CREATED: "Checkout started",
    AUTHENTICATED: "Authorized — first charge pending",
    ACTIVE: "Active",
    PENDING: "Payment retrying",
    HALTED: "Halted — renew manually",
    CANCELLED: "Cancelled",
    COMPLETED: "Completed",
    EXPIRED: "Expired",
  };
  const CANCELLABLE_STATUSES: SubscriptionStatus[] = [
    "CREATED",
    "AUTHENTICATED",
    "ACTIVE",
    "PENDING",
    "HALTED",
  ];
  const autopay = latestSubscription
    ? {
        statusLabel: AUTOPAY_STATUS_LABEL[latestSubscription.status],
        isActive: CANCELLABLE_STATUSES.includes(latestSubscription.status),
        periodEndLabel: latestSubscription.currentPeriodEnd
          ? formatDateOnly(latestSubscription.currentPeriodEnd)
          : null,
      }
    : null;

  const subscriberPlan = subscriber.billingCycle
    ? clientConfig.pricingPlans.find(
        (p) => p.id === subscriber.billingCycle!.toLowerCase(),
      )
    : null;

  const periodStartLabel = subscriber.billingCycle ? formatDateOnly(subscriber.createdAt) : null;
  const periodEndLabel = subscriber.billingCycle
    ? formatDateOnly(addCycleInterval(subscriber.createdAt, subscriber.billingCycle))
    : null;

  const currentTierIndex = subscriberPlan ? TIER_ORDER.indexOf(subscriberPlan.id) : -1;
  const upgradePlanId =
    currentTierIndex >= 0 && currentTierIndex < TIER_ORDER.length - 1
      ? TIER_ORDER[currentTierIndex + 1]
      : undefined;
  const showUpgrade = currentTierIndex !== TIER_ORDER.length - 1;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 py-12 sm:px-6">
        <h1 className="font-heading text-2xl font-bold">
          Your <span className="signalflow-gold-text">Profile</span>
        </h1>

        <ProfileEditForm
          initialName={subscriber.name}
          initialPhone={subscriber.phone}
          initialEmail={subscriber.email ?? ""}
          initialCurrentBroker={subscriber.currentBroker}
          planLabel={subscriberPlan ? subscriberPlan.label : "—"}
          periodStartLabel={periodStartLabel}
          periodEndLabel={periodEndLabel}
          joinedLabel={formatFullTimestamp(subscriber.createdAt)}
          plans={clientConfig.pricingPlans}
          currentPlanId={subscriberPlan?.id}
          upgradePlanId={upgradePlanId}
          showUpgrade={showUpgrade}
          autopay={autopay}
        />

        <div className="signalflow-glass signalflow-gold-border flex flex-col gap-3 rounded-2xl border p-5">
          <div>
            <h3 className="font-heading font-bold text-base">
              Payment <span className="signalflow-gold-text">Details</span>
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Keep this handy until your payment is confirmed.
            </p>
          </div>
          <PaymentDetailsCard plan={subscriberPlan} />
        </div>

        <div className="signalflow-glass signalflow-gold-border flex flex-col gap-3 rounded-2xl border p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-base">Refer &amp; <span className="signalflow-gold-text">Earn</span></h3>
              <p className="text-xs text-muted-foreground mt-0.5">Invite friends and earn rewards for every verified member.</p>
            </div>
            <a
              href="/account/refer"
              className="signalflow-glow signalflow-btn-gradient inline-flex h-9 items-center justify-center rounded-lg px-4 text-xs font-semibold text-black"
            >
              Open Referrals
            </a>
          </div>
        </div>

        {clientConfig.dhanConnectEnabled && (
          <div className="signalflow-glass signalflow-gold-border rounded-2xl border p-5">
            <h2 className="font-heading text-lg font-bold">
              Broker <span className="signalflow-gold-text">Connect</span>
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Connect your Dhan account to place orders straight from ongoing trade signals.
            </p>
            <div className="mt-6">
              <BrokerConnectPanel
                initialConnection={
                  connection
                    ? {
                        dhanClientId: connection.dhanClientId,
                        dhanClientName: connection.dhanClientName,
                        status: connection.status,
                        tokenExpiresAt: connection.tokenExpiresAt.toISOString(),
                      }
                    : null
                }
              />
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
