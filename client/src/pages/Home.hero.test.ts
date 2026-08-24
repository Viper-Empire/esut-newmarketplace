import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");
const stylesheet = readFileSync(new URL("../index.css", import.meta.url), "utf8");

describe("homepage hero artwork interaction contract", () => {
  it("keeps the artwork semantic, keyboard-focusable, and layered", () => {
    expect(homeSource).toContain('aria-label="Campus Deals hero artwork"');
    expect(homeSource).toContain('className="reference-hero-surface"');
    expect(homeSource).toContain('className="reference-logo-medallion"');
    expect(homeSource).toContain('src={ESUT_MARKETPLACE_LOGO_PATH}');
    expect(homeSource).toContain('className="reference-chip reference-chip-fashion"');
    expect(homeSource).toContain('className="reference-chip reference-chip-phones"');
    expect(homeSource).toContain('className="reference-chip reference-chip-food"');
    expect(homeSource).toContain('className="reference-chip reference-chip-books"');
    expect(homeSource).toContain('className="reference-chip reference-chip-beauty"');
    expect(homeSource).toContain('className="reference-tag"');
    expect(homeSource).toContain('className="reference-caption"');
  });

  it("defines bounded hover, entrance, and reduced-motion safeguards", () => {
    expect(stylesheet).toContain(".reference-hero-surface");
    expect(stylesheet).toContain(".reference-logo-medallion");
    expect(stylesheet).toContain(".reference-chip:hover,.reference-chip:focus-visible");
    expect(stylesheet).toContain(".reference-caption");
    expect(stylesheet).toContain("@media(prefers-reduced-motion:reduce)");
    expect(stylesheet).toContain(".reference-chip:hover,.reference-chip:focus-visible{transform:none;filter:none}");
    expect(stylesheet).toContain("animation:reference-chip-float 6.8s ease-in-out infinite");
    expect(stylesheet).toContain("animation-delay:-1.2s");
    expect(stylesheet).toContain("animation:reference-orbit-spin 42s linear infinite");
    expect(stylesheet).toContain("transform:translate(-50%,-50%) rotate(360deg)");
    expect(stylesheet).toContain(".reference-chip,.reference-orbit{animation:none!important");
  });
});
