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
    expect(homeSource).toContain('href="/category/fashion"');
    expect(homeSource).toContain('href="/category/phones-accessories"');
    expect(homeSource).toContain('href="/esutchop"');
    expect(homeSource).toContain('href="/category/digital-books-courses"');
    expect(homeSource).toContain('href="/category/beauty-personal-care"');
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
    expect(stylesheet).toContain(".reference-logo-medallion::after");
    expect(stylesheet).toContain("animation:reference-logo-glow 4.8s ease-in-out 900ms infinite");
    expect(stylesheet).toContain(".reference-logo-medallion::after{animation:none;opacity:.5;transform:none}");
    expect(stylesheet).toContain("@media(prefers-reduced-motion:reduce)");
    expect(stylesheet).toContain(".reference-chip:hover,.reference-chip:focus-visible{transform:none;filter:none}");
    expect(stylesheet).toContain("--orbit-radius:clamp(128px,15.6vw,190px)");
    expect(stylesheet).toContain("animation:reference-planet-orbit 16s linear infinite");
    expect(stylesheet).toContain(".reference-chip-fashion{--orbit-start:-135deg");
    expect(stylesheet).toContain(".reference-chip-phones{--orbit-start:-45deg");
    expect(stylesheet).toContain(".reference-chip-food{--orbit-start:0deg");
    expect(stylesheet).toContain(".reference-chip-beauty{--orbit-start:55deg");
    expect(stylesheet).toContain(".reference-chip-books{--orbit-start:145deg");
    expect(stylesheet).toContain("@keyframes reference-planet-orbit");
    expect(stylesheet).toContain(".reference-chip{animation:none!important");
  });
});
