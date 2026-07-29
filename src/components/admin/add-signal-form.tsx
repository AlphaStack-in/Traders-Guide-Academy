"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SignalDraftEditor, type EditableDraft } from "@/components/admin/signal-draft-editor";
import { ManualSignalForm } from "@/components/admin/manual-signal-form";
import { parseSignalMessage } from "@/lib/parser";
import { nextWeeklyExpiry } from "@/lib/expiry";
import { createSignals, type SignalInput } from "@/app/admin/(protected)/signals/actions";

function toEditableDraft(index: number, raw: string): EditableDraft {
  const parsed = parseSignalMessage(raw)[index];
  return {
    key: `${Date.now()}-${index}`,
    strike: parsed.strike != null ? String(parsed.strike) : "",
    optionType: parsed.optionType ?? "CE",
    instrument: parsed.instrument,
    entryPrice: parsed.entryPrice != null ? String(parsed.entryPrice) : "",
    stopLoss: parsed.stopLoss != null ? String(parsed.stopLoss) : "",
    targets: parsed.targets.join(","),
    priceAtSignal: parsed.priceAtSignal != null ? String(parsed.priceAtSignal) : "",
    sellPrice: parsed.sellPrice != null ? String(parsed.sellPrice) : "",
    risk: "Medium",
    expiry: nextWeeklyExpiry(),
    rawMessage: parsed.rawMessage,
    warnings: parsed.warnings,
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
  };
}

export function AddSignalForm() {
  const [rawText, setRawText] = useState("");
  const [drafts, setDrafts] = useState<EditableDraft[]>([]);
  const [isPending, startTransition] = useTransition();

  function handleParse() {
    const parsedCount = parseSignalMessage(rawText).length;
    if (parsedCount === 0) {
      toast.error("Couldn't find any signal blocks in that text.");
      return;
    }
    const next = Array.from({ length: parsedCount }, (_, i) => toEditableDraft(i, rawText));
    setDrafts(next);
    toast.success(`Parsed ${parsedCount} signal${parsedCount === 1 ? "" : "s"} — review below.`);
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
        setRawText("");
      } else {
        toast.error(result.error ?? "Failed to save signals.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <h2 className="font-heading text-sm font-semibold text-muted-foreground">Smart Paste</h2>
          <Textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={"77300 ce\nAbove -150\nSL -145\nTrgt -170\nNow -145\nselling price 170"}
            className="min-h-[180px] font-mono text-sm"
          />
          <Button type="button" onClick={handleParse} className="thc-glow thc-btn-gradient w-fit">
            Parse
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
