import { NextResponse, type NextRequest } from "next/server";
import { createSessionToken } from "@/lib/session-cookie";
import {
  GOOGLE_OAUTH_FLOW_COOKIE,
  GOOGLE_OAUTH_FLOW_MAX_AGE_SECONDS,
  buildGoogleAuthUrl,
  createPkcePair,
  isGoogleOAuthConfigured,
  randomState,
  type GoogleOAuthFlowPayload,
  type GoogleOAuthRole,
} from "@/lib/google-oauth";

/**
 * Kicks off "Sign in with Google" for either login form (see
 * src/components/auth/google-signin-button.tsx). ?role=admin|subscriber
 * decides which account type the callback authenticates as; ?redirectTo is
 * an optional same-site path to return to after a successful login.
 *
 * State + PKCE code_verifier + role + redirectTo are packed into a
 * short-lived HMAC-signed cookie (10 min) rather than a server-side store —
 * consistent with the rest of this app having no session store beyond
 * signed cookies (see src/lib/session-cookie.ts).
 */

function safeRedirectPath(input: string | null, fallback: string): string {
  if (!input || !input.startsWith("/") || input.startsWith("//")) return fallback;
  return input;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const role: GoogleOAuthRole = searchParams.get("role") === "admin" ? "admin" : "subscriber";
  const loginPage = role === "admin" ? "/admin/login" : "/login";
  const defaultRedirect = role === "admin" ? "/admin/dashboard" : "/signals";
  const redirectTo = safeRedirectPath(searchParams.get("redirectTo"), defaultRedirect);

  if (!isGoogleOAuthConfigured()) {
    const url = new URL(loginPage, request.url);
    url.searchParams.set("error", "google_not_configured");
    return NextResponse.redirect(url);
  }

  const state = randomState();
  const { verifier, challenge } = await createPkcePair();

  const flowPayload: Omit<GoogleOAuthFlowPayload, "exp"> = {
    role,
    state,
    codeVerifier: verifier,
    redirectTo,
  };
  const flowToken = await createSessionToken(flowPayload, GOOGLE_OAUTH_FLOW_MAX_AGE_SECONDS);

  const response = NextResponse.redirect(buildGoogleAuthUrl({ state, codeChallenge: challenge }));
  response.cookies.set(GOOGLE_OAUTH_FLOW_COOKIE, flowToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: GOOGLE_OAUTH_FLOW_MAX_AGE_SECONDS,
  });
  return response;
}
