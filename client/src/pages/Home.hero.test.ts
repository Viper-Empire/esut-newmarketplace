import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");
const stylesheet = readFileSync(new URL("../index.css", import.meta.url), "utf8");

describe("homepage hero artwork interaction contract", () => {
  it("keeps the artwork semantic, keyboard-focusable, and layered", () => {
    expect(homeSource).toContain('aria-label="Esut Shops hero artwork"');
    expect(homeSource).toContain('>Esut<br/><b>Shops</b></p>');
    expect(homeSource).not.toContain('Campus Deals hero artwork');
    expect(homeSource).toContain('Discover more with Esut Shops.');
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
    expect(homeSource).toContain('className="reference-chip reference-chip-accommodation"');
    expect(homeSource).toContain('className="reference-chip-icon"');
    expect(homeSource).toContain('className="reference-tag"');
    expect(homeSource).toContain('className="reference-caption"');
  });

  it("keeps category links in the visual clockwise order", () => {
    const order = ["reference-chip-fashion", "reference-chip-phones", "reference-chip-food", "reference-chip-beauty", "reference-chip-books", "reference-chip-accommodation"];
    const positions = order.map(className => homeSource.indexOf(className));
    expect(positions.every((position, index) => position >= 0 && (index === 0 || position > positions[index - 1]))).toBe(true);
  });

  it("defines bounded hover, entrance, and reduced-motion safeguards", () => {
    expect(stylesheet).toContain(".reference-hero-surface");
    expect(stylesheet).toContain(".reference-logo-medallion");
    expect(stylesheet).toContain(".reference-chip:hover,.reference-chip:focus-visible");
    expect(stylesheet).toContain(".reference-caption");
    expect(stylesheet).toContain("@keyframes reference-caption-fade-in");
    expect(stylesheet).toContain("animation:reference-caption-fade-in 700ms cubic-bezier(.23,1,.32,1) 220ms both");
    expect(stylesheet).toContain("@media(prefers-reduced-motion:reduce){.reference-caption{animation:none;opacity:1;transform:none}}");
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
    expect(stylesheet).toContain("@keyframes reference-card-orbit");
    expect(stylesheet).toContain(".reference-orbit-node{position:absolute;top:50%;left:50%;width:0;height:0;z-index:6");
    expect(stylesheet).toContain("@keyframes counter-orbit");
    expect(stylesheet).toContain(".reference-orbit-node-fashion{transform:translate(-50%,-50%) translate(-60px,-104px);animation:node-fashion 34s linear infinite!important}");
    expect(stylesheet).toContain(".reference-orbit-node-accommodation{transform:translate(-50%,-50%) translate(-120px,0);animation:node-accommodation 34s linear infinite!important}");
    expect(stylesheet).toContain(".reference-chip{animation:none!important");
    expect(stylesheet).toContain("width:96px;min-width:96px;height:88px;min-height:88px");
    expect(stylesheet).toContain("flex-direction:column;justify-content:center");
    expect(stylesheet).toContain(".reference-chip-accommodation{top:46%;left:12%}");
    expect(stylesheet).toContain("@keyframes reference-tile-enter");
    expect(stylesheet).toContain("@keyframes reference-tile-pop");
    expect(stylesheet).toContain("@keyframes reference-tile-pop-scale");
    expect(stylesheet).toContain("--orbit-radius:clamp(112px,9.8vw,125px)");
    expect(stylesheet).toContain("opacity:1!important;animation:reference-six-orbit 32s linear infinite,reference-tile-pop-scale 780ms");
    expect(stylesheet).toContain("animation:reference-card-orbit 34s linear infinite!important");
    expect(stylesheet).toContain("transition:scale 220ms cubic-bezier(.23,1,.32,1),box-shadow 220ms ease-out,filter 220ms ease-out");
    expect(stylesheet).toContain(".reference-chip-fashion{animation-delay:-21.33s,0ms!important}");
    expect(stylesheet).toContain(".reference-chip-accommodation{animation-delay:-16s,400ms!important}");
    expect(stylesheet).toContain("animation:reference-tile-pop 780ms cubic-bezier(.23,1,.32,1) both!important");
    expect(stylesheet).toContain(".reference-chip-food{top:48%;left:90%;animation-delay:160ms!important}");
    expect(stylesheet).toContain(".reference-chip-beauty{top:72%;left:48%;animation-delay:240ms!important}");
    expect(stylesheet).toContain(".reference-chip-fashion{animation-delay:0ms!important}");
    expect(stylesheet).toContain(".reference-chip-accommodation{animation-delay:400ms!important}");
    expect(stylesheet).toContain("@keyframes reference-orbit-turn");
    expect(stylesheet).toContain(".reference-orbit-outer{animation:reference-orbit-turn 56s linear infinite!important}");
    expect(stylesheet).toContain(".reference-orbit-inner{animation:reference-orbit-turn 44s linear infinite reverse!important}");
    expect(stylesheet).toContain("@media(prefers-reduced-motion:reduce){.reference-chip,.reference-chip:hover,.reference-chip:focus-visible{transform:translate(-50%,-50%)}}");
  });
});
