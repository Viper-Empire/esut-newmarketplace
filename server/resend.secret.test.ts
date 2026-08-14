import { describe, expect, it } from "vitest";

describe("Resend credentials", () => {
  it("has a configured sender identity", () => {
    expect(process.env.RESEND_FROM_EMAIL).toMatch(/^(?:[^<>]+\s<)?[^\s@<>]+@[^\s@<>]+>?$/);
  });

  it("authenticates against the Resend transactional-send endpoint", async () => {
    const apiKey = process.env.RESEND_API_KEY;
    expect(apiKey).toBeTruthy();
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const body = await response.text();
    expect(response.status, body).not.toBe(401);
    expect(response.status, body).not.toBe(403);
  }, 15_000);
});
