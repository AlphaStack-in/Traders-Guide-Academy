import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { SignalsExplorer } from "@/components/signals/signals-explorer";
import { OngoingSignals } from "@/components/signals/ongoing-signals";
import { SoundAlertToggle } from "@/components/signals/sound-alert-toggle";
import { RefreshButton } from "@/components/site/refresh-button";
import { prisma } from "@/lib/prisma";
import { getAdminUpdatesForSignals } from "@/app/admin/(protected)/signals/actions";
import type { SignalRow } from "@/components/signals/signals-explorer";
import {
  RANGE_PRESETS,
  type RangePreset,
  type SignalsDateFilter,
} from "@/lib/date-filter";

async function getSignals() {
  return prisma.signal.findMany({ orderBy: { signalTime: "desc" } });
}

export default async function SignalsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
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

  const signals = await getSignals();
  const allIds = signals.map((s) => s.id);
  const adminUpdatesMap = await getAdminUpdatesForSignals(allIds);
  const rows: SignalRow[] = signals.map((s) => {
    const updates = adminUpdatesMap[s.id] ?? [];
    return {
      id: s.id,
      strike: s.strike,
      optionType: s.optionType,
      instrument: s.instrument,
      entryPrice: s.entryPrice,
      stopLoss: s.stopLoss,
      targets: s.targets,
      sellPrice: s.sellPrice,
      pnlPercent: s.pnlPercent,
      status: s.status,
      signalTime: s.signalTime.toISOString(),
      adminNote: s.adminNote,
      adminNoteAt: updates[0]?.createdAt ?? null,
      adminUpdates: updates,
    };
  });
  const ongoing = rows.filter((r) => r.status === "OPEN");

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto flex-1 w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold sm:text-4xl">
              Trade <span className="thc-gold-text">Log</span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Every intraday options-buying call we&apos;ve published — transparent, unedited
              track record.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <RefreshButton />
            <SoundAlertToggle />
          </div>
        </div>
        <OngoingSignals signals={ongoing} />
        <SignalsExplorer signals={rows} initialFilter={initialFilter} />
      </main>
      <Footer />
    </div>
  );
}
