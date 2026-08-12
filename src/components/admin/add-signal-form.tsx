"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ManualSignalForm, type ManualFormValues } from "@/components/admin/manual-signal-form";
import { parseSignalMessage, type ParsedSignalDraft } from "@/lib/parser";
import { nextWeeklyExpiry } from "@/lib/expiry";
import { Sparkles, ArrowDown, CheckCircle2, AlertTriangle, ShieldCheck, Zap } from "lucide-react";
import { INSTRUMENTS, type InstrumentLiteral } from "@/lib/instruments";

const SAMPLE_SIGNAL_TEMPLATE = "NIFTY 24450 PE BUY ABOVE 15 SL 1 TARGETS 155,170";

export function AddSignalForm() {
  const [rawText, setRawText] = useState("");
  const [parsedResults, setParsedResults] = useState<ParsedSignalDraft[] | null>(null);
  const [prefilledManualForm, setPrefilledManualForm] = useState<Partial<ManualFormValues> | null>(null);

  function handleParse() {
    if (rawText.trim() === "") {
      toast.error("Paste or type a signal first.");
      return;
    }

    // Automatic Customer / Parser Resolution
    const results = parseSignalMessage(rawText);
    if (results.length === 0) {
      toast.error("Couldn't parse any signal from that text.");
      setParsedResults(null);
      return;
    }

    setParsedResults(results);
    toast.success(`Successfully parsed ${results.length} signal${results.length === 1 ? "" : "s"} (${results[0].parserName || "THC"}).`);
  }

  function handleUseParsedData(parsed: ParsedSignalDraft) {
    // Map parsed result into ManualFormValues
    const rawInst = (parsed.mappedInstrument || parsed.instrument || "NIFTY").toUpperCase();
    const mappedInst = rawInst === "BANKNIFTY" ? "BANK_NIFTY" : rawInst === "MIDCPNIFTY" || rawInst === "MIDCAPNIFTY" ? "MIDCAP_NIFTY" : rawInst as InstrumentLiteral;
    const isKnownInstrument = INSTRUMENTS.includes(mappedInst);

    const prefilled: Partial<ManualFormValues> = {
      strike: parsed.strike != null ? String(parsed.strike) : "",
      optionType: parsed.optionType ?? "CE",
      instrument: isKnownInstrument ? mappedInst : "NIFTY",
      entryPrice: parsed.entryPrice != null ? String(parsed.entryPrice) : "",
      stopLoss: parsed.stopLoss != null ? String(parsed.stopLoss) : "",
      targets: parsed.targets && parsed.targets.length > 0
        ? parsed.targets.join(",")
        : parsed.target1 != null
        ? String(parsed.target1)
        : "",
      priceAtSignal: parsed.priceAtSignal != null ? String(parsed.priceAtSignal) : parsed.cmp != null ? String(parsed.cmp) : parsed.entryPrice != null ? String(parsed.entryPrice) : "",
      sellPrice: parsed.sellPrice != null ? String(parsed.sellPrice) : "",
      risk: "Medium",
      expiry: nextWeeklyExpiry(),
    };

    setPrefilledManualForm(prefilled);
    toast.success("Parsed data transferred into Manual Signal Entry below.");

    // Scroll to Manual Signal Entry section
    const manualSection = document.getElementById("manual-signal-entry-section");
    if (manualSection) {
      manualSection.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* 1. PARSE SIGNAL SECTION */}
      <div className="rounded-2xl border border-white/10 bg-[#0d0e14]/80 p-5 sm:p-6 backdrop-blur-md shadow-xl flex flex-col gap-5">
        <div className="flex items-center gap-2.5 border-b border-white/10 pb-4">
          <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-bold text-foreground tracking-tight">PARSE SIGNAL</h2>
            <p className="text-xs text-muted-foreground">
              Paste raw signal text to auto-extract trade values &amp; confidence rating.
            </p>
          </div>
        </div>

        {/* Clean Textarea with Header Row and Insert Sample Signal on Right */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-muted-foreground">Paste raw signal message</label>
            <button
              type="button"
              onClick={() => setRawText(SAMPLE_SIGNAL_TEMPLATE)}
              className="text-xs text-primary/90 hover:text-primary underline font-medium cursor-pointer transition-colors"
            >
              Insert Sample Signal
            </button>
          </div>
          <Textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste raw signal message..."
            className="min-h-[90px] font-mono text-sm bg-black/40 border-white/10 focus:border-primary/50"
          />
        </div>

        {/* LEFT-ALIGNED [ Parse Signal ] Button */}
        <div className="flex justify-start">
          <Button
            type="button"
            onClick={handleParse}
            className="thc-glow thc-btn-gradient gap-2 px-6 h-9 font-semibold justify-start"
          >
            <Sparkles className="h-4 w-4" />
            Parse Signal
          </Button>
        </div>

        {/* PARSED RESULT / CONFIDENCE BOX */}
        {parsedResults && parsedResults.length > 0 && (
          <div className="mt-2 flex flex-col gap-4 border-t border-white/10 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Parsed result / confidence
            </h3>

            {parsedResults.map((parsed, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-white/10 bg-black/50 p-4 flex flex-col gap-3"
              >
                {/* Badges row */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-foreground">
                      {parsed.mappedInstrument || parsed.instrument} {parsed.strike} {parsed.optionType}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-primary/20 text-primary border border-primary/30">
                      Parser: {parsed.parserName || "THC"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Confidence:</span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                        parsed.confidence === "HIGH"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : parsed.confidence === "MEDIUM"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      }`}
                    >
                      {parsed.confidence || "HIGH"}
                    </span>
                  </div>
                </div>

                {/* Parsed Fields Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs text-muted-foreground pt-1 border-t border-white/5">
                  <div>
                    <span className="text-[10px] text-muted-foreground/70 block uppercase">Entry</span>
                    <span className="font-semibold text-foreground">₹{parsed.entryPrice ?? "-"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground/70 block uppercase">Stop Loss</span>
                    <span className="font-semibold text-rose-400">₹{parsed.stopLoss ?? "-"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground/70 block uppercase">Target(s)</span>
                    <span className="font-semibold text-emerald-400">
                      {parsed.targets && parsed.targets.length > 0 ? parsed.targets.join(", ") : parsed.target1 ?? "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground/70 block uppercase">CMP</span>
                    <span className="font-semibold text-foreground">₹{parsed.cmp ?? parsed.priceAtSignal ?? parsed.entryPrice ?? "-"}</span>
                  </div>
                </div>

                {/* Genuine Warnings if any */}
                {parsed.warnings && parsed.warnings.length > 0 && (
                  <div className="flex items-start gap-1.5 text-xs text-amber-400/90 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{parsed.warnings.join("; ")}</span>
                  </div>
                )}

                {/* LEFT-ALIGNED [ Use Parsed Data ↓ ] Button */}
                <div className="pt-2 flex justify-start">
                  <Button
                    type="button"
                    onClick={() => handleUseParsedData(parsed)}
                    variant="outline"
                    className="gap-2 border-primary/40 text-primary hover:bg-primary/10 text-xs font-semibold justify-start"
                  >
                    Use Parsed Data ↓
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. MANUAL SIGNAL ENTRY SECTION */}
      <div
        id="manual-signal-entry-section"
        className="rounded-2xl border border-white/10 bg-[#0d0e14]/80 p-5 sm:p-6 backdrop-blur-md shadow-xl flex flex-col gap-5"
      >
        <div className="flex items-center gap-2.5 border-b border-white/10 pb-4">
          <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-bold text-foreground tracking-tight">MANUAL SIGNAL ENTRY</h2>
            <p className="text-xs text-muted-foreground">
              Directly input or review parsed trade parameters before persisting to database.
            </p>
          </div>
        </div>

        <ManualSignalForm prefilledValues={prefilledManualForm} />
      </div>
    </div>
  );
}
