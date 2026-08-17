import { createCipheriv, createDecipheriv, createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { ENV } from "./_core/env";

const algorithm = "aes-256-gcm";
const codeLength = 6;
const key = createHash("sha256").update(ENV.cookieSecret || "esut-marketplace-local-development").digest();

export function generatePickupCode() {
  return randomInt(0, 1_000_000).toString().padStart(codeLength, "0");
}

export function encryptPickupCode(code: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(code, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map(part => part.toString("base64url")).join(".");
}

export function decryptPickupCode(payload: string | null | undefined) {
  if (!payload) return null;
  try {
    const [ivText, tagText, encryptedText] = payload.split(".");
    if (!ivText || !tagText || !encryptedText) return null;
    const decipher = createDecipheriv(algorithm, key, Buffer.from(ivText, "base64url"));
    decipher.setAuthTag(Buffer.from(tagText, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(encryptedText, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

export function matchesPickupCode(input: string, expected: string | null) {
  const normalized = input.trim();
  if (!expected || !/^\d{6}$/.test(normalized)) return false;
  const inputBuffer = Buffer.from(normalized, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return inputBuffer.length === expectedBuffer.length && timingSafeEqual(inputBuffer, expectedBuffer);
}
