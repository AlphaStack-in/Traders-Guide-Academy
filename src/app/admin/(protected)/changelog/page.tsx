import { getBuildInfo } from "@/lib/build-info";
import { CheckCircle2, GitCommit, History, Server, ShieldCheck, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default function AdminChangelogPage() {
  const buildInfo = getBuildInfo();
  const currentSha = buildInfo.gitSha;

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto py-2">
      {/* Header & Active Build Banner */}
      <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold sm:text-3xl flex items-center gap-2.5">
            <History className="h-7 w-7 text-primary" />
            <span>Platform <span className="thc-gold-text">Changelog</span></span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete chronological deployment audit log &amp; revision history for SignalFlow.
          </p>
        </div>

        {/* Current Deployed Build Card */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 flex items-center gap-3 backdrop-blur-md shadow-lg shrink-0">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                ACTIVE BUILD
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                ✓ Currently Deployed
              </span>
            </div>
            <span className="font-mono text-xs font-bold text-foreground mt-0.5">
              v{buildInfo.version} · {buildInfo.gitSha}
            </span>
          </div>
        </div>
      </div>

      {/* Changelog Timeline */}
      <div className="flex flex-col gap-6">
        {buildInfo.changelog.map((entry, index) => {
          const isCurrent = entry.sha === currentSha || (index === 0 && !buildInfo.changelog.some(c => c.sha === currentSha));

          return (
            <div
              key={entry.sha}
              className={`relative rounded-2xl border p-5 transition-all duration-200 ${
                isCurrent
                  ? "border-emerald-500/40 bg-emerald-950/10 shadow-xl"
                  : "border-white/10 bg-[#0d0e14]/80 hover:border-white/20"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3 mb-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-bold font-mono">
                    v{entry.version}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-mono font-semibold text-muted-foreground bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                    <GitCommit className="h-3.5 w-3.5 text-primary" />
                    {entry.sha}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {entry.date}
                  </span>
                </div>

                {isCurrent && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-emerald-400 bg-emerald-500/20 border border-emerald-500/40 animate-pulse w-fit">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Currently Deployed
                  </span>
                )}
              </div>

              <h3 className="text-base font-bold text-foreground leading-snug mb-3">
                {entry.title}
              </h3>

              <ul className="flex flex-col gap-2 pl-2 text-xs text-muted-foreground">
                {entry.highlights.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-primary font-bold shrink-0">•</span>
                    <span className="text-foreground/90">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
