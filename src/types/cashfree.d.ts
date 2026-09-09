/**
 * Shared Cashfree JS SDK globals. Both the subscription checkout button
 * (`subscriptionsCheckout`) and the one-time product checkout button
 * (`checkout`) attach to `window.Cashfree` — declaring the shape once
 * avoids TS2717 conflicts from two local `declare global` blocks.
 */
interface CashfreeCheckoutInstance {
  checkout(options: {
    paymentSessionId: string;
    redirectTarget?: "_self" | "_blank" | "_top";
  }): Promise<{ error?: { message: string } }>;
  subscriptionsCheckout(options: {
    subsSessionId: string;
    redirectTarget?: "_self" | "_blank" | "_top";
  }): Promise<{ error?: { message: string } }>;
}

interface Window {
  Cashfree?: (options: { mode: "sandbox" | "production" }) => CashfreeCheckoutInstance;
}
