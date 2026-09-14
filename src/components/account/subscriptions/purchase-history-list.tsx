import type { PaymentStatus } from "@prisma/client";
import { formatDateOnly } from "@/lib/utils";
import { formatPriceInPaise, PRODUCT_CATEGORY_LABELS } from "@/lib/products";
import { TerminalCard } from "@/components/account/subscriptions/ui";
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
 * subscriber can see everything they've ever paid TGA for in one list.
 * Styled as a compact scrollable "ledger" to match the terminal-dashboard
 * look of the rest of /account/subscriptions — see
 * getSubscriberSubscriptionsSummary (src/lib/subscriptions.ts) for how the
 * two sources are merged.
 */
export function PurchaseHistoryList({ items }: { items: PurchaseHistoryItem[] }) {
  return (
    <TerminalCard
      title="Billing & Invoices"
      subtitle="Every membership charge and one-time purchase on your account."
      accent="neutral"
      padding="compact"
      badge={
        <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-400">
          {items.length} {items.length === 1 ? "record" : "records"}
        </span>
      }
    >
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing on record yet.</p>
      ) : (
        <ul className="flex max-h-[420px] flex-col divide-y divide-white/5 overflow-y-auto pr-1">
          {items.map((item) => (
            <li key={`${item.kind}-${item.id}`} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate font-heading text-sm font-semibold text-white">
                  {item.label}
                  {item.category && (
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                      ({PRODUCT_CATEGORY_LABELS[item.category]})
                    </span>
                  )}
                </p>
                <p className="font-mono text-[11px] text-muted-foreground">{formatDateOnly(item.date)}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="font-mono text-sm font-bold text-white">
                  {formatPriceInPaise(item.amountInPaise)}
                </span>
                <span
                  className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                  style={STATUS_BADGE_STYLE[item.status]}
                >
                  {STATUS_LABEL[item.status]}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </TerminalCard>
  );
}
