"use server";

import { prisma } from "@/lib/prisma";
import { requireSubscriber } from "@/lib/subscriber-auth";
import { isCashfreeConfigured, getCashfreeCheckoutMode, CashfreeApiError } from "@/lib/cashfree";
import { createCashfreeOrder } from "@/lib/cashfree-orders";
import { fulfillProductPurchase } from "@/lib/product-fulfillment";

/**
 * Starts a one-time Cashfree Orders checkout for a paid product. Mirrors
 * createSubscriptionCheckout (src/app/account/billing/actions.ts): the
 * subscriber must already be authenticated (no subscriberId is ever
 * accepted from the client), local state is created optimistically
 * ("CREATED"), and the webhook handler
 * (src/app/api/webhooks/cashfree/route.ts) is the source of truth once
 * Cashfree confirms the charge.
 */
export async function createProductCheckout(productId: string) {
  if (!isCashfreeConfigured()) {
    return {
      success: false as const,
      error: "Online checkout isn't set up yet — use the WhatsApp option instead.",
    };
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) {
    return { success: false as const, error: "This product isn't available." };
  }
  if (product.priceInPaise === 0) {
    return { success: false as const, error: "This is a free product — use the Enroll Free button instead." };
  }

  const subscriber = await requireSubscriber();

  if (!subscriber.email) {
    return {
      success: false as const,
      error: "Add an email to your profile first (needed for the payment receipt), or use the WhatsApp option instead.",
    };
  }

  const orderId = `prod_${subscriber.id.replace(/-/g, "")}_${Date.now()}`;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  let response;
  try {
    response = await createCashfreeOrder({
      orderId,
      amountInPaise: product.priceInPaise,
      customerName: subscriber.name,
      customerEmail: subscriber.email,
      customerPhone: subscriber.phone,
      returnUrl: `${baseUrl}/products/${product.slug}?order=complete`,
    });
  } catch (err) {
    const message = err instanceof CashfreeApiError ? err.message : "Couldn't start checkout.";
    return { success: false as const, error: `${message} — try again, or use the WhatsApp option instead.` };
  }

  if (!response.payment_session_id) {
    return {
      success: false as const,
      error: "Cashfree didn't return a checkout session — try again, or use the WhatsApp option instead.",
    };
  }

  await prisma.productPurchase.create({
    data: {
      subscriberId: subscriber.id,
      productId: product.id,
      providerOrderId: orderId,
      amountInPaise: product.priceInPaise,
      status: "CREATED",
    },
  });

  return {
    success: true as const,
    paymentSessionId: response.payment_session_id,
    checkoutMode: getCashfreeCheckoutMode(),
  };
}

/**
 * Grants a free product immediately — no Cashfree order at all. Idempotent:
 * a subscriber who already claimed it just gets success back again rather
 * than a duplicate purchase row.
 */
export async function claimFreeProduct(productId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) {
    return { success: false as const, error: "This product isn't available." };
  }
  if (product.priceInPaise !== 0) {
    return { success: false as const, error: "This product isn't free — use the checkout button instead." };
  }

  const subscriber = await requireSubscriber();

  const existing = await prisma.productPurchase.findFirst({
    where: { subscriberId: subscriber.id, productId: product.id, status: "CAPTURED" },
  });
  if (existing) {
    return { success: true as const };
  }

  const purchase = await prisma.productPurchase.create({
    data: {
      subscriberId: subscriber.id,
      productId: product.id,
      amountInPaise: 0,
      status: "CAPTURED",
    },
  });

  await fulfillProductPurchase(purchase.id);

  return { success: true as const };
}
