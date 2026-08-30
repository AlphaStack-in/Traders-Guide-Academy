/**
 * Google OAuth 2.0 (Authorization Code + PKCE), implemented directly against
 * Google's endpoints with no external dependency (no next-auth, no arctic,
 * no passport) — the same "dependency-free, Web Crypto based" approach as
 * src/lib/session-cookie.ts, which this reuses to sign the short-lived
 * "flow" cookie that carries state + PKCE verifier between the two OAuth
 * route handlers (src/app/api/auth/google/start and .../callback).
 *
 * Optional feature: if GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET aren't set,
 * isGoogleOAuthConfigured() is false and the "Continue with Google" buttons
 * redirect back with a clear "not configured" error — exactly like
 * Telegram/Resend elsewhere in this app being silently skipped when unset.
 * Nothing here gates the build (see scripts/check-build-health.ts) and
 * password login for admin + subscribers is unaffected either way.
 */

export type GoogleOAuthRole = "admin" | "subscriber";

export const GOOGLE_OAUTH_FLOW_COOKIE = "google_oauth_flow";
export const GOOGLE_OAUTH_FLOW_MAX_AGE_SECONDS = 600; // 10 minutes

export interface GoogleOAuthFlowPayload {
  role: GoogleOAuthRole;
  state: string;
  codeVerifier: string;
  redirectTo: string;
  exp: number;
}

const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_ENDPOINT = "https://openidconnect.googleapis.com/v1/userinfo";

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

/**
 * Redirect URI Google sends the browser back to. Must exactly match one of
 * the "Authorized redirect URIs" configured on the OAuth client in the
 * Google Cloud Console — see .env.example for the exact value to register.
 */
function getRedirectUri(): string {
  const base = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
  return `${base}/api/auth/google/callback`;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function randomState(): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(24)));
}

/** PKCE pair — code_verifier stays server-side (in the signed flow cookie); only the S256 code_challenge is sent to Google. */
export async function createPkcePair(): Promise<{ verifier: string; challenge: string }> {
  const verifier = toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  const challenge = toBase64Url(new Uint8Array(digest));
  return { verifier, challenge };
}

export function buildGoogleAuthUrl(params: { state: string; codeChallenge: string }): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error("GOOGLE_CLIENT_ID is not set.");

  const url = new URL(GOOGLE_AUTH_ENDPOINT);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", getRedirectUri());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", params.state);
  url.searchParams.set("code_challenge", params.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("access_type", "online");
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

export interface GoogleUserInfo {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

/** Exchanges an authorization code for tokens, then fetches the OpenID Connect userinfo. Throws on any failure — callers redirect to a generic error on catch. */
export async function exchangeGoogleCode(code: string, codeVerifier: string): Promise<GoogleUserInfo> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth is not configured (GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET unset).");
  }

  const tokenRes = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      code_verifier: codeVerifier,
      grant_type: "authorization_code",
      redirect_uri: getRedirectUri(),
    }),
  });

  if (!tokenRes.ok) {
    throw new Error(`Google token exchange failed (${tokenRes.status}): ${await tokenRes.text()}`);
  }

  const tokenJson = (await tokenRes.json()) as { access_token?: string };
  if (!tokenJson.access_token) {
    throw new Error("Google token exchange response had no access_token.");
  }

  const userRes = await fetch(GOOGLE_USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });

  if (!userRes.ok) {
    throw new Error(`Google userinfo fetch failed (${userRes.status}): ${await userRes.text()}`);
  }

  return (await userRes.json()) as GoogleUserInfo;
}
