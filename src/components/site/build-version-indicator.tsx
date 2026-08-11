"use client";

import React, { useState } from "react";
import { GitCommit, CheckCircle2, Server } from "lucide-react";
import { getBuildInfo, type BuildInfo } from "@/lib/build-info";

interface BuildVersionIndicatorProps {
  className?: string;
  buildInfo?: BuildInfo;
}

export function BuildVersionIndicator({ className = "", buildInfo: initialInfo }: BuildVersionIndicatorProps) {
  const [open, setOpen] = useState(false);
  const info = initialInfo || getBuildInfo();
  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className={`relative inline-flex items-center text-xs text-muted-foreground/70 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="group inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/10 hover:text-foreground transition-all duration-200 cursor-pointer outline-none"
        title="Click for build & release metadata"
      >
        <GitCommit className="h-3 w-3 text-primary/80 group-hover:text-primary transition-colors" />
        <span className="font-mono text-[11px] font-medium tracking-tight">
          v{info.version} · {info.gitSha}
        </span>
      </button>

      {/* Popover Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:absolute sm:inset-auto sm:bottom-full sm:left-0 sm:mb-2 sm:p-0"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-76 rounded-2xl border border-white/10 bg-[#0d0e14]/95 p-4 shadow-2xl backdrop-blur-md flex flex-col gap-3 font-sans text-xs text-foreground"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <span className="font-bold tracking-wide flex items-center gap-1.5 text-foreground text-xs">
                <Server className="h-3.5 w-3.5 text-primary" />
                {info.application || "SignalFlow"} Deployment
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-3 w-3" />
                {isDev ? "Dev" : "Production"}
              </span>
            </div>

            <div className="flex flex-col gap-2 font-mono text-[11px]">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Application:</span>
                <span className="text-foreground font-semibold">{info.application || "SignalFlow"}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Version:</span>
                <span className="text-primary font-bold">v{info.version}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Git Commit SHA:</span>
                <span className="text-primary font-bold">{info.gitSha}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Build Timestamp:</span>
                <span className="text-foreground/90">{info.formattedBuildTime}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Environment:</span>
                <span className="text-emerald-400 font-semibold">{isDev ? "Development" : "Production"}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Authoritative build revision</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="hover:text-foreground font-medium underline"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
