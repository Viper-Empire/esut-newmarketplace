import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");
const stylesheet = readFileSync(new URL("../index.css", import.meta.url), "utf8");

describe("homepage hero artwork interaction contract", () => {
  it("keeps the artwork semantic, keyboard-focusable, and layered", () => {
    expect(homeSource).toContain('aria-label="Campus Deals hero artwork"');
    expect(homeSource).toContain('className="hero-art-frame"');
    expect(homeSource).toContain('className="hero-art-image"');
    expect(homeSource).toContain('src="/manus-storage/campus-deals-reference_49aaf5d9.png"');
    expect(homeSource).toContain('alt="Campus Deals: ESUT Marketplace shopping categories"');
    expect(homeSource).toContain('className="hero-art-kicker"');
    expect(homeSource).toContain('className="hero-art-sheen"');
  });

  it("defines bounded hover, entrance, and reduced-motion safeguards", () => {
    expect(stylesheet).toContain(".hero-art-frame");
    expect(stylesheet).toContain(".hero-art-image");
    expect(stylesheet).toContain("object-fit:contain");
    expect(stylesheet).toContain(".hero-art-frame:hover .hero-art-image");
    expect(stylesheet).toContain("@media(prefers-reduced-motion:reduce)");
    expect(stylesheet).toContain(".hero-art-frame:hover .hero-art-image{transform:none}");
  });
});
