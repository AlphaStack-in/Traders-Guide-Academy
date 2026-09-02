import { NextResponse } from "next/server";
import { createAdminUpdatesTokenRequest } from "@/lib/ably";

// Token endpoint for the notification bell's Ably subscription (see
// notification-bell.tsx) -- issues a short-lived, subscribe-only token so
// the browser never sees the real ABLY_API_KEY. Returns 503 when Ably
// isn't configured; the client treats that as "no push available" and
// just keeps using its fallback poll.
export async function GET() {
  const tokenRequest = await createAdminUpdatesTokenRequest();

  if (!tokenRequest) {
    return NextResponse.json(
      { error: "Realtime notifications aren't configured." },
      { status: 503 },
    );
  }

  return NextResponse.json(tokenRequest);
}
