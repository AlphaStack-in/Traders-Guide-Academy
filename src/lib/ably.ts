import { Rest, type TokenRequest } from "ably";
import { ADMIN_UPDATES_CHANNEL, ADMIN_UPDATE_EVENT, type AdminUpdatePushPayload } from "@/lib/ably-shared";

// Mirrors the existing Telegram integration (see src/lib/telegram.ts):
// silently no-op when the API key isn't configured, so local dev / a
// fresh clone keeps working without it -- subscribers just fall back to
// the notification bell's periodic poll instead of an instant push.
let restClient: Rest | null | undefined;

function getAblyRestClient(): Rest | null {
  if (restClient !== undefined) return restClient;

  const apiKey = process.env.ABLY_API_KEY;
  if (!apiKey) {
    console.warn(
      "Ably not configured -- admin updates will only reach subscribers via polling.",
    );
    restClient = null;
    return restClient;
  }

  restClient = new Rest(apiKey);
  return restClient;
}

// Publishes to ADMIN_UPDATES_CHANNEL (see ably-shared.ts) -- every
// subscriber's browser is listening there for any admin-authored update.
// Call this right after prisma.adminUpdate.create() -- see the four call
// sites in signals/actions.ts and the one in subscribers/actions.ts -- so
// the notification bell and the "Admin Updates" panel both update
// instantly instead of waiting on their fallback poll.
export async function publishAdminUpdate(update: {
  id: string;
  signalId?: string | null;
  strike?: number | null;
  optionType?: string | null;
  instrument?: string | null;
  message: string;
  createdAt: Date;
}): Promise<void> {
  const client = getAblyRestClient();
  if (!client) return;

  const payload: AdminUpdatePushPayload = {
    id: update.id,
    signalId: update.signalId ?? null,
    strike: update.strike ?? null,
    optionType: update.optionType ?? null,
    instrument: update.instrument ?? null,
    message: update.message,
    createdAt: update.createdAt.toISOString(),
  };

  try {
    await client.channels.get(ADMIN_UPDATES_CHANNEL).publish(ADMIN_UPDATE_EVENT, payload);
  } catch (err) {
    // Best-effort -- a failed publish just means this one update reaches
    // subscribers via the notification bell's fallback poll instead of
    // instantly. Never let a push failure break the admin action itself.
    console.error("Ably publish failed:", err);
  }
}

// Issues a short-lived, subscribe-only token for anonymous browsers -- the
// real ABLY_API_KEY never reaches the client. Used by
// src/app/api/ably-auth/route.ts. Scoped to just this one channel and just
// the "subscribe" capability, since this is a one-way broadcast: no
// visitor ever needs to publish.
export async function createAdminUpdatesTokenRequest(): Promise<TokenRequest | null> {
  const client = getAblyRestClient();
  if (!client) return null;

  return client.auth.createTokenRequest({
    capability: { [ADMIN_UPDATES_CHANNEL]: ["subscribe"] },
  });
}
