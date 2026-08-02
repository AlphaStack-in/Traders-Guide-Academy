import { redirect } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCurrentSubscriber } from "@/lib/subscriber-auth";
import { prisma } from "@/lib/prisma";
import { clientConfig } from "@/lib/client-config";

export default async function ProfilePage() {
  const subscriber = await getCurrentSubscriber();
  if (!subscriber) {
    redirect("/login?redirectTo=/account/profile");
  }

  const connection = clientConfig.dhanConnectEnabled
    ? await prisma.brokerConnection.findUnique({
        where: { subscriberId: subscriber.id },
        select: { status: true, tokenExpiresAt: true },
      })
    : null;

  const statusVariant =
    connection?.status === "ACTIVE"
      ? "default"
      : connection?.status === "EXPIRED"
        ? "destructive"
        : "outline";

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 py-12 sm:px-6">
        <h1 className="font-heading text-2xl font-bold">
          Your <span className="thc-gold-text">Profile</span>
        </h1>

        <div className="thc-glass thc-neutral-border flex flex-col gap-3 rounded-2xl border p-5">
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
        </div>

        {clientConfig.dhanConnectEnabled && (
          <div className="thc-glass thc-neutral-border flex items-center justify-between gap-3 rounded-2xl border p-5">
            <div>
              <p className="font-heading text-sm font-semibold">Dhan Broker</p>
              <div className="mt-1.5 flex items-center gap-2">
                <Badge variant={statusVariant}>
                  {connection ? (connection.status === "ACTIVE" ? "Connected" : connection.status) : "Not Connected"}
                </Badge>
                {connection?.status === "ACTIVE" && (
                  <span className="text-xs text-muted-foreground">
                    Valid until {new Date(connection.tokenExpiresAt).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
            <Button asChild size="sm" variant="outline" className="shrink-0">
              <Link href="/account/broker">{connection ? "Manage" : "Connect"}</Link>
            </Button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
