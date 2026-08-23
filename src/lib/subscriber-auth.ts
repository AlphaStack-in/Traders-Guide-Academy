/**
 * Subscriber (paying customer) session handling.
 *
 * Replaced Supabase Auth's magic-link/password login when TGA moved its
 * database off Supabase onto Neon. Subscribers now log in with an email +
 * password checked against Subscriber.passwordHash (see src/lib/password.ts
 * and src/app/login/actions.ts) instead of a Supabase-issued session.
 *
 * There is currently no self-service password-reset-by-email flow — an
 * admin sets/resets a subscriber's password directly (see the admin
 * subscribers panel). That's a deliberate, scoped-down decision, not an
 * oversight; a follow-up task can add reset emails via Resend later.
 */
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createSessionToken, verifySessionToken } from "@/lib/session-cookie";

export const SUBSCRIBER_SESSION_COOKIE = "subscriber_session";
const SUBSCRIBER_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

interface SubscriberSessionPayload {
  role: "subscriber";
  subscriberId: string;
  exp: number;
}

export async function createSubscriberSession(subscriberId: string): Promise<void> {
  const cookieStore = await cookies();
  const token = await createSessionToken(
    { role: "subscriber", subscriberId },
    SUBSCRIBER_SESSION_MAX_AGE_SECONDS,
  );
  cookieStore.set(SUBSCRIBER_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SUBSCRIBER_SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSubscriberSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SUBSCRIBER_SESSION_COOKIE);
}

export async function getCurrentSubscriber() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SUBSCRIBER_SESSION_COOKIE)?.value;
    const session = await verifySessionToken<SubscriberSessionPayload>(token);
    if (!session || session.role !== "subscriber") return null;

    const subscriber = await prisma.subscriber.findUnique({
      where: { id: session.subscriberId },
    });
    return subscriber ?? null;
  } catch (err: unknown) {
    if ((err as { digest?: string })?.digest !== "DYNAMIC_SERVER_USAGE") {
      console.error("getCurrentSubscriber exception:", err);
    }
    return null;
  }
}

export async function requireSubscriber() {
  const subscriber = await getCurrentSubscriber();
  if (!subscriber) {
    throw new Error("Not authenticated as a subscriber.");
  }
  return subscriber;
}
