import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");
const stylesheet = readFileSync(new URL("../index.css", import.meta.url), "utf8");

describe("homepage hero artwork interaction contract", () => {
  it("keeps the artwork semantic, keyboard-focusable, and layered", () => {
    expect(homeSource).toContain('aria-label="Campus Deals hero artwork"');
    expect(homeSource).toContain('className="hero-glow"');
    expect(homeSource).toContain('className="float-card float-phone" tabIndex={0}');
    expect(homeSource).toContain('className="float-card float-books" tabIndex={0}');
    expect(homeSource).toContain('className="float-card float-fashion" tabIndex={0}');
    expect(homeSource).toContain('className="hero-cart" aria-hidden="true"');
  });

  it("defines bounded hover, entrance, and reduced-motion safeguards", () => {
    expect(stylesheet).toContain(".float-card:hover,.float-card:focus-visible");
    expect(stylesheet).toContain("hero-cart-arrive");
    expect(stylesheet).toContain("hero-cart-ring");
    expect(stylesheet).toContain("@media(prefers-reduced-motion:reduce)");
    expect(stylesheet).toContain(".hero-cart,.hero-cart::after,.float-card{animation:none!important}");
  });
});
