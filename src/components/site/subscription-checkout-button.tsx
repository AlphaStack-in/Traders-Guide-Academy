"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import type { BillingCycle } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { createSubscriptionCheckout } from "@/app/account/billing/actions";
import { cn } from "@/lib/utils";

// Minimal shape of the bits of the Cashfree JS SDK's `window.Cashfree`
// global this component actually uses.
interface CashfreeCheckoutInstance {
  subscriptionsCheckout(options: {
    subsSessionId: string;
    redirectTarget?: "_self" | "_blank" | "_top";
  }): Promise<{ error?: { message: string } }>;
}
declare global {
  interface Window {
    Cashfree?: (options: { mode: "sandbox" | "production" }) => CashfreeCheckoutInstance;
  }
}

const CHECKOUT_SCRIPT_SRC = "https://sdk.cashfree.com/js/v3/cashfree.js";
let scriptLoadPromise: Promise<void> | null = null;

function loadCashfreeCheckoutScript(): Promise<void> {
  if (typeof window !== "undefined" && window.Cashfree) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;
  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = CHECKOUT_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptLoadPromise = null;
      reject(new Error("Couldn't load Cashfree checkout."));
    };
    document.body.appendChild(script);
  });
  return scriptLoadPromise;
}

/**
 * Primary self-service checkout CTA for an already-authenticated subscriber
 * (see ContinuePremiumPanel, which renders this alongside the WhatsApp
 * fallback). Kicks off a real UPI Autopay recurring subscription via
 * Cashfree's hosted subscription checkout — the click itself only *starts*
 * checkout; confirmation of an actual successful payment comes from the
 * server-side webhook (src/app/api/webhooks/cashfree/route.ts), not this
 * handler, since the checkout redirect completing is not proof money moved
 * (the customer could still cancel the UPI mandate in their bank app).
 */
export function SubscriptionCheckoutButton({
  billingCycle,
  label = "Subscribe (Autopay)",
  className,
  variant,
  size = "sm",
}: {
  billingCycle: BillingCycle;
  label?: string;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";
  size?: "default" | "sm" | "lg";
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await createSubscriptionCheckout(billingCycle);
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      try {
        await loadCashfreeCheckoutScript();
      } catch {
        toast.error("Couldn't load checkout — check your connection, or use the WhatsApp option below.");
        return;
      }

      if (!window.Cashfree) return;

      const cashfree = window.Cashfree({ mode: result.checkoutMode });
      try {
        const checkoutResult = await cashfree.subscriptionsCheckout({
          subsSessionId: result.subscriptionSessionId,
          redirectTarget: "_self",
        });
        if (checkoutResult?.error) {
          toast.error(checkoutResult.error.message || "Checkout failed — you can retry, or use the WhatsApp option below.");
        }
        // On success, Cashfree navigates the browser to subscription_meta.return_url itself
        // (see billing/actions.ts) — nothing further to do here.
      } catch {
        toast.error("Checkout failed — you can retry, or use the WhatsApp option below.");
      }
    });
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={isPending}
      onClick={handleClick}
      className={cn("signalflow-glow", className)}
    >
      {isPending ? "Preparing checkout…" : label}
    </Button>
  );
}
