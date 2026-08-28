import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cashfreeWebhookEventId, verifyCashfreeWebhookSignature } from "@/lib/cashfree";
import { sendTelegramMessage } from "@/lib/telegram";
import type { SubscriptionStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

// Cashfree subscription_status -> our SubscriptionStatus. Any status
// Cashfree adds later that we don't recognize yet falls back to leaving the
// row untouched rather than guessing (see the `if (!mapped) return` below).
// Reference: https://www.cashfree.com/docs/payments/subscription/create#subscription-lifecycle
const STATUS_MAP: Record<string, SubscriptionStatus> = {
  INITIALIZED: "CREATED",
  BANK_APPROVAL_PENDING: "AUTHENTICATED",
  ACTIVE: "ACTIVE",
  ON_HOLD: "HALTED",
  CUSTOMER_PAUSED: "HALTED",
  CUSTOMER_CANCELLED: "CANCELLED",
  COMPLETED: "COMPLETED",
  EXPIRED: "EXPIRED",
  LINK_EXPIRED: "EXPIRED",
};

const PAYMENT_STATUS_MAP: Record<string, "AUTHORIZED" | "CAPTURED" | "FAILED" | "REFUNDED"> = {
  SUCCESS: "CAPTURED",
  FAILED: "FAILED",
  CANCELLED: "FAILED",
  INITIALIZED: "AUTHORIZED",
};

// NOTE: Cashfree's own subscription webhook payloads weren't directly
// inspectable while building this (no live sandbox account yet — see
// cashfree-autopay-handoff.md). The shape
// below follows Cashfree's documented envelope ({ type, event_time, data })
// and the "key fields" listed for each subscription event type; verify the
// exact nesting against a real sandbox test event once CASHFREE_CLIENT_ID
// is set up, and adjust the `subEntity`/`payEntity` extraction below if
// field paths differ (e.g. flatter than expected).
interface CashfreeSubscriptionEntity {
  subscription_id: string;
  subscription_status?: string;
  next_schedule_date?: string | null;
}
interface CashfreePaymentEntity {
  payment_id: string;
  subscription_id?: string;
  payment_amount: number;
  payment_status?: string;
  failureReason?: string | null;
}
interface CashfreeWebhookBody {
  type: string;
  event_time?: string;
  data: {
    subscription?: CashfreeSubscriptionEntity;
    payment?: CashfreePaymentEntity;
    subscription_id?: string;
    subscription_status?: string;
    payment_id?: string;
    payment_status?: string;
    payment_amount?: number;
    failureReason?: string | null;
  };
}

function extractSubscriptionEntity(body: CashfreeWebhookBody): CashfreeSubscriptionEntity | null {
  if (body.data.subscription) return body.data.subscription;
  if (body.data.subscription_id) {
    return { subscription_id: body.data.subscription_id, subscription_status: body.data.subscription_status };
  }
  return null;
}

function extractPaymentEntity(body: CashfreeWebhookBody): CashfreePaymentEntity | null {
  if (body.data.payment) return body.data.payment;
  if (body.data.payment_id) {
    return {
      payment_id: body.data.payment_id,
      subscription_id: body.data.subscription_id,
      payment_amount: body.data.payment_amount ?? 0,
      payment_status: body.data.payment_status,
      failureReason: body.data.failureReason,
    };
  }
  return null;
}

async function upsertSubscriptionFromEntity(entity: CashfreeSubscriptionEntity) {
  const mapped = entity.subscription_status ? STATUS_MAP[entity.subscription_status] : undefined;
  if (!mapped) return null;

  const existing = await prisma.subscription.findUnique({
    where: { providerSubscriptionId: entity.subscription_id },
  });
  if (!existing) return null; // Not one we created (or a stale/manual test event) — nothing to update.

  return prisma.subscription.update({
    where: { id: existing.id },
    data: {
      status: mapped,
      currentPeriodEnd: entity.next_schedule_date ? new Date(entity.next_schedule_date) : existing.currentPeriodEnd,
      ...(mapped === "ACTIVE" ? { lastPaymentFailedAt: null, failureReason: null } : {}),
    },
    include: { subscriber: true },
  });
}

async function recordPaymentFromEntity(entity: CashfreePaymentEntity) {
  const status = entity.payment_status ? PAYMENT_STATUS_MAP[entity.payment_status] ?? "CREATED" : "CREATED";

  const subscription = entity.subscription_id
    ? await prisma.subscription.findUnique({ where: { providerSubscriptionId: entity.subscription_id } })
    : null;
  if (!subscription) return null; // A payment we have no matching subscription for — not ours to record.

  await prisma.payment.upsert({
    where: { providerPaymentId: entity.payment_id },
    create: {
      subscriberId: subscription.subscriberId,
      subscriptionId: subscription.id,
      providerPaymentId: entity.payment_id,
      amountInPaise: Math.round(entity.payment_amount * 100),
      status,
      failureReason: entity.failureReason ?? null,
    },
    update: {
      status,
      failureReason: entity.failureReason ?? null,
    },
  });

  return subscription;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-webhook-signature");
  const timestamp = request.headers.get("x-webhook-timestamp");

  if (!verifyCashfreeWebhookSignature(rawBody, timestamp, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let body: CashfreeWebhookBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  // Cashfree retries a webhook delivery if it doesn't get a fast 2xx, so
  // the same event can arrive more than once — dedupe on a hash of
  // timestamp+body (Cashfree sends no dedicated event-id header).
  const eventId = cashfreeWebhookEventId(timestamp!, rawBody);
  try {
    await prisma.webhookEvent.create({
      data: { eventId, eventType: body.type, payload: body as unknown as object },
    });
  } catch {
    // Unique constraint hit -> already processed this exact delivery. Ack and stop.
    return NextResponse.json({ received: true, duplicate: true });
  }

  const subEntity = extractSubscriptionEntity(body);
  const payEntity = extractPaymentEntity(body);

  if (subEntity && body.type === "SUBSCRIPTION_STATUS_CHANGE") {
    const updated = await upsertSubscriptionFromEntity(subEntity);
    if (updated) {
      if (updated.status === "ACTIVE") {
        await sendTelegramMessage(
          `✅ ${updated.subscriber.name} (${updated.subscriber.phone}) started Autopay on the ${updated.billingCycle.toLowerCase()} plan.`,
        );
      } else if (updated.status === "HALTED") {
        await sendTelegramMessage(
          `⚠️ Autopay HALTED for ${updated.subscriber.name} (${updated.subscriber.phone}) — repeated charge failures or a customer pause. Follow up manually.`,
        );
      } else if (updated.status === "CANCELLED") {
        await sendTelegramMessage(
          `🔕 Autopay cancelled for ${updated.subscriber.name} (${updated.subscriber.phone}).`,
        );
      }
    }
  }

  if (payEntity && (body.type === "SUBSCRIPTION_PAYMENT_SUCCESS" || body.type === "SUBSCRIPTION_PAYMENT_FAILED")) {
    const subscription = await recordPaymentFromEntity(payEntity);
    if (subscription) {
      const subscriber = await prisma.subscriber.findUnique({ where: { id: subscription.subscriberId } });
      if (body.type === "SUBSCRIPTION_PAYMENT_FAILED") {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { lastPaymentFailedAt: new Date(), failureReason: payEntity.failureReason ?? "Payment failed" },
        });
        if (subscriber) {
          await sendTelegramMessage(
            `❌ Autopay charge failed for ${subscriber.name} (${subscriber.phone}): ${payEntity.failureReason ?? "unknown reason"}.`,
          );
        }
      } else if (subscriber) {
        await sendTelegramMessage(
          `💳 Autopay renewal charged for ${subscriber.name} (${subscriber.phone}) — ₹${payEntity.payment_amount.toLocaleString("en-IN")}.`,
        );
      }
    }
  }

  return NextResponse.json({ received: true });
}
