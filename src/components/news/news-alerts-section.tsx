"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, Globe, Newspaper, Zap, ExternalLink, ChevronDown, ChevronUp, ShieldAlert, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface NewsAlertItem {
  id: string;
  title: string;
  category: string;
  severity: "INFO" | "IMPORTANT" | "WARNING" | "BREAKING" | string;
  summary: string;
  content: string;
  impact?: string | null;
  affectedInstruments?: string[];
  source?: string | null;
  sourceUrl?: string | null;
  publishedAt: string;
  isBreaking?: boolean;
}

export function NewsAlertsSection() {
  const [alerts, setAlerts] = useState<NewsAlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNews() {
      try {
        const res = await fetch("/api/news");
        if (res.ok) {
          const data = await res.json();
          setAlerts(data);
          // Auto-expand breaking news
          const breaking = data.find((n: NewsAlertItem) => n.isBreaking || n.severity === "BREAKING");
          if (breaking) {
            setExpandedId(breaking.id);
          }
        }
      } catch (err) {
        console.error("Failed to load news alerts:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchNews();
  }, []);

  function getSeverityBadge(severity: string, isBreaking?: boolean) {
    if (isBreaking || severity === "BREAKING") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
          <Zap className="h-3 w-3 fill-rose-400" />
          BREAKING NEWS
        </span>
      );
    }
    if (severity === "WARNING") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
          <AlertTriangle className="h-3 w-3" />
          RISK ALERT
        </span>
      );
    }
    if (severity === "IMPORTANT") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
          <ShieldAlert className="h-3 w-3" />
          IMPORTANT
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wider bg-white/10 text-muted-foreground border border-white/10">
        <Globe className="h-3 w-3" />
        MARKET INFO
      </span>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0d0e14]/80 p-5 flex flex-col gap-3 backdrop-blur-md animate-pulse">
        <div className="h-5 w-48 bg-white/10 rounded-md" />
        <div className="h-16 w-full bg-white/5 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d0e14]/90 p-5 flex flex-col gap-4 backdrop-blur-md shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Newspaper className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground tracking-wide flex items-center gap-2">
              SignalFlow News & Market Alerts
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Real-time global macro, regulatory & volatility intelligence
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {alerts.map((item) => {
          const isExpanded = expandedId === item.id;
          return (
            <div
              key={item.id}
              className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                item.isBreaking || item.severity === "BREAKING"
                  ? "border-rose-500/30 bg-rose-950/20 hover:border-rose-500/50"
                  : "border-white/10 bg-white/[0.03] hover:border-white/20"
              }`}
            >
              <div
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                className="p-4 cursor-pointer flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {getSeverityBadge(item.severity, item.isBreaking)}
                    <span className="text-[11px] font-medium text-muted-foreground bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                      {item.category}
                    </span>
                    {item.source && (
                      <span className="text-[11px] text-muted-foreground/70">
                        via {item.source}
                      </span>
                    )}
                  </div>
                  <button type="button" className="text-muted-foreground hover:text-foreground shrink-0 p-1">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>

                <h4 className="text-sm font-bold text-foreground leading-snug">
                  {item.title}
                </h4>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.summary}
                </p>

                {item.affectedInstruments && item.affectedInstruments.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                      Affected Markets:
                    </span>
                    {item.affectedInstruments.map((inst) => (
                      <span
                        key={inst}
                        className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold border border-primary/20"
                      >
                        {inst}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Collapsible Full Content */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-white/10 bg-black/30 flex flex-col gap-3">
                  <div className="text-xs text-foreground/90 whitespace-pre-line leading-relaxed font-sans">
                    {item.content}
                  </div>

                  {item.impact && (
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 text-xs text-amber-300 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span><strong>Impact Assessment:</strong> {item.impact}</span>
                    </div>
                  )}

                  {item.sourceUrl && (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline w-fit mt-1"
                    >
                      <span>Read official source document</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
