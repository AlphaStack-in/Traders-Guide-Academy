"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { createSignals, type SignalInput } from "@/app/admin/(protected)/signals/actions";
import { INSTRUMENTS, INSTRUMENT_LABEL, type InstrumentLiteral } from "@/lib/instruments";
import { getNextExpiry, type InstrumentCategory, type ExpiryOption } from "@/lib/expiry";
import { ChartImageUploader } from "@/components/signals/chart-image-uploader";
import { Send } from "lucide-react";

export type ExtendedInstrument = InstrumentLiteral | "STOCK";

// Most frequently traded intraday F&O stocks (standard NSE trading
// symbols) — seeds the Stock Symbol combobox alongside whatever symbols
// this deployment has actually used before (see usedStockSymbols prop).
// Not exhaustive; a symbol not on this list can still be typed freely.
export const POPULAR_STOCKS = [
  "RELIANCE", "TCS", "HDFCBANK", "ICICIBANK", "INFY", "SBIN", "AXISBANK",
  "KOTAKBANK", "BAJFINANCE", "BHARTIARTL", "ITC", "LT", "HINDUNILVR",
  "TATAMOTORS", "TATASTEEL", "ADANIENT", "ADANIPORTS", "MARUTI",
  "SUNPHARMA", "WIPRO", "HCLTECH", "ONGC", "NTPC", "POWERGRID",
  "ULTRACEMCO", "ASIANPAINT", "TITAN", "JSWSTEEL", "COALINDIA", "TECHM",
  "M&M", "DRREDDY", "GRASIM", "HINDALCO", "EICHERMOT", "BPCL", "CIPLA",
  "APOLLOHOSP", "SBILIFE", "HDFCLIFE", "BRITANNIA", "INDUSINDBK",
  "HEROMOTOCO", "BAJAJ-AUTO", "RVNL", "IRFC", "PNB", "IDEA", "TATAPOWER",
  "ZOMATO", "SUZLON", "YESBANK",
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
  // Stock symbols already used in a previous signal on this deployment —
  // shown first in the Stock Symbol combobox, ahead of the generic
  // frequently-traded list, since they're the most likely re-pick.
  usedStockSymbols?: string[];
}

