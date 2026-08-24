# Hero Artwork Redesign — 2026-08-24

## Scope
The hero was redesigned without introducing an external image asset or changing marketplace data. The green artwork now has layered radial depth, a restrained highlight texture, a soft center glow, and a secondary gold orbit accent.

## Motion
The cart uses a short first-load entrance with opacity and transform only, plus a subtle ring reveal. Floating cards have smooth transform, shadow, and saturation hover states and visible keyboard focus rings. The reduced-motion media query disables all decorative animation and removes motion transitions.

## Responsive verification
The desktop rendering at 1280px keeps the cart, floating cards, and artwork layers contained within the hero panel. The supplied 566px viewport preserves the mobile content flow and does not reintroduce the earlier top clipping risk. The existing panel sizing and mobile insets remain active.

## Automated validation
The focused hero contract test passed with 2 tests. TypeScript and the production build passed. The full suite reached 184 passing tests and 1 intentional skip; one unrelated live Resend authentication probe timed out at its existing 15-second network boundary.
