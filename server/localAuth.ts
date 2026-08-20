import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const keyLength = 64;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/**
 * Canonicalise Nigerian mobile numbers for storage while retaining server-side
 * validation as the source of truth. Formatted values such as
 * `0911 699 1082` and `+234 911 699 1082` become E.164 values.
 */
export function normalizeNigerianPhone(phone: string) {
  const trimmed = phone.trim();
  if (!/^[+\d\s()-]+$/.test(trimmed)) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  if (/^0[7-9]\d{9}$/.test(digits)) return `+234${digits.slice(1)}`;
  if (/^234[7-9]\d{9}$/.test(digits)) return `+${digits}`;
  return trimmed;
}

export function isValidNigerianPhone(phone: string) {
  return /^\+234[7-9]\d{9}$/.test(normalizeNigerianPhone(phone));
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, keyLength) as Buffer;
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string | null | undefined) {
  if (!stored) return false;
  const [algorithm, salt, expected] = stored.split("$");
  if (algorithm !== "scrypt" || !salt || !expected) return false;
  const derived = await scrypt(password, salt, keyLength) as Buffer;
  const expectedBuffer = Buffer.from(expected, "hex");
  return expectedBuffer.length === derived.length && timingSafeEqual(expectedBuffer, derived);
}

export function createOpaqueToken() {
  return randomBytes(32).toString("base64url");
}

export function hashOpaqueToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
