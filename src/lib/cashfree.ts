import { createHmac, createHash } from "crypto";

/**
 * Self-service billing (see prisma/schema.prisma Subscription/Payment
 * models and docs/customer-onboarding-runbook.md). Replaces the old "pay
 * via UPI, confirm over WhatsApp" flow for existing subscribers
 * changing/renewing their plan (see ContinuePremiumPanel) with real UPI
 * Autopay recurring subscriptions through Cashfree. WhatsApp stays as a
 * manual fallback in the UI for subscribers who'd rather not use Autopay,
 * or while this deployment is still on Cashfree's sandbox.
 *
 * Deliberately calling Cashfree's REST API directly with fetch() rather
 * than the `cashfree-pg` npm SDK — same pattern already used elsewhere in
 * this codebase for third-party APIs (see src/lib/telegram.ts,
 * src/lib/broker/dhan-client.ts), and it keeps this to exactly the ~4
 * endpoints we actually use instead of pulling in a large generated client.
 */

const SANDBOX_BASE_URL = "https://sandbox.cashfree.com/pg";
const PRODUCTION_BASE_URL = "https://api.cashfree.com/pg";

// Cashfree API versions are dated (YYYY-MM-DD) — pinned via env var so a
// future Cashfree API change doesn't silently alter behavior; override in
// .env if Cashfree deprecates this version.
const DEFAULT_API_VERSION = "2026-01-01";

export function isCashfreeConfigured(): boolean {
  return Boolean(process.env.CASHFREE_CLIENT_ID && process.env.CASHFREE_CLIENT_SECRET);
}

function getCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.CASHFREE_CLIENT_ID;
  const clientSecret = process.env.CASHFREE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "CASHFREE_CLIENT_ID / CASHFREE_CLIENT_SECRET are not set — sign up at https://www.cashfree.com, " +
        "grab your sandbox API keys, and add them to .env.",
    );
  }
  return { clientId, clientSecret };
}

function getBaseUrl(): string {
  return process.env.CASHFREE_ENV === "production" ? PRODUCTION_BASE_URL : SANDBOX_BASE_URL;
}

/** The env var used both to pick the REST base URL above and to tell the
 * client-side Cashfree JS SDK which mode to boot into (see
 * subscription-checkout-button.tsx) — keeps the two from ever disagreeing. */
export function getCashfreeCheckoutMode(): "sandbox" | "production" {
  return process.env.CASHFREE_ENV === "production" ? "production" : "sandbox";
}

interface CashfreeRequestOptions {
  method: "GET" | "POST";
  path: string;
  body?: unknown;
}

export class CashfreeApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly responseBody: unknown,
  ) {
    super(message);
    this.name = "CashfreeApiError";
  }
}

/** Thin wrapper around Cashfree's REST API — handles auth headers, the
 * sandbox/production base URL switch, and turning a non-2xx response into
 * a thrown error with the response body attached for logging. */
export async function cashfreeRequest<T>({ method, path, body }: CashfreeRequestOptions): Promise<T> {
  const { clientId, clientSecret } = getCredentials();

  const res = await fetch(`${getBaseUrl()}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-client-id": clientId,
      "x-client-secret": clientSecret,
      "x-api-version": process.env.CASHFREE_API_VERSION || DEFAULT_API_VERSION,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const responseBody = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      (responseBody as { message?: string } | null)?.message ?? `Cashfree API error (HTTP ${res.status})`;
    throw new CashfreeApiError(message, res.status, responseBody);
  }
  return responseBody as T;
}

/**
 * Verifies the `x-webhook-signature` header on an incoming Cashfree
 * webhook request against the raw (unparsed) request body — must be
 * called with the exact bytes Cashfree signed, before any JSON.parse.
 *
 * Per Cashfree's webhook docs: signature = base64(HMAC-SHA256(secret,
 * timestamp + rawBody)), where `secret` is the account's client secret
 * (CASHFREE_WEBHOOK_SECRET can override this if Cashfree's dashboard ever
 * issues a distinct per-webhook secret for this deployment — falls back to
 * the client secret when unset, which is the documented default).
 */
export function verifyCashfreeWebhookSignature(
  rawBody: string,
  timestamp: string | null,
  signature: string | null,
): boolean {
  const secret = process.env.CASHFREE_WEBHOOK_SECRET || process.env.CASHFREE_CLIENT_SECRET;
  if (!secret || !timestamp || !signature) return false;
  try {
    const expected = createHmac("sha256", secret).update(timestamp + rawBody).digest("base64");
    return expected === signature;
  } catch {
    return false;
  }
}

/** Deterministic dedupe key for a webhook delivery — Cashfree doesn't send
 * a dedicated event-id header, so a retried delivery of the exact same
 * event hashes to the same id and the WebhookEvent unique constraint makes
 * it a no-op (see prisma/schema.prisma). */
export function cashfreeWebhookEventId(timestamp: string, rawBody: string): string {
  return createHash("sha256").update(timestamp + rawBody).digest("hex");
}
