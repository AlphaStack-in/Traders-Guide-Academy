"use client";

import { useState, useTransition } from "react";
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

function emptyForm() {
  return {
    strike: "",
    optionType: "CE" as "CE" | "PE",
    instrument: "NIFTY" as InstrumentLiteral,
    entryPrice: "",
    stopLoss: "",
    targets: "",
    priceAtSignal: "",
    sellPrice: "",
    risk: "Medium" as "Low" | "Medium" | "High",
    expiry: nextWeeklyExpiry(),
    chartImageUrl: null as string | null,
  };
}

type FormState = ReturnType<typeof emptyForm>;

export function ManualSignalForm() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isPending, startTransition] = useTransition();

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const strike = parseInt(form.strike, 10);
    const entryPrice = parseFloat(form.entryPrice);
    const stopLoss = parseFloat(form.stopLoss);
    const priceAtSignal = parseFloat(form.priceAtSignal);
    const targets = form.targets
      .split(",")
      .map((t) => parseFloat(t.trim()))
      .filter((t) => Number.isFinite(t));
    const sellPrice = form.sellPrice.trim() === "" ? null : parseFloat(form.sellPrice);

    if (
      !Number.isFinite(strike) ||
      !Number.isFinite(entryPrice) ||
      !Number.isFinite(stopLoss) ||
      !Number.isFinite(priceAtSignal) ||
      targets.length === 0 ||
      !form.expiry
    ) {
      toast.error("Fill in strike, entry, SL, target(s), expiry and now price.");
      return;
    }

    const input: SignalInput = {
      strike,
      optionType: form.optionType,
      instrument: form.instrument,
      entryPrice,
      stopLoss,
      targets,
      priceAtSignal,
      sellPrice: sellPrice != null && Number.isFinite(sellPrice) ? sellPrice : null,
      rawMessage: `Manual entry: ${strike} ${form.optionType}`,
      expiry: form.expiry,
      chartImageUrl: form.chartImageUrl,
    };

    startTransition(async () => {
      const result = await createSignals([input]);
      if (result.success) {
        toast.success("Signal saved.");
        setForm(emptyForm());
      } else {
        toast.error(result.error ?? "Failed to save signal.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <Label>Strike</Label>
          <Input value={form.strike} onChange={(e) => set("strike", e.target.value)} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Type</Label>
          <Select value={form.optionType} onValueChange={(v) => set("optionType", v as "CE" | "PE")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CE">CE</SelectItem>
              <SelectItem value="PE">PE</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Instrument</Label>
          <Select
            value={form.instrument}
            onValueChange={(v) => set("instrument", v as InstrumentLiteral)}
          >
            <SelectTrigger>
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
        <div className="flex flex-col gap-1.5">
          <Label>Entry Price</Label>
          <Input value={form.entryPrice} onChange={(e) => set("entryPrice", e.target.value)} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Stop Loss</Label>
          <Input value={form.stopLoss} onChange={(e) => set("stopLoss", e.target.value)} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Target(s)</Label>
          <Input
            value={form.targets}
            onChange={(e) => set("targets", e.target.value)}
            placeholder="155,170"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Current Price</Label>
          <Input
            value={form.priceAtSignal}
            onChange={(e) => set("priceAtSignal", e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Sell Price (optional)</Label>
          <Input value={form.sellPrice} onChange={(e) => set("sellPrice", e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Expiry</Label>
          <Input
            type="date"
            value={form.expiry}
            onChange={(e) => set("expiry", e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Risk</Label>
          <Select
            value={form.risk}
            onValueChange={(v) => set("risk", v as "Low" | "Medium" | "High")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="High">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ChartImageUploader
        value={form.chartImageUrl}
        onChange={(url) => set("chartImageUrl", url)}
      />

      <Button type="submit" disabled={isPending} className="thc-glow thc-btn-gradient w-fit">
        {isPending ? "Saving…" : "Save Signal"}
      </Button>
    </form>
  );
}
