"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getSignalOrderContext,
  placeOrderForSignal,
  type SignalOrderContext,
} from "@/app/account/broker/order-actions";

// Shown per signal inside the notification panel — a lot-size input + Place
// Order button when the viewer has an active Dhan connection, or a Connect
// Now CTA when they don't. Renders nothing for signals that aren't
// actionable (closed) or for non-subscribers (getSignalOrderContext throws,
// caught silently below).
export function InlineOrderForm({ signalId }: { signalId: string }) {
  const [context, setContext] = useState<SignalOrderContext | null>(null);
  const [lotSize, setLotSize] = useState("");
  const [placing, setPlacing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSignalOrderContext(signalId)
      .then((ctx) => {
        if (!cancelled) setContext(ctx);
      })
      .catch(() => {
        // Not logged in as a subscriber, or some other lookup failure —
        // this panel is also viewed by non-subscribers, so fail silently.
      });
    return () => {
      cancelled = true;
    };
  }, [signalId]);

  if (!context || !context.signal?.actionable) return null;

  if (context.brokerStatus !== "ACTIVE") {
    return (
      <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1.5">
        <span className="text-[11px] text-muted-foreground">Place this trade via Dhan</span>
        <Button asChild size="sm" variant="outline" className="h-6 px-2 text-[11px]">
          <Link href="/account/broker">Connect now</Link>
        </Button>
      </div>
    );
  }

  async function handlePlaceOrder() {
    const lots = Number(lotSize);
    if (!Number.isInteger(lots) || lots <= 0) {
      setResult({ success: false, text: "Enter a valid number of lots." });
      return;
    }
    setPlacing(true);
    setResult(null);
    const res = await placeOrderForSignal(signalId, lots);
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
    <div className="mt-2 flex flex-col gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-2">
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={1}
          step={1}
          placeholder="Lots"
          value={lotSize}
          onChange={(e) => setLotSize(e.target.value)}
          className="h-7 w-16 text-xs"
          disabled={placing}
        />
        <Button
          type="button"
          size="sm"
          className="thc-glow thc-btn-gradient h-7 px-3 text-[11px]"
          disabled={placing || !lotSize}
          onClick={handlePlaceOrder}
        >
          {placing ? "Placing…" : "Place Order"}
        </Button>
      </div>
      {result && (
        <p className={`text-[11px] ${result.success ? "text-[var(--thc-win)]" : "text-[var(--thc-loss)]"}`}>
          {result.text}
        </p>
      )}
    </div>
  );
}
