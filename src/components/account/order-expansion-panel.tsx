"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getOrderExpansionDetails,
  placeOrderForSignal,
  type OrderExpansionDetails,
} from "@/app/account/broker/order-actions";
import {
  getGoodwillOrderExpansionDetails,
  requestGoodwillOrderConfirmation,
} from "@/app/account/broker/goodwill-order-actions";
import type { OrderBroker } from "@/lib/client-config";

type ProductType = "INTRADAY" | "MARGIN";

// Normalized shape both brokers' details fit into — Dhan's brokerStatus/
// availableBalance collapse to sensible defaults for Goodwill, which has no
// connect step or fund-limit lookup.
interface PanelDetails {
  brokerStatus: OrderExpansionDetails["brokerStatus"];
  entryPrice: number;
  lotSize: number | null;
  contractError: string | null;
  availableBalance: number | null;
}

// The shared expanded content — identical in the Trade Log table and the
// notification panel. Each parent conditionally renders this wherever fits
// its own DOM structure once a signal's PlaceOrderTrigger is toggled on.
//
// brokerType branches which server actions this calls — Dhan's (real order
// placement, broker-connect gated) or Goodwill's (placeholder request log,
// no connect step). Never both at once; see getActiveOrderBroker.
export function OrderExpansionPanel({
  signalId,
  brokerType,
}: {
  signalId: string;
  brokerType: OrderBroker;
}) {
  const [details, setDetails] = useState<PanelDetails | null>(null);
  const [lots, setLots] = useState(1);
  const [productType, setProductType] = useState<ProductType>("INTRADAY");
  const [placing, setPlacing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const request =
      brokerType === "dhan"
        ? getOrderExpansionDetails(signalId)
        : getGoodwillOrderExpansionDetails(signalId).then((d) => ({
            brokerStatus: "ACTIVE" as const,
            ...d,
            availableBalance: null,
          }));
    request
      .then((d) => {
        if (!cancelled) setDetails(d);
      })
      .catch(() => {
        if (!cancelled) {
          setDetails({
            brokerStatus: brokerType === "dhan" ? "NOT_CONNECTED" : "ACTIVE",
            entryPrice: 0,
            lotSize: null,
            contractError: "Couldn't load order details.",
            availableBalance: null,
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [signalId, brokerType]);

  if (!details) {
    return (
      <div className="thc-glass thc-neutral-border rounded-xl border p-3 text-xs text-muted-foreground">
        Loading order details…
      </div>
    );
  }

  if (brokerType === "dhan" && details.brokerStatus !== "ACTIVE") {
    return (
      <div className="thc-glass thc-gold-border flex items-center justify-between gap-3 rounded-xl border p-3">
        <div>
          <p className="text-sm font-medium">Broker Not Connected</p>
          <p className="text-xs text-muted-foreground">Connect your Dhan account to place this order.</p>
        </div>
        <Button asChild size="sm" className="thc-glow thc-btn-gradient shrink-0">
          <Link href="/account/profile">Connect Now</Link>
        </Button>
      </div>
    );
  }

  if (details.contractError) {
    return (
      <div className="thc-glass rounded-xl border border-[var(--thc-loss)]/40 p-3 text-sm text-[var(--thc-loss)]">
        {details.contractError}
      </div>
    );
  }

  const quantity = lots * details.lotSize!;
  const required = quantity * details.entryPrice;

  async function handlePlaceOrder() {
    if (placing || result?.success) return;
    setPlacing(true);
    setResult(null);
    const res =
      brokerType === "dhan"
        ? await placeOrderForSignal(signalId, lots, productType)
        : await requestGoodwillOrderConfirmation(signalId, lots, productType);
    setPlacing(false);

    if (res.success) {
      setResult({ success: true, text: res.message ?? "Order placed." });
      toast.success(res.message ?? "Order placed.");
    } else {
      setResult({ success: false, text: res.error ?? "Order failed." });
      toast.error(res.error ?? "Order failed.");
    }
  }

  return (
    <div className="thc-glass thc-neutral-border flex flex-col gap-3 rounded-xl border p-3">
      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Trade Type
          </label>
          <Select
            value={productType}
            onValueChange={(v) => setProductType(v as ProductType)}
            disabled={placing}
          >
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INTRADAY">Intraday</SelectItem>
              <SelectItem value="MARGIN">Margin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Position Size (Lots)
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLots((n) => Math.max(1, n - 1))}
              disabled={placing || lots <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:opacity-40"
              aria-label="Decrease lots"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-5 text-center font-heading font-bold thc-gold-text">{lots}</span>
            <button
              type="button"
              onClick={() => setLots((n) => n + 1)}
              disabled={placing}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:opacity-40"
              aria-label="Increase lots"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-white/5 pt-2 text-xs">
        <span className="text-muted-foreground">
          Qty <span className="font-medium text-foreground">{quantity} units</span>
        </span>
        <span className="text-muted-foreground">
          Required (@ entry price){" "}
          <span className="font-medium text-foreground">
            ₹{required.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
          </span>
        </span>
        <span className="text-muted-foreground">
          Available{" "}
          <span className="font-medium text-foreground">
            {details.availableBalance != null
              ? `₹${details.availableBalance.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
              : "—"}
          </span>
        </span>
      </div>

      {result && (
        <p className={`text-xs ${result.success ? "text-[var(--thc-win)]" : "text-[var(--thc-loss)]"}`}>
          {result.text}
        </p>
      )}

      <div className="flex justify-end">
        <Button
          type="button"
          disabled={placing || result?.success}
          onClick={handlePlaceOrder}
          className="thc-glow thc-btn-gradient"
        >
          {placing ? "Placing…" : result?.success ? "Order Placed" : "Place Order"}
        </Button>
      </div>
    </div>
  );
}
