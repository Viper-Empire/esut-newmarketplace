import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const css = fs.readFileSync(path.join(process.cwd(), "client/src/index.css"), "utf8");
const dialog = fs.readFileSync(path.join(process.cwd(), "client/src/components/ManusDialog.tsx"), "utf8");
const skeleton = fs.readFileSync(path.join(process.cwd(), "client/src/components/DashboardLayoutSkeleton.tsx"), "utf8");

describe("narrow-mobile responsive contracts", () => {
  it("stacks public product cards and keeps category scrolling local below 480px", () => {
    expect(css).toContain("@media(max-width:479px)");
    expect(css).toContain(".product-grid{grid-template-columns:minmax(0,1fr)}");
    expect(css).toContain(".category-row{display:flex");
    expect(css).toContain("overflow-x:auto");
  });

  it("keeps dialogs inside the viewport at 320px", () => {
    expect(dialog).toContain("w-[min(400px,calc(100vw-2rem))]");
    expect(dialog).toContain("max-h-[calc(100dvh-2rem)]");
    expect(dialog).toContain("overflow-y-auto");
  });

  it("does not expose a fixed dashboard sidebar during mobile loading", () => {
    expect(skeleton).toContain("hidden w-[280px] shrink-0");
    expect(skeleton).toContain("lg:block");
    expect(skeleton).toContain("min-w-0 flex-1");
  });
});
