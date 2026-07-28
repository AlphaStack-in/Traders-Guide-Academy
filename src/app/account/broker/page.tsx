import { redirect } from "next/navigation";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { BrokerConnectPanel } from "@/components/account/broker-connect-panel";
import { getCurrentSubscriber } from "@/lib/subscriber-auth";
import { prisma } from "@/lib/prisma";
import { clientConfig } from "@/lib/client-config";

export default async function BrokerAccountPage() {
  if (!clientConfig.dhanConnectEnabled) {
    redirect("/signals");
  }

  const subscriber = await getCurrentSubscriber();
  if (!subscriber) {
    redirect("/login?redirectTo=/account/broker");
  }

  const connection = await prisma.brokerConnection.findUnique({
    where: { subscriberId: subscriber.id },
    select: {
      dhanClientId: true,
      dhanClientName: true,
      status: true,
      tokenExpiresAt: true,
    },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto flex flex-1 w-full max-w-md flex-col items-center justify-center px-4 py-16 sm:px-6">
        <div className="thc-glass thc-gold-border w-full rounded-2xl p-8">
          <h1 className="font-heading text-2xl font-bold">
            Broker <span className="thc-gold-text">Connect</span>
          </h1>
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
      </main>
      <Footer />
    </div>
  );
}