export function ManualSignalForm({ prefilledValues, onSaved, usedStockSymbols = [] }: ManualSignalFormProps) {
  const [form, setForm] = useState<ManualFormValues>(emptyForm);
  const [isPending, startTransition] = useTransition();

  const stockSuggestions = useMemo(
    () => Array.from(new Set([...usedStockSymbols, ...POPULAR_STOCKS])),
    [usedStockSymbols],
  );

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

      // If the parsed signal text named an explicit expiry (e.g. "EXPIRY
      // 18th Aug"), honor it — but only when it's actually one of this
      // instrument's valid tradable expiries, so we never silently select a
      // non-existent contract. Otherwise fall back to the auto-next expiry,
      // same as before, and let the admin know why.
      const requestedExpiry = prefilledValues.expiry;
      const isRequestedExpiryValid =
        !!requestedExpiry && res.upcomingExpiries.some((exp) => exp.date === requestedExpiry);
      if (requestedExpiry && !isRequestedExpiryValid) {
        toast.warning(
          `Signal text named an expiry (${requestedExpiry}) that isn't a valid ${cat} contract — defaulted to the next expiry, please double-check.`,
        );
      }

      setForm((prev) => ({
        ...prev,
        ...prefilledValues,
        category: cat,
        instrument: isStock ? "NIFTY" : (rawInst as InstrumentLiteral),
        stockSymbol: isStock ? rawInst : prev.stockSymbol,
        expiry: isRequestedExpiryValid ? requestedExpiry : res.expiryDate,
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
      // Persist the actual typed symbol so it shows up as an "already
      // used" suggestion next time — the `instrument` enum field has no
      // slot for a stock name (see stockSymbol's comment in schema.prisma).
      stockSymbol: form.category === "STOCK" ? form.stockSymbol.trim().toUpperCase() : null,
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
      {/* 2-COLUMN TABLE: label left, input/select/combobox right */}
      <table className="w-full border-collapse text-sm">
        <colgroup>
          <col className="w-[38%] sm:w-[32%]" />
          <col />
        </colgroup>
        <tbody>
          <tr className="border-b border-white/5">
            <td className="py-2.5 pr-4 align-middle text-xs font-semibold text-muted-foreground">Strike</td>
            <td className="py-2.5">
              <Input
                value={form.strike}
                onChange={(e) => set("strike", e.target.value)}
                placeholder="24450"
                className="h-9 text-xs font-mono bg-black/40 border-white/10 focus:border-primary/50 w-full"
                required
              />
            </td>
          </tr>

          <tr className="border-b border-white/5">
            <td className="py-2.5 pr-4 align-middle text-xs font-semibold text-muted-foreground">Type</td>
            <td className="py-2.5">
              <Select value={form.optionType} onValueChange={(v) => set("optionType", v as "CE" | "PE")}>
                <SelectTrigger className="h-9 text-xs font-mono bg-black/40 border-white/10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#12131a] border-white/10">
                  <SelectItem value="CE">CE (Call)</SelectItem>
                  <SelectItem value="PE">PE (Put)</SelectItem>
                </SelectContent>
              </Select>
            </td>
          </tr>

          <tr className="border-b border-white/5">
            <td className="py-2.5 pr-4 align-middle text-xs font-semibold text-muted-foreground">Instrument</td>
            <td className="py-2.5">
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
            </td>
          </tr>

          {form.category === "STOCK" && (
            <tr className="border-b border-white/5">
              <td className="py-2.5 pr-4 align-middle text-xs font-semibold text-muted-foreground">Stock Symbol</td>
              <td className="py-2.5">
                <Combobox
                  value={form.stockSymbol}
                  onChange={handleStockSymbolChange}
                  suggestions={stockSuggestions}
                  placeholder="e.g. RELIANCE"
                  uppercase
                />
              </td>
            </tr>
          )}

          <tr className="border-b border-white/5">
            <td className="py-2.5 pr-4 align-middle text-xs font-semibold text-muted-foreground">Entry Price</td>
            <td className="py-2.5">
              <Input
                value={form.entryPrice}
                onChange={(e) => set("entryPrice", e.target.value)}
                placeholder="15"
                className="h-9 text-xs font-mono bg-black/40 border-white/10 focus:border-primary/50 w-full"
                required
              />
            </td>
          </tr>

          <tr className="border-b border-white/5">
            <td className="py-2.5 pr-4 align-middle text-xs font-semibold text-muted-foreground">Stop Loss</td>
            <td className="py-2.5">
              <Input
                value={form.stopLoss}
                onChange={(e) => set("stopLoss", e.target.value)}
                placeholder="1"
                className="h-9 text-xs font-mono bg-black/40 border-white/10 focus:border-primary/50 text-rose-400 w-full"
                required
              />
            </td>
          </tr>

          <tr className="border-b border-white/5">
            <td className="py-2.5 pr-4 align-middle text-xs font-semibold text-muted-foreground">Target(s)</td>
            <td className="py-2.5">
              <Input
                value={form.targets}
                onChange={(e) => set("targets", e.target.value)}
                placeholder="155,170"
                className="h-9 text-xs font-mono bg-black/40 border-white/10 focus:border-primary/50 text-emerald-400 w-full"
                required
              />
            </td>
          </tr>

          <tr className="border-b border-white/5">
            <td className="py-2.5 pr-4 align-middle text-xs font-semibold text-muted-foreground">CMP (Optional)</td>
            <td className="py-2.5">
              <Input
                value={form.priceAtSignal}
                onChange={(e) => set("priceAtSignal", e.target.value)}
                placeholder="Defaults to Entry Price"
                className="h-9 text-xs font-mono bg-black/40 border-white/10 focus:border-primary/50 w-full"
              />
            </td>
          </tr>

          <tr className="border-b border-white/5">
            <td className="py-2.5 pr-4 align-middle text-xs font-semibold text-muted-foreground">Sell Price (Optional)</td>
            <td className="py-2.5">
              <Input
                value={form.sellPrice}
                onChange={(e) => set("sellPrice", e.target.value)}
                placeholder="Optional"
                className="h-9 text-xs font-mono bg-black/40 border-white/10 focus:border-primary/50 w-full"
              />
            </td>
          </tr>

          <tr className="border-b border-white/5">
            <td className="py-2.5 pr-4 align-middle text-xs font-semibold text-muted-foreground">
              <div className="flex items-center justify-between gap-2">
                <span>Expiry Date</span>
                <span className="text-[10px] text-primary/80 font-normal">AUTO-NEXT</span>
              </div>
            </td>
            <td className="py-2.5">
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
            </td>
          </tr>

          <tr>
            <td className="py-2.5 pr-4 align-middle text-xs font-semibold text-muted-foreground">Risk Rating</td>
            <td className="py-2.5">
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
            </td>
          </tr>
        </tbody>
      </table>

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
