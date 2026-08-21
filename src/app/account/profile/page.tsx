import { redirect } from "next/navigation";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { BrokerConnectPanel } from "@/components/account/broker-connect-panel";
import { getCurrentSubscriber } from "@/lib/subscriber-auth";
import { prisma } from "@/lib/prisma";
import { clientConfig } from "@/lib/client-config";
import { formatSignalDate } from "@/lib/utils";

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

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 py-12 sm:px-6">
        <h1 className="font-heading text-2xl font-bold">
          Your <span className="signalflow-gold-text">Profile</span>
        </h1>

        <div className="signalflow-glass signalflow-neutral-border flex flex-col gap-3 rounded-2xl border p-5">
          <div>
            <p className="text-xs text-muted-foreground">Name</p>
            <p className="font-heading font-semibold">{subscriber.name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Phone</p>
            <p className="font-heading font-semibold">{subscriber.phone}</p>
          </div>
          {subscriber.email && (
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-heading font-semibold">{subscriber.email}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground">Batch</p>
            <p className="font-heading font-semibold">
              {subscriber.batchNumber != null ? `Batch ${subscriber.batchNumber}` : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Joined</p>
            <p className="font-heading font-semibold">{formatSignalDate(subscriber.createdAt)}</p>
          </div>
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
