import type { PaymentStatus } from "@prisma/client";
import { formatDateOnly } from "@/lib/utils";
import { formatPriceInPaise, PRODUCT_CATEGORY_LABELS } from "@/lib/products";
import type { PurchaseHistoryItem } from "@/lib/subscriptions";

// Plain style objects rather than Tailwind arbitrary-value classes — these
// reference the app's --signalflow-win/--signalflow-loss CSS custom
// properties directly (same tokens globals.css uses for
// .signalflow-win-border/.signalflow-loss-border), which is simpler to get
// right than escaping a color-mix() expression inside a Tailwind bg-[...]
// class.
const STATUS_BADGE_STYLE: Record<PaymentStatus, React.CSSProperties> = {
  CREATED: { backgroundColor: "rgba(255,255,255,0.1)", color: "var(--muted-foreground)" },
  AUTHORIZED: { backgroundColor: "color-mix(in oklab, var(--primary) 15%, transparent)", color: "var(--primary)" },
  CAPTURED: {
    backgroundColor: "color-mix(in oklab, var(--signalflow-win) 20%, transparent)",
    color: "var(--signalflow-win)",
  },
  FAILED: {
    backgroundColor: "color-mix(in oklab, var(--signalflow-loss) 20%, transparent)",
    color: "var(--signalflow-loss)",
  },
  REFUNDED: { backgroundColor: "rgba(255,255,255,0.1)", color: "var(--muted-foreground)" },
};

const STATUS_LABEL: Record<PaymentStatus, string> = {
  CREATED: "Created",
  AUTHORIZED: "Authorized",
  CAPTURED: "Paid",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};

/**
 * One reverse-chronological list merging recurring membership Payment rows
 * and one-time ProductPurchase rows — the first place in the app a
 * subscriber can see everything they've ever paid TGA for in one list. See
 * getSubscriberSubscriptionsSummary (src/lib/subscriptions.ts) for how the
 * two sources are merged.
 */
export function PurchaseHistoryList({ items }: { items: PurchaseHistoryItem[] }) {
  return (
    <div className="signalflow-glass signalflow-neutral-border flex flex-col gap-3 rounded-2xl border p-5">
      <div>
        <h2 className="font-heading text-lg font-bold">Purchase History</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Every membership charge and one-time purchase on your account.
        </p>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing on record yet.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-white/5">
          {items.map((item) => (
            <li key={`${item.kind}-${item.id}`} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate font-heading text-sm font-semibold">
                  {item.label}
                  {item.category && (
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                      ({PRODUCT_CATEGORY_LABELS[item.category]})
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">{formatDateOnly(item.date)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="font-heading text-sm font-semibold">
                  {formatPriceInPaise(item.amountInPaise)}
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                  style={STATUS_BADGE_STYLE[item.status]}
                >
                  {STATUS_LABEL[item.status]}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
