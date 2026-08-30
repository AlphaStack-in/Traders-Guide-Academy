import { getBuildInfo } from "@/lib/build-info";
import { CHANGELOG } from "@/lib/changelog";
import { History, ShieldCheck } from "lucide-react";
import { ChangelogTimeline } from "@/components/admin/changelog-timeline";
import {
  RANGE_PRESETS,
  type RangePreset,
  type SignalsDateFilter,
} from "@/lib/date-filter";

// Changelog entries are static (committed source data) — build metadata
// (SHA, timestamp) are baked into the bundle by next.config.ts, no runtime
// fetch needed. Reading `searchParams` (for the initial filter, so the range
// is shareable/refresh-safe via the URL) makes this route render dynamically
// per request; the actual filtering of CHANGELOG happens client-side in
// ChangelogTimeline, not here — it's a small already-in-memory array, so
// there's no need for a server round-trip just to filter it.
export default async function AdminChangelogPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const buildInfo = getBuildInfo();
  // "Currently Deployed" is determined by the application version, not by Git
  // SHA. Multiple changelog entries can share a version (iterative patches
  // released under the same version string), but only the FIRST matching
  // entry at the top of the list is marked as currently deployed —
  // ChangelogTimeline re-derives this itself from currentVersion.
  const currentVersion = buildInfo.version;

  const params = await searchParams;
  const range = RANGE_PRESETS.includes(params.range as RangePreset)
    ? (params.range as RangePreset)
    : "all";
  const initialFilter: SignalsDateFilter = {
    range,
    from: params.from ?? "",
    to: params.to ?? "",
  };

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto py-2">
      {/* Header & Active Build Banner */}
      <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold sm:text-3xl flex items-center gap-2.5">
            <History className="h-7 w-7 text-primary" />
            <span>Platform <span className="signalflow-gold-text">Changelog</span></span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete chronological deployment audit log &amp; revision history for SignalFlow.
          </p>
          <a
            href="/tech-debt-ledger.html"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex w-fit items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Tech debts &#8599;
          </a>
        </div>

        {/* Current Deployed Build Card */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 flex items-center gap-3.5 backdrop-blur-md shadow-lg shrink-0">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                ACTIVE BUILD
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                ✓ Currently Deployed
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-foreground">
                v{buildInfo.version}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                · {buildInfo.gitSha}
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground">
              {buildInfo.formattedBuildTime}
            </span>
          </div>
        </div>
      </div>

      {/* Changelog Timeline */}
      <ChangelogTimeline
        entries={CHANGELOG}
        currentVersion={currentVersion}
        initialFilter={initialFilter}
      />
    </div>
  );
}
