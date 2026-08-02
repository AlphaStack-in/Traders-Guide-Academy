"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { placeOrderForSignal } from "@/app/account/broker/order-actions";

export function OrderScreen({
  signalId,
  entryPrice,
  lotSize,
  availableBalance,
}: {
  signalId: string;
  entryPrice: number;
  lotSize: number;
  availableBalance: number | null;
}) {
  const router = useRouter();
  const [lots, setLots] = useState(1);
  const [placing, setPlacing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; text: string } | null>(null);

  const quantity = lots * lotSize;
  const required = quantity * entryPrice;

  async function handlePlaceOrder() {
    setPlacing(true);
    setResult(null);
    const res = await placeOrderForSignal(signalId, lots);
    setPlacing(false);

    if (res.success) {
      setResult({ success: true, text: res.message ?? "Order placed." });
      toast.success(res.message ?? "Order placed.");
      router.refresh();
    } else {
      setResult({ success: false, text: res.error ?? "Order failed." });
      toast.error(res.error ?? "Order failed.");
    }
  }

  return (
    <div className="thc-glass thc-neutral-border flex flex-col gap-4 rounded-2xl border p-5">
      <h2 className="font-heading text-sm font-semibold text-muted-foreground">
        Account Details
      </h2>

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Lots</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setLots((n) => Math.max(1, n - 1))}
            disabled={placing || lots <= 1}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:opacity-40"
            aria-label="Decrease lots"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-6 text-center font-heading text-lg font-bold thc-gold-text">
            {lots}
          </span>
          <button
            type="button"
            onClick={() => setLots((n) => n + 1)}
            disabled={placing}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:opacity-40"
            aria-label="Increase lots"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
      <p className="-mt-2 text-right text-xs text-muted-foreground">
        Quantity × {lots} ({quantity} units)
      </p>

      <div className="flex flex-col gap-2 border-t border-white/5 pt-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Required (@ entry price)</span>
          <span className="font-heading font-bold">₹{required.toLocaleString("en-IN")}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Available</span>
          <span className="font-heading font-bold">
            {availableBalance != null ? `₹${availableBalance.toLocaleString("en-IN")}` : "—"}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-white/5 pt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          Placing orders on
          <Image src="/dhan-logo.jpg" alt="Dhan" width={18} height={18} className="rounded" />
          <span className="font-medium text-foreground">Dhan</span>
        </span>
        <span>
          Platform Fee: <span className="font-medium text-[var(--thc-win)]">Free</span>
        </span>
      </div>

      {result && (
        <p
          className={`text-sm ${result.success ? "text-[var(--thc-win)]" : "text-[var(--thc-loss)]"}`}
        >
          {result.text}
        </p>
      )}

      <Button
        type="button"
        disabled={placing}
        onClick={handlePlaceOrder}
        className="thc-glow thc-btn-gradient mt-1 w-full py-6 text-base font-bold"
      >
        {placing ? "Placing…" : "Click to Place Order"}
      </Button>
    </div>
  );
}
