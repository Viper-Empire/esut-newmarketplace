import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Cloudflare Pages API function methods", () => {
  it("explicitly exposes the tRPC write methods required by API mutations", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "functions/api/[[path]].ts"), "utf8");
    expect(source).toContain("export function onRequestPost");
    expect(source).toContain("export function onRequestPut");
    expect(source).toContain("export function onRequestPatch");
    expect(source).toContain("export function onRequestDelete");
  });
});
