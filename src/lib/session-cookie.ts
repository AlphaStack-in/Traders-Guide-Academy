/**
 * Minimal, dependency-free signed-session token helper.
 *
 * Token format: "<base64url(json payload)>.<base64url(hmac-sha256 sig)>".
 * Built on the Web Crypto API (globalThis.crypto / crypto.subtle) rather
 * than node:crypto, so this same code runs unchanged in:
 *   - Server Actions and Route Handlers (Node.js runtime)
 *   - src/proxy.ts (Next.js middleware, Edge runtime by default)
 *
 * Fail-closed: every call requires SESSION_SECRET to be set; there is no
 * "unsigned" fallback mode.
 */

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not set — cannot create or verify session tokens.");
  }
  return secret;
}

async function getHmacKey(): Promise<CryptoKey> {
  const keyData = new TextEncoder().encode(getSecret());
  return crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(input: string): Uint8Array {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function sign(payloadB64: string): Promise<string> {
  const key = await getHmacKey();
  const sigBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
  return toBase64Url(new Uint8Array(sigBuffer));
}

export async function createSessionToken(payload: object, maxAgeSeconds: number): Promise<string> {
  const body = { ...payload, exp: Date.now() + maxAgeSeconds * 1000 };
  const payloadB64 = toBase64Url(new TextEncoder().encode(JSON.stringify(body)));
  const signature = await sign(payloadB64);
  return `${payloadB64}.${signature}`;
}

/**
 * Verifies a token's signature and expiry. Returns the decoded payload (with
 * its `exp` field) on success, or null on any failure — bad signature,
 * malformed token, missing SESSION_SECRET, or expired.
 *
 * Signature comparison is a plain string equality check on two fixed-length
 * (43-char, unpadded base64url SHA-256) digests — not constant-time, but an
 * accepted tradeoff here: no secret-dependent length is ever exposed, and
 * this isn't defending a high-value target. If that changes, swap in
 * node:crypto's timingSafeEqual for the Node.js call sites.
 */
export async function verifySessionToken<T>(token: string | undefined | null): Promise<T | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, signature] = parts;

  let expectedSig: string;
  try {
    expectedSig = await sign(payloadB64);
  } catch {
    return null;
  }

  if (signature.length !== expectedSig.length || signature !== expectedSig) {
    return null;
  }

  try {
    const json = new TextDecoder().decode(fromBase64Url(payloadB64));
    const parsed = JSON.parse(json) as T & { exp: number };
    if (typeof parsed.exp !== "number" || parsed.exp < Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
