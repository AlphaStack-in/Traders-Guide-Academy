import { prisma } from "@/lib/prisma";
import { type ManageSignalRow } from "@/components/admin/manage-signals-table";
import { OngoingSignals } from "@/components/signals/ongoing-signals";
import { RefreshButton } from "@/components/site/refresh-button";
import { AddSignalSection } from "@/components/admin/add-signal-section";
import { OngoingTradeNotes } from "@/components/admin/ongoing-trade-notes";
import {
  ManageSignalsFilteredTable,
  type RangePreset,
  type SignalsDateFilter,
} from "@/components/admin/manage-signals-filtered-table";
import { getAdminUpdatesForSignals } from "@/app/admin/(protected)/signals/actions";

export const dynamic = "force-dynamic";

const RANGE_PRESETS: RangePreset[] = ["all", "today", "week", "month", "custom"];

export default async function ManageSignalsPage({
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

  const signals = await prisma.signal.findMany({ orderBy: { signalTime: "desc" } });
  const allIds = signals.map((s) => s.id);
  const adminUpdatesMap = await getAdminUpdatesForSignals(allIds);

  const rows: ManageSignalRow[] = signals.map((s) => {
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
  const ongoingTrades = ongoing.map((r) => ({
    id: r.id,
    strike: r.strike,
    optionType: r.optionType,
    instrument: r.instrument,
    adminNote: r.adminNote,
    adminNoteAt: r.adminNoteAt,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold sm:text-3xl">Manage Signals</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {ongoing.length} open trade{ongoing.length === 1 ? "" : "s"} — closing one sends a
            Telegram update to the group.
          </p>
        </div>
        <RefreshButton />
      </div>
      <AddSignalSection defaultOpen={ongoing.length === 0} />
      <OngoingSignals
        signals={ongoing}
        editable
        collapsible
        defaultOpen={ongoing.length > 0}
      />
      <OngoingTradeNotes trades={ongoingTrades} />
      <div className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-bold">All Signals</h2>
        <ManageSignalsFilteredTable rows={rows} initialFilter={initialFilter} />
      </div>
    </div>
  );
}
