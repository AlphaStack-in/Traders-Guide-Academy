import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateUnsubscribeToken, verifyUnsubscribeToken } from "../unsubscribe";

describe("unsubscribe tokens", () => {
  beforeEach(() => {
    vi.stubEnv("DIGEST_UNSUBSCRIBE_SECRET", "test-secret-key-for-hmac-signing");
  });

  it("generates a hex token", () => {
    const token = generateUnsubscribeToken("subscriber-123");
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it("round-trips correctly", () => {
    const subscriberId = "subscriber-456";
    const token = generateUnsubscribeToken(subscriberId);
    expect(verifyUnsubscribeToken(subscriberId, token)).toBe(true);
  });

  it("rejects tampered tokens", () => {
    const subscriberId = "subscriber-789";
    const token = generateUnsubscribeToken(subscriberId);
    // Flip one character
    const tampered = token.slice(0, -1) + (token.endsWith("0") ? "1" : "0");
    expect(verifyUnsubscribeToken(subscriberId, tampered)).toBe(false);
  });

  it("rejects tokens for wrong subscriber", () => {
    const token = generateUnsubscribeToken("subscriber-aaa");
    expect(verifyUnsubscribeToken("subscriber-bbb", token)).toBe(false);
  });

  it("generates different tokens for different subscribers", () => {
    const token1 = generateUnsubscribeToken("sub-1");
    const token2 = generateUnsubscribeToken("sub-2");
    expect(token1).not.toBe(token2);
  });

  it("is deterministic for the same subscriber", () => {
    const token1 = generateUnsubscribeToken("sub-1");
    const token2 = generateUnsubscribeToken("sub-1");
    expect(token1).toBe(token2);
  });
});
