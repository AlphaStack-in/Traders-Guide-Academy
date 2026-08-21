"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
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
import { getNextExpiry, type InstrumentCategory, type ExpiryOption } from "@/lib/expiry";
import { ChartImageUploader } from "@/components/signals/chart-image-uploader";
import { Send } from "lucide-react";

export type ExtendedInstrument = InstrumentLiteral | "STOCK";

export const POPULAR_STOCKS = [
  "RVNL", "TCS", "ADANI ENT", "RELIANCE", "INFY", "TATAMOTORS", "TATASTEEL", "ICICIBANK", "HDFCBANK", "SBIN", "BHARTIARTL", "ITC", "LT"
];

export interface ManualFormValues {
  strike: string;
  optionType: "CE" | "PE";
  instrument: InstrumentLiteral;
  category: ExtendedInstrument;
  stockSymbol: string;
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
  const initialCategory: ExtendedInstrument = "NIFTY";
  const initialExpiry = getNextExpiry(initialCategory).expiryDate;
  return {
    strike: "",
    optionType: "CE",
    instrument: "NIFTY",
    category: "NIFTY",
    stockSymbol: "RVNL",
    entryPrice: "",
    stopLoss: "",
    targets: "",
    priceAtSignal: "",
    sellPrice: "",
    risk: "Medium",
    expiry: initialExpiry,
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

  // Dynamic Expiry Calculation based on Selected Category & Stock Symbol
  const expiryResult = useMemo(() => {
    return getNextExpiry({
      instrument: form.category,
      stockSymbol: form.stockSymbol,
    });
  }, [form.category, form.stockSymbol]);

  // Update Expiry Date whenever Category or Stock Symbol changes
  function handleCategoryChange(newCategory: ExtendedInstrument) {
    const res = getNextExpiry({
      instrument: newCategory,
      stockSymbol: form.stockSymbol,
    });
    const mappedInst: InstrumentLiteral = newCategory === "STOCK" ? "NIFTY" : newCategory;
    setForm((prev) => ({
      ...prev,
      category: newCategory,
      instrument: mappedInst,
      expiry: res.expiryDate,
    }));
  }

  function handleStockSymbolChange(newSymbol: string) {
    const res = getNextExpiry({
      instrument: "STOCK",
      stockSymbol: newSymbol,
    });
    setForm((prev) => ({
      ...prev,
      stockSymbol: newSymbol,
      expiry: res.expiryDate,
    }));
  }

  // Handle Prefilled Values from "Use Parsed Data"
  useEffect(() => {
    if (prefilledValues) {
      const rawInst = (prefilledValues.instrument || "NIFTY").toUpperCase();
      const isStock = !INSTRUMENTS.includes(rawInst as InstrumentLiteral);
      const cat: ExtendedInstrument = isStock ? "STOCK" : (rawInst as InstrumentLiteral);
      const res = getNextExpiry({
        instrument: cat,
        stockSymbol: isStock ? rawInst : "RVNL",
      });

      setForm((prev) => ({
        ...prev,
        ...prefilledValues,
        category: cat,
        instrument: isStock ? "NIFTY" : (rawInst as InstrumentLiteral),
        stockSymbol: isStock ? rawInst : prev.stockSymbol,
        expiry: res.expiryDate, // Automatically recalculated next valid expiry for parsed instrument
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

    const rawMessageInst = form.category === "STOCK" ? form.stockSymbol : form.instrument;

    const input: SignalInput = {
      strike,
      optionType: form.optionType,
      instrument: form.instrument,
      entryPrice,
      stopLoss,
      targets,
      priceAtSignal: priceAtSignalVal,
      sellPrice: sellPrice != null && Number.isFinite(sellPrice) ? sellPrice : null,
      rawMessage: `Manual entry: ${rawMessageInst} ${strike} ${form.optionType}`,
      expiry: form.expiry,
      chartImageUrl: form.chartImageUrl,
      target1: targets[0] ?? null,
      target2: targets[1] ?? null,
    };

    startTransition(async () => {
      const result = await createSignals([input]);
      if (result.success) {
        toast.success("Signal sent successfully.");
        setForm(emptyForm());
        onSaved?.();
      } else {
        toast.error(result.error ?? "Failed to send signal.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* 3-COLUMN UNIFORM GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 items-start">
        {/* ================= COLUMN 1 ================= */}
        {/* Row 1 Col 1: Strike */}
        <div className="flex flex-col gap-1.5 w-full">
          <Label className="text-xs font-semibold text-muted-foreground">Strike</Label>
          <Input
            value={form.strike}
            onChange={(e) => set("strike", e.target.value)}
            placeholder="24450"
            className="h-9 text-xs font-mono bg-black/40 border-white/10 focus:border-primary/50 w-full"
            required
          />
        </div>

        {/* Row 1 Col 2: Type */}
        <div className="flex flex-col gap-1.5 w-full">
          <Label className="text-xs font-semibold text-muted-foreground">Type</Label>
          <Select value={form.optionType} onValueChange={(v) => set("optionType", v as "CE" | "PE")}>
            <SelectTrigger className="h-9 text-xs font-mono bg-black/40 border-white/10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#12131a] border-white/10">
              <SelectItem value="CE">CE (Call)</SelectItem>
              <SelectItem value="PE">PE (Put)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Row 1 Col 3: Instrument */}
        <div className="flex flex-col gap-1.5 w-full">
          <Label className="text-xs font-semibold text-muted-foreground">Instrument</Label>
          <Select
            value={form.category}
            onValueChange={(v) => handleCategoryChange(v as ExtendedInstrument)}
          >
            <SelectTrigger className="h-9 text-xs font-semibold bg-black/40 border-white/10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#12131a] border-white/10">
              <SelectItem value="NIFTY">Nifty</SelectItem>
              <SelectItem value="SENSEX">Sensex</SelectItem>
              <SelectItem value="BANK_NIFTY">Bank Nifty</SelectItem>
              <SelectItem value="MIDCAP_NIFTY">Midcap Nifty</SelectItem>
              <SelectItem value="STOCK">Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ================= COLUMN 2 ================= */}
        {/* Row 2 Col 1: Entry Price */}
        <div className="flex flex-col gap-1.5 w-full">
          <Label className="text-xs font-semibold text-muted-foreground">Entry Price</Label>
          <Input
            value={form.entryPrice}
            onChange={(e) => set("entryPrice", e.target.value)}
            placeholder="15"
            className="h-9 text-xs font-mono bg-black/40 border-white/10 focus:border-primary/50 w-full"
            required
          />
        </div>

        {/* Row 2 Col 2: Stop Loss */}
        <div className="flex flex-col gap-1.5 w-full">
          <Label className="text-xs font-semibold text-muted-foreground">Stop Loss</Label>
          <Input
            value={form.stopLoss}
            onChange={(e) => set("stopLoss", e.target.value)}
            placeholder="1"
            className="h-9 text-xs font-mono bg-black/40 border-white/10 focus:border-primary/50 text-rose-400 w-full"
            required
          />
        </div>

        {/* Row 2 Col 3: Target(s) */}
        <div className="flex flex-col gap-1.5 w-full">
          <Label className="text-xs font-semibold text-muted-foreground">Target(s)</Label>
          <Input
            value={form.targets}
            onChange={(e) => set("targets", e.target.value)}
            placeholder="155,170"
            className="h-9 text-xs font-mono bg-black/40 border-white/10 focus:border-primary/50 text-emerald-400 w-full"
            required
          />
        </div>

        {/* ================= COLUMN 3 ================= */}
        {/* Row 3 Col 1: CMP */}
        <div className="flex flex-col gap-1.5 w-full">
          <Label className="text-xs font-semibold text-muted-foreground">CMP</Label>
          <Input
            value={form.priceAtSignal}
            onChange={(e) => set("priceAtSignal", e.target.value)}
            placeholder="15"
            className="h-9 text-xs font-mono bg-black/40 border-white/10 focus:border-primary/50 w-full"
          />
        </div>

        {/* Row 3 Col 2: Sell Price (Optional) */}
        <div className="flex flex-col gap-1.5 w-full">
          <Label className="text-xs font-semibold text-muted-foreground">Sell Price (Optional)</Label>
          <Input
            value={form.sellPrice}
            onChange={(e) => set("sellPrice", e.target.value)}
            placeholder="Optional"
            className="h-9 text-xs font-mono bg-black/40 border-white/10 focus:border-primary/50 w-full"
          />
        </div>

        {/* Row 3 Col 3: Expiry Date */}
        <div className="flex flex-col gap-1.5 w-full">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-muted-foreground">Expiry Date</Label>
            <span className="text-[10px] text-primary/80 font-normal">AUTO-NEXT</span>
          </div>
          <Select
            value={form.expiry}
            onValueChange={(v) => set("expiry", v)}
          >
            <SelectTrigger className="h-9 text-xs font-mono bg-black/40 border-white/10 text-primary font-semibold w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#12131a] border-white/10">
              {expiryResult.upcomingExpiries.map((exp) => (
                <SelectItem key={exp.date} value={exp.date} className="font-mono text-xs">
                  {exp.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ================= ROW 4 ================= */}
        {/* Row 4 Col 1: Risk Rating */}
        <div className="flex flex-col gap-1.5 w-full">
          <Label className="text-xs font-semibold text-muted-foreground">Risk Rating</Label>
          <Select
            value={form.risk}
            onValueChange={(v) => set("risk", v as "Low" | "Medium" | "High")}
          >
            <SelectTrigger className="h-9 text-xs bg-black/40 border-white/10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#12131a] border-white/10">
              <SelectItem value="Low">Low Risk</SelectItem>
              <SelectItem value="Medium">Medium Risk</SelectItem>
              <SelectItem value="High">High Risk</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Row 4 Col 2: Stock Symbol (Only if Stock selected) */}
        {form.category === "STOCK" && (
          <div className="flex flex-col gap-1.5 w-full">
            <Label className="text-xs font-semibold text-muted-foreground">Stock Symbol</Label>
            <Select
              value={form.stockSymbol}
              onValueChange={handleStockSymbolChange}
            >
              <SelectTrigger className="h-9 text-xs font-mono bg-black/40 border-white/10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#12131a] border-white/10">
                {POPULAR_STOCKS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* LEFT-ALIGNED [ Send Signal ] BUTTON WITH MATCHING SIZE, TEXT, & ICON */}
      <div className="pt-2 flex justify-start">
        <Button
          type="submit"
          disabled={isPending}
          className="h-9 signalflow-glow signalflow-btn-gradient gap-2 px-6 text-xs font-semibold justify-start shrink-0"
        >
          <Send className="h-4 w-4" />
          {isPending ? "Sending Signal…" : "Send Signal"}
        </Button>
      </div>

      {/* SCREENSHOT SECTION */}
      <div className="flex flex-col gap-1.5 pt-2 border-t border-white/10">
        <ChartImageUploader
          label="SCREENSHOT"
          value={form.chartImageUrl}
          onChange={(url) => set("chartImageUrl", url)}
        />
      </div>
    </form>
  );
}
