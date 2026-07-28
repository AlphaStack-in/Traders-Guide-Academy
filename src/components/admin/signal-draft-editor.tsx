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
import { INSTRUMENTS, INSTRUMENT_LABEL, type InstrumentLiteral } from "@/lib/instruments";

export interface EditableDraft {
  key: string;
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
  rawMessage: string;
  warnings: string[];
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
    <div className="thc-glass relative rounded-xl border border-white/5 p-4">
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove draft"
        className="absolute right-3 top-3 text-muted-foreground hover:text-[var(--thc-loss)]"
      >
        <X className="h-4 w-4" />
      </button>

      {draft.warnings.length > 0 && (
        <p className="mb-3 text-xs text-[var(--thc-loss)]">
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
    </div>
  );
}
