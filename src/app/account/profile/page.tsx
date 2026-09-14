import { redirect } from "next/navigation";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { BrokerConnectPanel } from "@/components/account/broker-connect-panel";
import { PaymentDetailsCard } from "@/components/account/payment-details-card";
import { ProfileEditForm } from "@/components/account/profile-edit-form";
import { getCurrentSubscriber } from "@/lib/subscriber-auth";
import { prisma } from "@/lib/prisma";
import { clientConfig } from "@/lib/client-config";
import { getActiveBroker } from "@/lib/app-settings";

export default async function ProfilePage() {
  const subscriber = await getCurrentSubscriber();
  if (!subscriber) {
    redirect("/login?redirectTo=/account/profile");
  }

  const activeBroker = await getActiveBroker();
  const connection =
    activeBroker === "dhan"
      ? await prisma.brokerConnection.findUnique({
          where: { subscriberId: subscriber.id },
          select: { dhanClientId: true, dhanClientName: true, status: true, tokenExpiresAt: true },
        })
      : null;

  const subscriberPlan = subscriber.billingCycle
    ? clientConfig.pricingPlans.find((p) => p.id === subscriber.billingCycle!.toLowerCase())
    : null;

  return (
    <div className="flex min-h-screen flex-col md:pl-64">
      <Navbar />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 px-4 py-12 sm:px-6">
        <h1 className="font-heading text-2xl font-bold">
          Your <span className="signalflow-gold-text">Profile</span>
        </h1>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:items-start">
          {/* Main column — identity + payment instructions */}
          <div className="flex flex-col gap-5 lg:col-span-2">
            <ProfileEditForm
              initialName={subscriber.name}
              initialPhone={subscriber.phone}
              initialEmail={subscriber.email ?? ""}
              initialCurrentBroker={subscriber.currentBroker}
              initialPhotoUrl={subscriber.photoUrl}
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
          </div>

          {/* Side column — quick links out to the rest of the account area */}
          <div className="flex flex-col gap-5">
            <div className="signalflow-glass signalflow-gold-border flex flex-col gap-3 rounded-2xl border p-5">
              <h3 className="font-heading font-bold text-base">
                My <span className="signalflow-gold-text">Subscriptions</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Purchases, courses, indicators, memberships, plan &amp; billing, and your PMS
                growth in one place.
              </p>
              <a
                href="/account/subscriptions"
                className="signalflow-glow signalflow-btn-gradient inline-flex h-9 w-full items-center justify-center rounded-lg px-4 text-xs font-semibold text-black"
              >
                Open
              </a>
            </div>

            <div className="signalflow-glass signalflow-gold-border flex flex-col gap-3 rounded-2xl border p-5">
              <h3 className="font-heading font-bold text-base">
                Refer &amp; <span className="signalflow-gold-text">Earn</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Invite friends and earn rewards for every verified member.
              </p>
              <a
                href="/account/refer"
                className="signalflow-glow signalflow-btn-gradient inline-flex h-9 w-full items-center justify-center rounded-lg px-4 text-xs font-semibold text-black"
              >
                Open Referrals
              </a>
            </div>
          </div>
        </div>

        {activeBroker === "dhan" && (
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
