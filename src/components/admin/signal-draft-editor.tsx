"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import { ChartImageUploader } from "@/components/signals/chart-image-uploader";
import { INSTRUMENTS, INSTRUMENT_LABEL, type InstrumentLiteral } from "@/lib/instruments";

export interface EditableDraft {
  key: string;
  strike: string;
  optionType: "CE" | "PE";
  instrument: InstrumentLiteral;
  entryPrice: string;
  entryLow?: string;
  entryHigh?: string;
  stopLoss: string;
  targets: string;
  priceAtSignal: string;
  sellPrice: string;
  risk: "Low" | "Medium" | "High";
  expiry: string;
  rawMessage: string;
  warnings: string[];
  chartImageUrl?: string | null;
  contextTags?: string[];
  confidence?: "HIGH" | "MEDIUM" | "LOW";
  parserName?: "THC" | "GOODWILL";
}

export function SignalDraftEditor({
  draft,
  onChange,
  onRemove,
}: {
  draft: EditableDraft;
  onChange: (next: EditableDraft) => void;
  onRemove: () => void;
}) {
  function set<K extends keyof EditableDraft>(key: K, value: EditableDraft[K]) {
    onChange({ ...draft, [key]: value });
  }

  return (
    <div className="thc-glass relative rounded-xl border border-white/10 bg-[#0d0e14]/80 p-4 flex flex-col gap-4">
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove draft"
        className="absolute right-3 top-3 text-muted-foreground hover:text-[var(--thc-loss)]"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className="font-semibold text-foreground px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
          Parser: {draft.parserName || "THC"}
        </span>
        {draft.confidence && (
          <span
            className={`px-2 py-0.5 rounded font-semibold ${
              draft.confidence === "HIGH"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : draft.confidence === "MEDIUM"
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
            }`}
          >
            Confidence: {draft.confidence}
          </span>
        )}
        {draft.contextTags && draft.contextTags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {draft.contextTags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 rounded bg-white/10 text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {draft.warnings.length > 0 && (
        <p className="text-xs text-[var(--thc-loss)]">
          {draft.warnings.join(" · ")}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Strike</Label>
          <Input
            value={draft.strike}
            onChange={(e) => set("strike", e.target.value)}
            inputMode="numeric"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Type</Label>
          <Select
            value={draft.optionType}
            onValueChange={(v) => set("optionType", v as "CE" | "PE")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CE">CE</SelectItem>
              <SelectItem value="PE">PE</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Instrument</Label>
          <Select
            value={draft.instrument}
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
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Entry (Above)</Label>
          <Input
            value={draft.entryPrice}
            onChange={(e) => set("entryPrice", e.target.value)}
            inputMode="decimal"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">SL</Label>
          <Input
            value={draft.stopLoss}
            onChange={(e) => set("stopLoss", e.target.value)}
            inputMode="decimal"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Target(s)</Label>
          <Input
            value={draft.targets}
            onChange={(e) => set("targets", e.target.value)}
            placeholder="155,170"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Current Price</Label>
          <Input
            value={draft.priceAtSignal}
            onChange={(e) => set("priceAtSignal", e.target.value)}
            inputMode="decimal"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Sell Price (optional)</Label>
          <Input
            value={draft.sellPrice}
            onChange={(e) => set("sellPrice", e.target.value)}
            inputMode="decimal"
            placeholder="Leave blank if still open"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Expiry</Label>
          <Input
            type="date"
            value={draft.expiry}
            onChange={(e) => set("expiry", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Risk</Label>
          <Select value={draft.risk} onValueChange={(v) => set("risk", v as EditableDraft["risk"])}>
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
        value={draft.chartImageUrl}
        onChange={(url) => set("chartImageUrl", url)}
      />
    </div>
  );
}
