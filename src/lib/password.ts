/**
 * Password hashing for admin + subscriber accounts.
 *
 * Uses Node's built-in scrypt KDF (node:crypto) — no external dependency
 * (bcrypt/argon2/etc.) needed. Stored format: "<saltHex>:<hashHex>".
 */
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

/**
 * Hashes a plaintext password. Safe to store the result directly (e.g. in
 * ADMIN_PASSWORD_HASH or Subscriber.passwordHash).
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEY_LENGTH);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

/**
 * Verifies a plaintext password against a hash produced by hashPassword().
 * Timing-safe comparison; never throws on malformed/missing input.
 */
export function verifyPassword(password: string, storedHash: string | null | undefined): boolean {
  if (!storedHash) return false;
  const [saltHex, hashHex] = storedHash.split(":");
  if (!saltHex || !hashHex) return false;

  try {
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    const actual = scryptSync(password, salt, expected.length);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
