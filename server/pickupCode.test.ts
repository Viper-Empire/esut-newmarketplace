import { describe, expect, it } from "vitest";
import { decryptPickupCode, encryptPickupCode, generatePickupCode, matchesPickupCode } from "./pickupCode";

describe("pickup confirmation codes", () => {
  it("generates six numeric digits and encrypts them without storing plaintext", () => {
    const code = generatePickupCode();
    const ciphertext = encryptPickupCode(code);
    expect(code).toMatch(/^\d{6}$/);
    expect(ciphertext).not.toContain(code);
    expect(decryptPickupCode(ciphertext)).toBe(code);
  });

  it("rejects malformed or tampered ciphertext safely", () => {
    const ciphertext = encryptPickupCode("123456");
    expect(decryptPickupCode(`${ciphertext}tampered`)).toBeNull();
    expect(decryptPickupCode("not-a-code")).toBeNull();
  });

  it("accepts only the exact six-digit code", () => {
    expect(matchesPickupCode("123456", "123456")).toBe(true);
    expect(matchesPickupCode(" 123456 ", "123456")).toBe(true);
    expect(matchesPickupCode("12345", "123456")).toBe(false);
    expect(matchesPickupCode("123457", "123456")).toBe(false);
    expect(matchesPickupCode("abcdef", "123456")).toBe(false);
  });
});
