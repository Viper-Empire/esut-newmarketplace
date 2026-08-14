import { describe, expect, it } from "vitest";
import { createOpaqueToken, hashOpaqueToken, hashPassword, normalizeEmail, verifyPassword } from "./localAuth";

describe("local authentication primitives", () => {
  it("normalizes email and verifies only the original password", async () => {
    const passwordHash = await hashPassword("CampusPass123!");
    expect(normalizeEmail("  Student@ESUT.edu.ng ")).toBe("student@esut.edu.ng");
    expect(await verifyPassword("CampusPass123!", passwordHash)).toBe(true);
    expect(await verifyPassword("wrong-password", passwordHash)).toBe(false);
  });
  it("creates opaque tokens and stores only deterministic hashes", () => {
    const token = createOpaqueToken();
    expect(token.length).toBeGreaterThan(30);
    expect(hashOpaqueToken(token)).toHaveLength(64);
    expect(hashOpaqueToken(token)).toBe(hashOpaqueToken(token));
  });
});
