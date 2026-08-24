# Hero Artwork Clipping Fix — 2026-08-24

## Reported issue
The supplied narrow screenshot showed the red shopping-cart mark clipped by the top edge of the green hero artwork panel.

## Implemented correction
The homepage hero artwork keeps the existing CSS-built ESUT composition. The cart is now centered using a bounded `top: 50%`, `left: 50%`, and `transform: translate(-50%, -50%)` placement. The art panel now has a responsive `min-height` and `aspect-ratio` floor. Mobile breakpoint rules provide safer insets for the floating cards and the `Campus Deals` caption.

## Verification completed
The desktop homepage rendering at 1280px showed the complete cart mark contained inside the green panel. The supplied 566px-wide viewport was also checked; the hero copy remains the first mobile section and the art panel is not moved outside the page flow. The full Vitest suite, TypeScript check, and production build passed.

## Scope boundary
No image asset, marketplace data, route, role, database record, provider setting, domain, or infrastructure configuration was changed.
