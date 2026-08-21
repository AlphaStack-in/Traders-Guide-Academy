"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { repeatForMarquee } from "@/lib/marquee";

interface IndexQuote {
  label: string;
  price: number;
  change: number;
  changePercent: number;
}

const CARD_WIDTH_PX = 190;
const POLL_INTERVAL_MS = 30_000;

export function IndexTicker() {
  const [quotes, setQuotes] = useState<IndexQuote[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/indices");
        const data = await res.json();
        if (!cancelled && Array.isArray(data.quotes)) {
          setQuotes(data.quotes);
        }
      } catch {
        // Silently keep showing the last known quotes on a failed poll.
      }
    }

    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (quotes.length === 0) return null;

  const repeated = repeatForMarquee(quotes, CARD_WIDTH_PX);
  const items = [...repeated, ...repeated];

  return (
    <div
      className="relative overflow-hidden border-b border-white/5 bg-black/20 py-1.5"
      style={{
        maskImage: "linear-gradient(90deg, transparent, black 5%, black 95%, transparent)",
      }}
    >
      <div
        className="signalflow-marquee-track flex w-max"
        style={{ ["--signalflow-marquee-duration" as string]: "80s" }}
      >
        {items.map((q, i) => {
          const isUp = q.change >= 0;
          return (
            <div
              key={`${q.label}-${i}`}
              className="mr-6 flex shrink-0 items-baseline gap-2 text-xs"
            >
              <span className="font-heading font-semibold text-foreground">{q.label}</span>
              <span className="font-medium text-muted-foreground">
                {q.price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </span>
              <span
                className={cn(
                  "font-medium",
                  isUp ? "text-[var(--signalflow-win)]" : "text-[var(--signalflow-loss)]",
                )}
              >
                {isUp ? "▲" : "▼"} {Math.abs(q.change).toFixed(2)} (
                {Math.abs(q.changePercent).toFixed(2)}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
