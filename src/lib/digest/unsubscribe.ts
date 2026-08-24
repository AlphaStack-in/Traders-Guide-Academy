import { createHmac, timingSafeEqual } from "crypto";

function getSecret(): string {
  const secret = process.env.DIGEST_UNSUBSCRIBE_SECRET;
  if (!secret) {
    throw new Error("DIGEST_UNSUBSCRIBE_SECRET is not set");
  }
  return secret;
}

/**
 * Generates an HMAC-SHA256 token for the given subscriber ID, used in
 * unsubscribe links in the weekly digest email.
 */
export function generateUnsubscribeToken(subscriberId: string): string {
  const hmac = createHmac("sha256", getSecret());
  hmac.update(subscriberId);
  return hmac.digest("hex");
}

/**
 * Verifies that the provided token matches the expected HMAC for the
 * subscriber ID. Returns false if the token is invalid or the secret
 * has been rotated since the token was generated.
 */
export function verifyUnsubscribeToken(
  subscriberId: string,
  token: string,
): boolean {
  try {
    const expected = generateUnsubscribeToken(subscriberId);
    // Constant-time comparison to prevent timing attacks
    const expectedBuf = Buffer.from(expected, "hex");
    const tokenBuf = Buffer.from(token, "hex");
    if (expectedBuf.length !== tokenBuf.length) return false;
    return timingSafeEqual(expectedBuf, tokenBuf);
  } catch {
    return false;
  }
}
