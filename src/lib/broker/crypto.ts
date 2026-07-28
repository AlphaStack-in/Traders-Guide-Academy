import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getKey(): Buffer {
  const key = process.env.BROKER_TOKEN_ENC_KEY;
  if (!key) {
    throw new Error("BROKER_TOKEN_ENC_KEY is not set.");
  }
  const buffer = Buffer.from(key, "base64");
  if (buffer.length !== 32) {
    throw new Error("BROKER_TOKEN_ENC_KEY must decode to exactly 32 bytes.");
  }
  return buffer;
}

// Stored as "<iv>:<authTag>:<ciphertext>", each base64.
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("base64"), authTag.toString("base64"), ciphertext.toString("base64")].join(
    ":",
  );
}

export function decryptSecret(stored: string): string {
  const [ivB64, authTagB64, ciphertextB64] = stored.split(":");
  if (!ivB64 || !authTagB64 || !ciphertextB64) {
    throw new Error("Malformed encrypted secret.");
  }
  const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(authTagB64, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextB64, "base64")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}
