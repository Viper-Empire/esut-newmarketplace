# Uploaded Hero Reference Implementation — 2026-08-24

## Reference specification
The uploaded reference is a near-square dark ESUT-green artwork with generous rounded corners, faint concentric orbit rings, five white category chips positioned around the rings, a centered white ESUT Marketplace logo medallion, a lower-left `BUY · SELL · CONNECT` pill, and a lower-right serif `Campus Deals` lockup with gold `Deals`.

## Implementation
The previous imported artwork frame was replaced with CSS/React geometry so the supplied reference composition can remain responsive and use the approved managed ESUT logo asset. The current hero uses a dedicated `.reference-hero-surface`, explicit chip positions, a centered `.reference-logo-medallion`, and bounded lower overlays. No user-uploaded image was reopened.

## Desktop verification
The top desktop viewport shows the centered medallion and all upper/middle chips correctly. The complete-page desktop render confirms the lower-left pill and lower-right caption remain inside the rounded green surface. The apparent lower crop in a viewport-only screenshot is caused by the viewport ending before the hero section finishes, not by the artwork container.

## Scope
No marketplace data, authentication, routing, dashboard logic, database records, or infrastructure settings were changed. The visual reference is used only for the homepage hero treatment.

## Mobile and tablet verification
The narrow mobile full-page render keeps the square reference surface in flow and does not crop the artwork. The 768px tablet render keeps all five chips, the centered logo medallion, the BUY · SELL · CONNECT pill, and Campus Deals lockup inside the artwork surface. It also exposes an independent responsive concern: the existing two-column hero copy is too narrow at this breakpoint, causing the primary CTA to fall below the initial viewport. That is a surrounding hero-layout issue, not artwork clipping, and should be addressed separately if the owner wants tablet CTA visibility improved.

## Motion verification — chip float and orbit rotation
Added a slow 6.8-second staggered float to all five category chips using CSS `translate`, preserving the existing hover/focus `transform` interaction. Added centered orbit rotation at 42 seconds, with 34-second reverse inner rotation and 54-second core rotation to create restrained depth without spinning the chips or logo. The desktop and 566px mobile checks show the animation layers remain inside the artwork surface; the mobile hero surface stays in normal document flow below the copy. Reduced-motion disables both chip and orbit animations.

## Solar-orbit card verification
Replaced the previous independent chip float with a shared planetary path. Fashion, Phones, Food & Snacks, Beauty & Care, and Books & Notes now use a clear clockwise start-order around a common radius, with staggered phase offsets and a 16-second orbit. Cards use a stronger 104px minimum width, bright white surface, readable green labels, icon accents, and focus outlines. Legacy right/bottom offsets were reset so cards never stretch. The orbit radius was tightened to reserve a clean lower-right Campus Deals zone. Desktop and mobile checks show compact cards and stable containment; the mobile artwork remains in normal flow. Reduced-motion users receive a static reference arrangement.

## Interactive links and central glow verification
The five orbital cards now render as real wouter links to `/category/fashion`, `/category/phones-accessories`, `/esutchop`, `/category/digital-books-courses`, and `/category/beauty-personal-care`. Their accessible labels identify the destination category, and their existing focus outline remains visible. The central logo has a low-intensity gold breathing halo behind the medallion; the glow does not change layout or cover the logo. Desktop and 566px mobile screenshots show the links and glow contained within the hero surface. Reduced-motion disables the halo animation.

## Six-card icon-led hero verification
Replaced the five text-forward orbit cards with six polished icon-led links: Fashion, Phones, Food & Snacks, Accommodation, Beauty & Care, and Books & Notes. Added a real Accommodation link to `/accommodation`; the other cards retain their canonical category/vertical routes. Removed continuous planet rotation and kept the orbit rings static, preserving only the central logo glow and hover/focus lift. The cards use compact colored icon tiles, stronger white surfaces, clear labels, and safe side insets. Desktop and 566px mobile checks show all visible cards remain contained and readable; the static orbit framing is calmer and more professional.

## Reference-style vertical tile verification
Reworked the six category links to match the supplied image more closely: compact rounded-square white tiles, centered colorful icon tile above a centered ESUT-green label, and increased white-space around each card. Fashion and Phones sit across the top, Accommodation and Food & Snacks at the middle sides, Books & Notes lower-left, and Beauty & Care lower-center. Continuous rotation remains removed; orbit rings are static. Desktop and 566px mobile checks confirm the cards are contained, readable, and separated from the medallion and Campus Deals caption.

## Organized entrance and ring motion verification
Reordered the hero links in the visual clockwise sequence: Fashion, Phones, Food & Snacks, Beauty & Care, Books & Notes, and Accommodation. Added a 720ms clockwise staggered first-load reveal with 80ms offsets, while keeping tile positions stationary. Reintroduced only slow ring-only rotation: outer 56s, inner 44s reverse, and core 68s; the category cards do not orbit or rotate. Desktop and 566px mobile checks confirm the cards remain readable, contained, and clear of the logo/caption. Reduced-motion users receive static tiles and static rings.

## Professional spacing refinement verification
Readjusted the six hero tiles into a more open composition: Fashion and Phones are balanced across the upper axis; Accommodation and Food & Snacks sit farther out on the middle side axis; Books & Notes and Beauty & Care occupy separate lower lanes. The logo medallion has a clearer breathing zone, and Beauty & Care no longer crowds the Campus Deals caption. The clockwise staggered entrance, slow ring-only rotation, real links, and reduced-motion behavior remain intact. Desktop and 566px mobile checks confirm the revised spacing is contained and readable.
