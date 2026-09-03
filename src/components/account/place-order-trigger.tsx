"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getSignalOrderContext } from "@/app/account/broker/order-actions";
import { getGoodwillOrderContext } from "@/app/account/broker/goodwill-order-actions";
import type { OrderBroker } from "@/lib/client-config";

// Lightweight — only checks whether this signal is still actionable (open,
// resolvable) to decide whether to show the toggle at all. The parent owns
// the actual expanded/collapsed state, since where the resulting
// OrderExpansionPanel renders differs by context (a table needs a sibling
// row, the notification panel is a plain div).
//
// brokerType picks which backend this checks — Dhan's (broker-connect
// gated) or Goodwill's (no connect step, just signal actionability). A
// deployment only ever has one broker enabled at a time (see
// getActiveBroker() in src/lib/app-settings.ts), so this never mixes
// the two.
export function PlaceOrderTrigger({
  signalId,
  brokerType,
  expanded,
  onToggle,
}: {
  signalId: string;
  brokerType: OrderBroker;
  expanded: boolean;
  onToggle: () => void;
}) {
  const [actionable, setActionable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const request =
      brokerType === "dhan" ? getSignalOrderContext(signalId) : getGoodwillOrderContext(signalId);
    request
      .then((ctx) => {
        if (!cancelled) setActionable(ctx.signal?.actionable ?? false);
      })
      .catch(() => {
        // Not logged in as a subscriber — this panel/table is also viewed by
        // non-subscribers, so fail silently.
      });
    return () => {
      cancelled = true;
    };
  }, [signalId, brokerType]);

  if (!actionable) return null;

  return (
    <Button
      type="button"
      size="sm"
      variant={expanded ? "outline" : "default"}
      className={expanded ? "h-7 px-3 text-[11px]" : "signalflow-glow signalflow-btn-gradient h-7 px-3 text-[11px]"}
      onClick={onToggle}
    >
      {expanded ? "Cancel" : "Place Order"}
    </Button>
  );
}
