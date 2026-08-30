import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/utils";
import { verifySessionToken } from "@/lib/session-cookie";
import { createAdminSession } from "@/lib/admin-rbac";
import { createSubscriberSession } from "@/lib/subscriber-auth";
import {
  GOOGLE_OAUTH_FLOW_COOKIE,
  exchangeGoogleCode,
  type GoogleOAuthFlowPayload,
  type GoogleOAuthRole,
} from "@/lib/google-oauth";

/**
 * Google redirects the browser back here with ?code&state (or ?error if the
 * user declined). We verify state against the signed flow cookie set by
 * .../start/route.ts, exchange the code for tokens, and fetch the verified
 * Google profile — then branch on the role that flow cookie recorded:
 *
 *   - admin: the Google account's email must exactly match ADMIN_EMAIL
 *     (there is still only one admin account — see src/lib/admin-rbac.ts).
 *     No schema change needed; this is just an alternate credential for the
 *     same env-var-defined identity password login already grants.
 *
 *   - subscriber: Google only ever authenticates an *existing* subscriber
 *     (matched by Subscriber.googleId, or by verified email on first use,
 *     which backfills googleId). It never creates a new subscriber, because
 *     registration also collects a phone number Google doesn't provide —
 *     see src/app/register/actions.ts. A Google account with no matching
 *     subscriber is sent back to /login with an explanatory error.
 */

function fail(request: NextRequest, loginPage: string, errorCode: string): NextResponse {
  const url = new URL(loginPage, request.url);
  url.searchParams.set("error", errorCode);
  const response = NextResponse.redirect(url);
  response.cookies.delete(GOOGLE_OAUTH_FLOW_COOKIE);
  return response;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const deniedByUser = searchParams.get("error"); // e.g. "access_denied"

  const cookieStore = await cookies();
  const flowToken = cookieStore.get(GOOGLE_OAUTH_FLOW_COOKIE)?.value;
  const flow = await verifySessionToken<GoogleOAuthFlowPayload>(flowToken);

  const role: GoogleOAuthRole = flow?.role ?? "subscriber";
  const loginPage = role === "admin" ? "/admin/login" : "/login";

  if (deniedByUser) return fail(request, loginPage, "google_denied");
  if (!code || !state || !flow || state !== flow.state) {
    return fail(request, loginPage, "google_auth_failed");
  }

  let googleUser;
  try {
    googleUser = await exchangeGoogleCode(code, flow.codeVerifier);
  } catch (err) {
    console.error("Google OAuth exchange failed:", err);
    return fail(request, loginPage, "google_auth_failed");
  }

  if (!googleUser.email || !googleUser.email_verified) {
    return fail(request, loginPage, "google_email_unverified");
  }
  const email = normalizeEmail(googleUser.email);

  if (flow.role === "admin") {
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    if (!adminEmail || email !== adminEmail) {
      return fail(request, loginPage, "google_not_admin");
    }
    await createAdminSession(adminEmail);
    const response = NextResponse.redirect(new URL(flow.redirectTo, request.url));
    response.cookies.delete(GOOGLE_OAUTH_FLOW_COOKIE);
    return response;
  }

  // flow.role === "subscriber"
  let subscriber = await prisma.subscriber.findFirst({ where: { googleId: googleUser.sub } });

  if (!subscriber) {
    const byEmail = await prisma.subscriber.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });
    if (byEmail) {
      subscriber = byEmail.googleId
        ? byEmail
        : await prisma.subscriber.update({
            where: { id: byEmail.id },
            data: { googleId: googleUser.sub },
          });
    }
  }

  if (!subscriber) {
    return fail(request, "/login", "google_no_account");
  }

  await createSubscriberSession(subscriber.id);
  const response = NextResponse.redirect(new URL(flow.redirectTo, request.url));
  response.cookies.delete(GOOGLE_OAUTH_FLOW_COOKIE);
  return response;
}
