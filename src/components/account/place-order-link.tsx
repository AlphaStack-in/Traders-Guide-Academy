"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getSignalOrderContext, type SignalOrderContext } from "@/app/account/broker/order-actions";

// Shown per signal in the Trade Log table and the notification panel — a
// single link out to the full-page order screen (/signals/[id]/order),
// which itself decides whether to show "Broker Not Connected" or the actual
// order form. Renders nothing for closed signals or non-subscribers
// (getSignalOrderContext throws for the latter, caught silently below).
export function PlaceOrderLink({ signalId }: { signalId: string }) {
  const [context, setContext] = useState<SignalOrderContext | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSignalOrderContext(signalId)
      .then((ctx) => {
        if (!cancelled) setContext(ctx);
      })
      .catch(() => {
        // Not logged in as a subscriber — this panel/table is also viewed by
        // non-subscribers, so fail silently.
      });
    return () => {
      cancelled = true;
    };
  }, [signalId]);

  if (!context?.signal?.actionable) return null;

  return (
    <Button asChild size="sm" className="thc-glow thc-btn-gradient h-7 px-3 text-[11px]">
      <Link href={`/signals/${signalId}/order`}>Place Order</Link>
    </Button>
  );
}
