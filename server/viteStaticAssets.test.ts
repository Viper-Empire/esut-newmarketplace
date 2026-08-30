import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./_core/vite.ts", import.meta.url), "utf8");

describe("static dynamic-import asset handling", () => {
  it("does not fall through missing assets to the SPA HTML shell", () => {
    expect(source).toContain('app.use("/assets"');
    expect(source).toContain('res.status(404).type("text/plain").send("Asset not found")');
  });

  it("revalidates the SPA shell while keeping existing assets cacheable", () => {
    expect(source).toContain('res.setHeader("Cache-Control", "public, max-age=31536000, immutable")');
    expect(source).toContain('res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate")');
  });
});
