import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Cloudflare staging build configuration", () => {
  it("uses explicit one-way shared chunks without a catch-all vendor runtime", () => {
    const config = readFileSync(resolve(process.cwd(), "vite.config.ts"), "utf8");

    expect(config).toContain("onlyExplicitManualChunks: true");
    expect(config).toContain('return "react-runtime"');
    expect(config).toContain('return "data-runtime"');
    expect(config).not.toContain('return "vendor-runtime"');
    expect(config).toContain('outDir: path.resolve(import.meta.dirname, "dist/public")');
  });

  it("keeps the static Vite output separate from the root Pages Function source", () => {
    const packageJson = readFileSync(resolve(process.cwd(), "package.json"), "utf8");

    expect(packageJson).toContain('"build:frontend": "vite build"');
    expect(packageJson).toContain("wrangler pages deploy dist/public");
  });
});
