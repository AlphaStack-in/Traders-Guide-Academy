import { prisma } from "@/lib/prisma";
import { sendProductPurchaseEmail } from "@/lib/email";
import { sendTelegramMessage } from "@/lib/telegram";
import { clientConfig } from "@/lib/client-config";
import { isHighTouchCategory, PRODUCT_CATEGORY_LABELS } from "@/lib/products";

/**
 * Delivers a confirmed ProductPurchase (called once payment is CAPTURED —
 * either immediately for a free product, or from the Cashfree webhook for
 * a paid one). Two automated channels, mirroring exactly how the existing
 * Subscription webhook already notifies the team:
 *
 *   1. An email to the buyer via Resend (sendProductPurchaseEmail).
 *   2. An internal Telegram ops alert via sendTelegramMessage — the same
 *      channel src/app/api/webhooks/cashfree/route.ts already uses for
 *      subscription events, so the TGA team sees product sales the same
 *      way they already see Autopay activity.
 *
 * IMPORTANT — there is no automated WhatsApp Business API integration
 * anywhere in this codebase. Every existing "WhatsApp" touchpoint (see
 * continue-premium-panel.tsx's toWhatsAppLink) is a manual wa.me
 * click-to-chat link opened by a human, never a server-initiated send. So
 * unlike the build prompt's shorthand ("automated email + WhatsApp
 * handoff"), fulfillment here does NOT send an automated WhatsApp message —
 * it sends the email + Telegram alert above, and the UI (see
 * product-checkout-button.tsx / the /products/[slug] confirmation state)
 * shows the buyer a manual "Continue via WhatsApp" link for Indicators/PMS/
 * Membership Plans, same as the subscription flow's fallback pattern.
 *
 * Guards against double-sending if a webhook redelivers after this already
 * ran once (ProductPurchase.fulfilledAt).
 */
export async function fulfillProductPurchase(purchaseId: string): Promise<void> {
  const purchase = await prisma.productPurchase.findUnique({
    where: { id: purchaseId },
    include: { product: true, subscriber: true },
  });
  if (!purchase || purchase.fulfilledAt) return;
  if (purchase.status !== "CAPTURED") return;

  const { product, subscriber } = purchase;
  const highTouch = isHighTouchCategory(product.category);

  const deliveryDetails = highTouch
    ? `Our team will reach out shortly with your ${PRODUCT_CATEGORY_LABELS[product.category].toLowerCase()} onboarding details. ` +
      `If you'd like to speed things up, you can also message us directly on WhatsApp from your account.`
    : `You can access "${product.name}" from your account dashboard. If you don't see it there yet, reply to this email and we'll sort it out.`;

  if (subscriber.email) {
    await sendProductPurchaseEmail({
      toEmail: subscriber.email,
      memberName: subscriber.name,
      productName: product.name,
      deliveryDetails,
    });
  }

  await sendTelegramMessage(
    `🛒 ${subscriber.name} (${subscriber.phone}) purchased "${product.name}" ` +
      `(${PRODUCT_CATEGORY_LABELS[product.category]}) for ₹${(purchase.amountInPaise / 100).toLocaleString("en-IN")}. ` +
      (highTouch ? "Needs manual onboarding follow-up." : ""),
  );

  await prisma.productPurchase.update({
    where: { id: purchase.id },
    data: { fulfilledAt: new Date() },
  });
}

/** Used by the product detail/confirmation UI to decide whether to show the
 * manual WhatsApp fallback link (see fulfillProductPurchase's note above). */
export function shouldOfferWhatsAppHandoff(category: keyof typeof PRODUCT_CATEGORY_LABELS): boolean {
  return isHighTouchCategory(category as Parameters<typeof isHighTouchCategory>[0]);
}

export function tgaManagerWhatsAppLink(text: string): string | null {
  const manager = clientConfig.paymentInfo.managers[0];
  if (!manager) return null;
  return `https://wa.me/${manager.phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}
