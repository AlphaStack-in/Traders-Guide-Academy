import { formatDateOnly } from "@/lib/utils";
import { tgaManagerWhatsAppLink } from "@/lib/product-fulfillment";
import { WhatsAppIcon } from "@/components/site/icons";
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
    <div className="signalflow-glass signalflow-neutral-border flex flex-col gap-3 rounded-2xl border p-5">
      <h2 className="font-heading text-lg font-bold">{title}</h2>
      {items.length === 0 && <p className="text-sm text-muted-foreground">{emptyLabel}</p>}
      <ul className="flex flex-col gap-2">
        {items.map((item) => {
          const whatsappLink = tgaManagerWhatsAppLink(
            `Hi, I'd like help accessing "${item.productName}".`,
          );
          return (
            <li
              key={item.purchaseId}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-4"
            >
              <div className="min-w-0">
                <p className="truncate font-heading font-semibold">{item.productName}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Purchased {formatDateOnly(item.purchasedAt)}
                </p>
              </div>
              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-primary"
                >
                  <WhatsAppIcon className="h-3.5 w-3.5" />
                  Get access
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
