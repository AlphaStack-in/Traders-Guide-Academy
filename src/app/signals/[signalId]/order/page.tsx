import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OrderScreen } from "@/components/account/order-screen";
import { getCurrentSubscriber } from "@/lib/subscriber-auth";
import { prisma } from "@/lib/prisma";
import { clientConfig } from "@/lib/client-config";
import { decryptSecret } from "@/lib/broker/crypto";
import { resolveDhanContract } from "@/lib/broker/dhan-contract-resolver";
import { getDhanFundLimit } from "@/lib/broker/dhan-client";
import { INSTRUMENT_LABEL } from "@/lib/instruments";
import { formatSignalDate, formatSignalTime } from "@/lib/utils";

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="thc-glass thc-neutral-border flex-1 rounded-xl border p-4 text-center">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-xl font-bold">{value}</p>
    </div>
  );
}

export default async function SignalOrderPage({
  params,
}: {
  params: Promise<{ signalId: string }>;
}) {
  if (!clientConfig.dhanConnectEnabled) {
    redirect("/signals");
  }

  const { signalId } = await params;

  const subscriber = await getCurrentSubscriber();
  if (!subscriber) {
    redirect(`/login?redirectTo=/signals/${signalId}/order`);
  }

  const signal = await prisma.signal.findUnique({ where: { id: signalId } });
  if (!signal) {
    notFound();
  }

  const connection = await prisma.brokerConnection.findUnique({
    where: { subscriberId: subscriber.id },
  });

  let lotSize: number | null = null;
  let contractError: string | null = null;
  let availableBalance: number | null = null;

  if (connection?.status === "ACTIVE") {
    if (!signal.instrument || !signal.expiry) {
      contractError = "This signal is missing instrument/expiry — contact support.";
    } else {
      const contract = await resolveDhanContract({
        instrument: signal.instrument,
        strike: signal.strike,
        optionType: signal.optionType,
        expiry: signal.expiry,
      });
      if (!contract) {
        contractError = "Couldn't find a matching Dhan contract for this trade — contact support.";
      } else {
        lotSize = contract.lotSize;
      }
    }

    try {
      const accessToken = decryptSecret(connection.accessTokenEnc);
      const fund = await getDhanFundLimit({ accessToken });
      if (fund.ok && fund.data) {
        availableBalance = fund.data.availabelBalance;
      }
    } catch {
      // Best-effort only — leave availableBalance as null ("—") on failure.
    }
  }

  const label = `${signal.instrument ? `${INSTRUMENT_LABEL[signal.instrument]} ` : ""}${signal.strike} ${signal.optionType}`;
  const isOpen = signal.status === "OPEN";

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-4 py-8 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/signals"
            aria-label="Back to Trade Log"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-xl font-bold thc-gold-text">{label}</h1>
            <Badge
              variant="outline"
              className={
                signal.optionType === "CE"
                  ? "border-[var(--thc-ce)]/50 text-[var(--thc-ce)]"
                  : "border-[var(--thc-pe)]/50 text-[var(--thc-pe)]"
              }
            >
              {signal.optionType}
            </Badge>
          </div>
        </div>

        {!isOpen ? (
          <div className="thc-glass thc-neutral-border rounded-2xl border p-6 text-center text-sm text-muted-foreground">
            This trade is no longer open.
          </div>
        ) : (
          <>
            <div className="flex gap-4">
              <InfoCard label="Entry Price" value={`₹${signal.entryPrice}`} />
              <InfoCard label="Stop Loss" value={`₹${signal.stopLoss}`} />
            </div>
            <InfoCard
              label={signal.targets.length > 1 ? "Target Prices" : "Target Price"}
              value={signal.targets.map((t, i) => (signal.targets.length > 1 ? `T${i + 1} ${t}` : `${t}`)).join(", ")}
            />
            <div className="flex gap-4">
              <InfoCard label="Trade Type" value="INTRADAY" />
              <InfoCard
                label="Posted Date & Time"
                value={`${formatSignalDate(signal.signalTime)} ${formatSignalTime(signal.signalTime)}`}
              />
            </div>

            {connection?.status !== "ACTIVE" ? (
              <div className="thc-glass thc-gold-border flex flex-col items-center gap-3 rounded-2xl border p-6 text-center">
                <p className="font-heading font-semibold">Broker Not Connected</p>
                <p className="text-sm text-muted-foreground">
                  Connect your Dhan account to place this order.
                </p>
                <Button asChild className="thc-glow thc-btn-gradient w-fit">
                  <Link href="/account/broker">Connect Now</Link>
                </Button>
              </div>
            ) : contractError ? (
              <div className="thc-glass rounded-2xl border border-[var(--thc-loss)]/40 p-6 text-center text-sm text-[var(--thc-loss)]">
                {contractError}
              </div>
            ) : (
              <OrderScreen
                signalId={signal.id}
                entryPrice={signal.entryPrice}
                lotSize={lotSize!}
                availableBalance={availableBalance}
              />
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
