"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createProductCheckout, claimFreeProduct } from "@/app/products/actions";
import { formatPriceInPaise } from "@/lib/products";
import { cn } from "@/lib/utils";

// Minimal shape of the bits of the Cashfree JS SDK's `window.Cashfree`
// global this component actually uses — Orders API checkout, distinct from
// subscription-checkout-button.tsx's subscriptionsCheckout() call.
interface CashfreeCheckoutInstance {
  checkout(options: {
    paymentSessionId: string;
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
 * The catalog/detail-page buy button — price-only label (no "Buy Now"
 * text), matching the approved mockup. Paid products open Cashfree's
 * one-time Orders checkout; free products call claimFreeProduct directly,
 * no Cashfree involved. Not logged in yet -> sends the visitor to log in
 * first rather than silently failing inside requireSubscriber().
 */
export function ProductCheckoutButton({
  productId,
  priceInPaise,
  isAuthenticated,
  className,
  style,
}: {
  productId: string;
  priceInPaise: number;
  isAuthenticated: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const isFree = priceInPaise === 0;

  function handleClick() {
    if (!isAuthenticated) {
      router.push(`/login?redirectTo=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    startTransition(async () => {
      if (isFree) {
        const result = await claimFreeProduct(productId);
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        toast.success("Enrolled! Check your email for access details.");
        return;
      }

      const result = await createProductCheckout(productId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      try {
        await loadCashfreeCheckoutScript();
      } catch {
        toast.error("Couldn't load checkout — check your connection.");
        return;
      }

      if (!window.Cashfree) return;

      const cashfree = window.Cashfree({ mode: result.checkoutMode });
      try {
        const checkoutResult = await cashfree.checkout({
          paymentSessionId: result.paymentSessionId,
          redirectTarget: "_self",
        });
        if (checkoutResult?.error) {
          toast.error(checkoutResult.error.message || "Checkout failed — you can retry.");
        }
        // On success, Cashfree navigates the browser to order_meta.return_url
        // itself (see actions.ts) — nothing further to do here.
      } catch {
        toast.error("Checkout failed — you can retry.");
      }
    });
  }

  return (
    <Button
      type="button"
      disabled={isPending}
      onClick={handleClick}
      className={cn("signalflow-btn-gradient signalflow-btn-3d", className)}
      style={style}
    >
      {isPending ? "…" : formatPriceInPaise(priceInPaise)}
    </Button>
  );
}
