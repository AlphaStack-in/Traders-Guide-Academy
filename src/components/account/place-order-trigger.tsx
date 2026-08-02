"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getSignalOrderContext, type SignalOrderContext } from "@/app/account/broker/order-actions";

// Lightweight — only checks whether this signal is still actionable (open,
// resolvable) to decide whether to show the toggle at all. The parent owns
// the actual expanded/collapsed state, since where the resulting
// OrderExpansionPanel renders differs by context (a table needs a sibling
// row, the notification panel is a plain div).
export function PlaceOrderTrigger({
  signalId,
  expanded,
  onToggle,
}: {
  signalId: string;
  expanded: boolean;
  onToggle: () => void;
}) {
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
    <Button
      type="button"
      size="sm"
      variant={expanded ? "outline" : "default"}
      className={expanded ? "h-7 px-3 text-[11px]" : "thc-glow thc-btn-gradient h-7 px-3 text-[11px]"}
      onClick={onToggle}
    >
      {expanded ? "Cancel" : "Place Order"}
    </Button>
  );
}
