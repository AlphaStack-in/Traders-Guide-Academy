"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SignalDraftEditor, type EditableDraft } from "@/components/admin/signal-draft-editor";
import { ManualSignalForm } from "@/components/admin/manual-signal-form";
import { parseSignalMessage, type CustomerType } from "@/lib/parser";
import { nextWeeklyExpiry } from "@/lib/expiry";
import { createSignals, type SignalInput } from "@/app/admin/(protected)/signals/actions";

const SMART_PASTE_TEMPLATE = "\nAbove -\nSL -\nTarget -\nNow -\nselling price ";

function toEditableDraft(index: number, raw: string, customer?: string): EditableDraft {
  const parsedList = parseSignalMessage(raw, customer);
  const parsed = parsedList[index] || parsedList[0];

  return {
    key: `${Date.now()}-${index}`,
    strike: parsed.strike != null ? String(parsed.strike) : "",
    optionType: parsed.optionType ?? "CE",
    instrument: parsed.mappedInstrument || parsed.instrument || "NIFTY",
    entryPrice: parsed.entryPrice != null ? String(parsed.entryPrice) : "",
    entryLow: parsed.entryLow != null ? String(parsed.entryLow) : undefined,
    entryHigh: parsed.entryHigh != null ? String(parsed.entryHigh) : undefined,
    stopLoss: parsed.stopLoss != null ? String(parsed.stopLoss) : "",
    targets: parsed.targets && parsed.targets.length > 0 ? parsed.targets.join(",") : parsed.target1 ? String(parsed.target1) : "",
    priceAtSignal: parsed.priceAtSignal != null ? String(parsed.priceAtSignal) : parsed.cmp != null ? String(parsed.cmp) : parsed.entryPrice != null ? String(parsed.entryPrice) : "",
    sellPrice: parsed.sellPrice != null ? String(parsed.sellPrice) : "",
    risk: "Medium",
    expiry: nextWeeklyExpiry(),
    rawMessage: parsed.rawMessage,
    warnings: parsed.warnings || [],
    contextTags: parsed.context || [],
    confidence: parsed.confidence || "HIGH",
    parserName: parsed.parserName || (customer as CustomerType) || "THC",
  };
}

function draftToInput(draft: EditableDraft): SignalInput | null {
  const strike = parseInt(draft.strike, 10);
  const entryPrice = parseFloat(draft.entryPrice);
  const stopLoss = parseFloat(draft.stopLoss);
  const priceAtSignal = parseFloat(draft.priceAtSignal);
  const targets = draft.targets
    .split(",")
    .map((t) => parseFloat(t.trim()))
    .filter((t) => Number.isFinite(t));
  const sellPrice = draft.sellPrice.trim() === "" ? null : parseFloat(draft.sellPrice);

  if (
    !Number.isFinite(strike) ||
    !Number.isFinite(entryPrice) ||
    !Number.isFinite(stopLoss) ||
    !Number.isFinite(priceAtSignal) ||
    targets.length === 0 ||
    !draft.expiry
  ) {
    return null;
  }

  return {
    strike,
    optionType: draft.optionType,
    instrument: draft.instrument,
    entryPrice,
    stopLoss,
    targets,
    priceAtSignal,
    sellPrice: sellPrice != null && Number.isFinite(sellPrice) ? sellPrice : null,
    rawMessage: draft.rawMessage,
    expiry: draft.expiry,
    chartImageUrl: draft.chartImageUrl,
    entryLow: draft.entryLow ? parseFloat(draft.entryLow) : null,
    entryHigh: draft.entryHigh ? parseFloat(draft.entryHigh) : null,
    target1: targets[0] ?? null,
    target2: targets[1] ?? null,
    contextTags: draft.contextTags,
    confidence: draft.confidence,
    parserName: draft.parserName,
  };
}

export function AddSignalForm() {
  const [rawText, setRawText] = useState(SMART_PASTE_TEMPLATE);
  const [customer, setCustomer] = useState<string>("AUTO");
  const [drafts, setDrafts] = useState<EditableDraft[]>([]);
  const [isPending, startTransition] = useTransition();

  function handleParse() {
    if (rawText.trim() === "") {
      toast.error("Paste a signal first.");
      return;
    }

    if (rawText === SMART_PASTE_TEMPLATE) {
      toast.error("Fill in the values next to each label first.");
      return;
    }

    const parsedResults = parseSignalMessage(rawText, customer === "AUTO" ? undefined : customer);
    const parsedCount = parsedResults.length;
    if (parsedCount === 0) {
      toast.error("Couldn't find any signal blocks in that text.");
      return;
    }
    const next = Array.from({ length: parsedCount }, (_, i) =>
      toEditableDraft(i, rawText, customer === "AUTO" ? undefined : customer)
    );
    setDrafts(next);
    toast.success(`Parsed ${parsedCount} signal${parsedCount === 1 ? "" : "s"} (${parsedResults[0].parserName || "THC"}) — review below.`);
  }

  function handleSaveAll() {
    const inputs = drafts.map(draftToInput);
    if (inputs.some((i) => i === null)) {
      toast.error("Fix the highlighted fields before saving — some values are missing.");
      return;
    }

    startTransition(async () => {
      const result = await createSignals(inputs as SignalInput[]);
      if (result.success) {
        toast.success("Signals saved.");
        setDrafts([]);
        setRawText(SMART_PASTE_TEMPLATE);
      } else {
        toast.error(result.error ?? "Failed to save signals.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-sm font-semibold text-muted-foreground">
              Signal Processing Engine & Smart Paste
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Customer Parser:</span>
              <Select value={customer} onValueChange={setCustomer}>
                <SelectTrigger className="h-8 w-36 text-xs bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AUTO">Auto Detect</SelectItem>
                  <SelectItem value="GOODWILL">Goodwill Parser</SelectItem>
                  <SelectItem value="THC">THC Parser</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste signal text (THC or Goodwill format)..."
            className="min-h-[180px] font-mono text-sm bg-black/40 border-white/10"
          />
          <Button type="button" onClick={handleParse} className="thc-glow thc-btn-gradient w-fit">
            Parse Signal
          </Button>

          {drafts.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4">
                {drafts.map((draft, i) => (
                  <SignalDraftEditor
                    key={draft.key}
                    draft={draft}
                    onChange={(next) =>
                      setDrafts((prev) => prev.map((d, idx) => (idx === i ? next : d)))
                    }
                    onRemove={() => setDrafts((prev) => prev.filter((_, idx) => idx !== i))}
                  />
                ))}
              </div>
              <Button
                type="button"
                onClick={handleSaveAll}
                disabled={isPending}
                className="thc-glow thc-btn-gradient w-fit"
              >
                {isPending ? "Saving…" : `Save ${drafts.length} Signal${drafts.length === 1 ? "" : "s"}`}
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 border-t border-white/5 pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
          <h2 className="font-heading text-sm font-semibold text-muted-foreground">Manual Entry</h2>
          <ManualSignalForm />
        </div>
      </div>
    </div>
  );
}

