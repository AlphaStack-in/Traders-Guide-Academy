"use client";

import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createSignals, type SignalInput } from "@/app/admin/(protected)/signals/actions";
import { INSTRUMENTS, INSTRUMENT_LABEL, type InstrumentLiteral } from "@/lib/instruments";
import { nextWeeklyExpiry } from "@/lib/expiry";
import { ChartImageUploader } from "@/components/signals/chart-image-uploader";

export interface ManualFormValues {
  strike: string;
  optionType: "CE" | "PE";
  instrument: InstrumentLiteral;
  entryPrice: string;
  stopLoss: string;
  targets: string;
  priceAtSignal: string;
  sellPrice: string;
  risk: "Low" | "Medium" | "High";
  expiry: string;
  chartImageUrl: string | null;
}

function emptyForm(): ManualFormValues {
  return {
    strike: "",
    optionType: "CE",
    instrument: "NIFTY",
    entryPrice: "",
    stopLoss: "",
    targets: "",
    priceAtSignal: "",
    sellPrice: "",
    risk: "Medium",
    expiry: nextWeeklyExpiry(),
    chartImageUrl: null,
  };
}

interface ManualSignalFormProps {
  prefilledValues?: Partial<ManualFormValues> | null;
  onSaved?: () => void;
}

export function ManualSignalForm({ prefilledValues, onSaved }: ManualSignalFormProps) {
  const [form, setForm] = useState<ManualFormValues>(emptyForm);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (prefilledValues) {
      setForm((prev) => ({
        ...prev,
        ...prefilledValues,
        expiry: prefilledValues.expiry || prev.expiry || nextWeeklyExpiry(),
      }));
    }
  }, [prefilledValues]);

  function set<K extends keyof ManualFormValues>(key: K, value: ManualFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const strike = parseInt(form.strike, 10);
    const entryPrice = parseFloat(form.entryPrice);
    const stopLoss = parseFloat(form.stopLoss);
    const priceAtSignalVal = form.priceAtSignal.trim() !== "" ? parseFloat(form.priceAtSignal) : entryPrice;
    const targets = form.targets
      .split(",")
      .map((t) => parseFloat(t.trim()))
      .filter((t) => Number.isFinite(t));
    const sellPrice = form.sellPrice.trim() === "" ? null : parseFloat(form.sellPrice);

    if (
      !Number.isFinite(strike) ||
      !Number.isFinite(entryPrice) ||
      !Number.isFinite(stopLoss) ||
      !Number.isFinite(priceAtSignalVal) ||
      targets.length === 0 ||
      !form.expiry
    ) {
      toast.error("Please fill in strike, entry price, stop loss, target(s), and expiry date.");
      return;
    }

    const input: SignalInput = {
      strike,
      optionType: form.optionType,
      instrument: form.instrument,
      entryPrice,
      stopLoss,
      targets,
      priceAtSignal: priceAtSignalVal,
      sellPrice: sellPrice != null && Number.isFinite(sellPrice) ? sellPrice : null,
      rawMessage: `Manual entry: ${form.instrument} ${strike} ${form.optionType}`,
      expiry: form.expiry,
      chartImageUrl: form.chartImageUrl,
      target1: targets[0] ?? null,
      target2: targets[1] ?? null,
    };

    startTransition(async () => {
      const result = await createSignals([input]);
      if (result.success) {
        toast.success("Signal saved successfully.");
        setForm(emptyForm());
        onSaved?.();
      } else {
        toast.error(result.error ?? "Failed to save signal.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Row 1: Strike | Type | Instrument (Compact 3 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <div className="flex flex-col gap-1">
          <Label className="text-xs font-semibold text-muted-foreground">Strike</Label>
          <Input
            value={form.strike}
            onChange={(e) => set("strike", e.target.value)}
            placeholder="24450"
            className="h-9 bg-black/40 border-white/10 text-xs sm:text-sm"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs font-semibold text-muted-foreground">Type</Label>
          <Select value={form.optionType} onValueChange={(v) => set("optionType", v as "CE" | "PE")}>
            <SelectTrigger className="h-9 bg-black/40 border-white/10 text-xs sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CE">CE (Call)</SelectItem>
              <SelectItem value="PE">PE (Put)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs font-semibold text-muted-foreground">Instrument</Label>
          <Select
            value={form.instrument}
            onValueChange={(v) => set("instrument", v as InstrumentLiteral)}
          >
            <SelectTrigger className="h-9 bg-black/40 border-white/10 text-xs sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INSTRUMENTS.map((i) => (
                <SelectItem key={i} value={i}>
                  {INSTRUMENT_LABEL[i]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 2: Entry Price | Stop Loss | Target(s) (Compact 3 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <div className="flex flex-col gap-1">
          <Label className="text-xs font-semibold text-muted-foreground">Entry Price</Label>
          <Input
            value={form.entryPrice}
            onChange={(e) => set("entryPrice", e.target.value)}
            placeholder="15"
            className="h-9 bg-black/40 border-white/10 text-xs sm:text-sm"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs font-semibold text-muted-foreground">Stop Loss</Label>
          <Input
            value={form.stopLoss}
            onChange={(e) => set("stopLoss", e.target.value)}
            placeholder="1"
            className="h-9 bg-black/40 border-white/10 text-xs sm:text-sm"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs font-semibold text-muted-foreground">Target(s)</Label>
          <Input
            value={form.targets}
            onChange={(e) => set("targets", e.target.value)}
            placeholder="155,170"
            className="h-9 bg-black/40 border-white/10 text-xs sm:text-sm"
            required
          />
        </div>
      </div>

      {/* Row 3: Current Price | Sell Price (Compact 2 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <div className="flex flex-col gap-1">
          <Label className="text-xs font-semibold text-muted-foreground">Current Price (CMP)</Label>
          <Input
            value={form.priceAtSignal}
            onChange={(e) => set("priceAtSignal", e.target.value)}
            placeholder="15 (or leave same as entry)"
            className="h-9 bg-black/40 border-white/10 text-xs sm:text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs font-semibold text-muted-foreground">Sell Price (Optional)</Label>
          <Input
            value={form.sellPrice}
            onChange={(e) => set("sellPrice", e.target.value)}
            placeholder="Leave empty for ongoing trade"
            className="h-9 bg-black/40 border-white/10 text-xs sm:text-sm"
          />
        </div>
      </div>

      {/* Row 4: Expiry Date | Risk Rating (Compact 2 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <div className="flex flex-col gap-1">
          <Label className="text-xs font-semibold text-muted-foreground">Expiry Date</Label>
          <Input
            type="date"
            value={form.expiry}
            onChange={(e) => set("expiry", e.target.value)}
            className="h-9 bg-black/40 border-white/10 text-xs sm:text-sm"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs font-semibold text-muted-foreground">Risk Rating</Label>
          <Select
            value={form.risk}
            onValueChange={(v) => set("risk", v as "Low" | "Medium" | "High")}
          >
            <SelectTrigger className="h-9 bg-black/40 border-white/10 text-xs sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Low">Low Risk</SelectItem>
              <SelectItem value="Medium">Medium Risk</SelectItem>
              <SelectItem value="High">High Risk</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Screenshot Section (Simplified Label) */}
      <div className="flex flex-col gap-1 pt-1">
        <ChartImageUploader
          label="SCREENSHOT"
          value={form.chartImageUrl}
          onChange={(url) => set("chartImageUrl", url)}
        />
      </div>

      {/* LEFT-ALIGNED [ Save Signal ] Button */}
      <div className="pt-2 flex justify-start">
        <Button
          type="submit"
          disabled={isPending}
          className="thc-glow thc-btn-gradient px-8 py-2 font-semibold justify-start"
        >
          {isPending ? "Saving Signal…" : "Save Signal"}
        </Button>
      </div>
    </form>
  );
}
