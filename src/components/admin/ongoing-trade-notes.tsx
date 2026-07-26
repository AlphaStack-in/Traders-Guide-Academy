"use client";

import { useState, useTransition, type KeyboardEvent } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateAdminNote } from "@/app/admin/(protected)/signals/actions";
import { INSTRUMENT_LABEL, type InstrumentLiteral } from "@/lib/instruments";

const QUICK_PHRASES = [
  "READY",
  "HOLD",
  "ENTRY NOW",
  "EXIT NOW",
  "FIX SL COST TO COST",
  "TARGET HIT",
  "TRADE ENTERED",
  "JOIN LIVE",
  "WAIT FOR NEW ENTRY",
  "TRAIL SL TO %5",
  "RE-ENTRY",
  "NO PROFIT NO LOSS",
  "NO MOMENTUM",
  "GOING TO FLY",
  "ADD MORE LOTS",
  "SAFE TRADE",
  "RISK TRADE",
];

export interface OngoingTrade {
  id: string;
  strike: number;
  optionType: "CE" | "PE";
  instrument: InstrumentLiteral | null;
  adminNote: string | null;
}

function instrumentPrefix(trade: OngoingTrade) {
  return trade.instrument ? `${INSTRUMENT_LABEL[trade.instrument]} ` : "";
}

function NoteEditor({ trade }: { trade: OngoingTrade }) {
  const [note, setNote] = useState(trade.adminNote ?? "");
  const [isPending, startTransition] = useTransition();

  function appendPhrase(phrase: string) {
    setNote((prev) => (prev.trim() ? `${prev.trim()}\n${phrase}` : phrase));
  }

  function handleSend() {
    const trimmed = note.trim();
    if (trimmed === "") return;
    startTransition(async () => {
      const result = await updateAdminNote(trade.id, trimmed);
      if (result.success) {
        setNote("");
        toast.success(`Update posted for ${instrumentPrefix(trade)}${trade.strike} ${trade.optionType}.`);
      } else {
        toast.error(result.error ?? "Failed to save update.");
      }
    });
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="thc-glass rounded-xl border border-white/5 p-4">
      <p className="mb-2 text-sm font-medium">
        Update on{" "}
        <span className="font-heading font-bold thc-gold-text">
          {instrumentPrefix(trade)}{trade.strike} {trade.optionType}
        </span>
      </p>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {QUICK_PHRASES.map((phrase) => (
          <button
            key={phrase}
            type="button"
            onClick={() => appendPhrase(phrase)}
            className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            {phrase}
          </button>
        ))}
      </div>
      <div className="flex items-end gap-2">
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write an update for subscribers, or tap a phrase above…"
          className="min-h-[60px] text-sm"
        />
        <Button
          type="button"
          size="sm"
          className="thc-glow thc-btn-gradient h-9 shrink-0 px-3"
          disabled={isPending}
          onClick={handleSend}
          title="Send update (Enter)"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function OngoingTradeNotes({ trades }: { trades: OngoingTrade[] }) {
  if (trades.length === 0) {
    return (
      <div className="border-t border-white/5 pt-6">
        <h2 className="font-heading text-sm font-semibold text-muted-foreground">
          Update Subscribers on Ongoing Trades
        </h2>
        <p className="mt-2 text-xs text-muted-foreground">
          No open trades right now — updates will appear here once a signal goes live.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 border-t border-white/5 pt-6">
      <h2 className="font-heading text-sm font-semibold text-muted-foreground">
        Update Subscribers on Ongoing Trade{trades.length === 1 ? "" : "s"}
      </h2>
      <div className="flex flex-col gap-4">
        {trades.map((trade) => (
          <NoteEditor key={trade.id} trade={trade} />
        ))}
      </div>
    </div>
  );
}
