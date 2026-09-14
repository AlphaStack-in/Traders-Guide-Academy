import { formatDateOnly } from "@/lib/utils";
import { tgaManagerWhatsAppLink } from "@/lib/product-fulfillment";
import { WhatsAppIcon } from "@/components/site/icons";
import { TerminalCard } from "@/components/account/subscriptions/ui";
import type { SimplePurchaseEntry } from "@/lib/subscriptions";

/**
 * Shared card for the "My Indicators & E-books" and "Memberships" sections
 * of /account/subscriptions — simpler than My Courses (no validity concept,
 * just a purchase record + a "get access" WhatsApp link, matching the
 * high-touch fulfillment fallback already used elsewhere in the app).
 */
export function SimplePurchasesSection({
  title,
  emptyLabel,
  items,
}: {
  title: string;
  emptyLabel: string;
  items: SimplePurchaseEntry[];
}) {
  return (
    <TerminalCard title={title} accent="neutral" padding="compact">
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => {
            const whatsappLink = tgaManagerWhatsAppLink(
              `Hi, I'd like help accessing "${item.productName}".`,
            );
            return (
              <li
                key={item.purchaseId}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-heading text-sm font-semibold text-white">{item.productName}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Purchased {formatDateOnly(item.purchasedAt)}
                  </p>
                </div>
                {whatsappLink && (
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-slate-800"
                  >
                    <WhatsAppIcon className="h-3.5 w-3.5" />
                    Get access
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </TerminalCard>
  );
}
