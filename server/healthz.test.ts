import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("deployment health endpoint", () => {
  it("is registered as a public JSON health check without marketplace data", async () => {
    const source = await readFile(new URL("./_core/index.ts", import.meta.url), "utf8");

    expect(source).toContain('app.get("/healthz"');
    expect(source).toContain('res.status(200).json({ ok: true, service: "esut-marketplace" })');
  });
});
