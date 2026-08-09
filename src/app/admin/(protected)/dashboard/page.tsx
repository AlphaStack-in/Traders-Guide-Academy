import { prisma } from "@/lib/prisma";
import { DashboardView, type SerializedSignal } from "@/components/dashboard/dashboard-view";
import { InstrumentFilter } from "@/components/dashboard/instrument-filter";
import { RefreshButton } from "@/components/site/refresh-button";
import { RANGE_PRESETS, type RangePreset, type SignalsDateFilter } from "@/lib/date-filter";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({
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

  const allSignals = await prisma.signal.findMany({ orderBy: { signalTime: "asc" } });
  const serializedSignals: SerializedSignal[] = allSignals.map((s) => ({
    id: s.id,
    strike: s.strike,
    optionType: s.optionType,
    instrument: s.instrument,
    pnlPercent: s.pnlPercent,
    status: s.status,
    signalTime: s.signalTime.toISOString(),
  }));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold sm:text-3xl">Performance Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live analytics computed from every signal in the database.
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
      />
    </div>
  );
}
