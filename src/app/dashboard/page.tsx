import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { DashboardView, type SerializedSignal } from "@/components/dashboard/dashboard-view";
import { InstrumentFilter } from "@/components/dashboard/instrument-filter";
import { RefreshButton } from "@/components/site/refresh-button";
import { prisma } from "@/lib/prisma";
import { RANGE_PRESETS, type RangePreset, type SignalsDateFilter } from "@/lib/date-filter";
import { getCurrentSubscriber } from "@/lib/subscriber-auth";
import { getRuntimeReferralUrl } from "@/lib/utils";

export const revalidate = 60;

export default async function PublicDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ instrument?: string; range?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const range = RANGE_PRESETS.includes(params.range as RangePreset)
    ? (params.range as RangePreset)
    : "all";
  const initialFilter: SignalsDateFilter = {
    range,
    from: params.from ?? "",
    to: params.to ?? "",
  };

  const subscriber = await getCurrentSubscriber();
  const referralToken = subscriber?.invitationToken ?? null;
  const referralLink = getRuntimeReferralUrl(referralToken);

  const allSignals = await prisma.signal.findMany({ orderBy: { signalTime: "desc" } });
  const serializedSignals: SerializedSignal[] = allSignals.map((s) => ({
    id: s.id,
    strike: s.strike,
    optionType: s.optionType,
    instrument: s.instrument,
    stockSymbol: s.stockSymbol,
    entryPrice: s.entryPrice,
    sellPrice: s.sellPrice,
    pnlPercent: s.pnlPercent,
    status: s.status,
    signalTime: s.signalTime.toISOString(),
  }));

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto flex-1 w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold sm:text-4xl">
              <span className="signalflow-gold-text">Dashboard</span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Live performance analytics computed from every signal we&apos;ve published — no
              login required, same numbers our admin sees.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <InstrumentFilter />
            <RefreshButton />
          </div>
        </div>
        <DashboardView
          signals={serializedSignals}
          initialFilter={initialFilter}
          instrument={params.instrument}
          referralLink={referralLink}
          referralToken={referralToken}
        />
      </main>
      <Footer />
    </div>
  );
}
