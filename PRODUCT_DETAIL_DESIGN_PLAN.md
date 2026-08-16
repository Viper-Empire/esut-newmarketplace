# ESUT Marketplace — Product Detail Redesign Plan

## Goal

Redesign the ESUT Marketplace product-detail experience using the provided minimal ecommerce references as visual inspiration while preserving the project’s real-data marketplace behavior, ESUT Red/Green/Gold identity, campus-pickup fulfilment, cash-on-pickup payment, verified-seller trust model, and server-side ownership safeguards.

## Visual Analysis of the References

The references use a **product-first split layout**. A large, quiet image gallery occupies the left side, while the right side presents a strong product title, concise value proposition, rating proof, pricing hierarchy, key benefits, and two prominent purchase actions. The design feels premium because it uses generous white space, oversized typography, restrained borders, rounded image surfaces, and a limited colour vocabulary.

The supporting sections continue the conversion story below the fold. Review cards provide social proof, FAQs reduce purchase uncertainty, and related products encourage discovery without competing with the primary purchase decision. The mobile reference changes the layout to a vertical sequence, keeps the purchase panel visible after the image/title area, and uses a sticky add-to-cart bar for continued action access.

The references also contain claims that **must not be copied literally** into ESUT Marketplace without real supporting data. Examples include exact review counts, shipping promises, money-back guarantees, fictional product specifications, discount claims, and unrelated payment or fulfilment language. ESUT’s version must use only real listing data and honest campus-pickup/cash-on-pickup messaging.

## Step 1 — Audit the existing product-detail contract

Before implementation, inspect the current product-detail route, listing schema, image projection, seller projection, inventory data, review eligibility, favorites, offers, messaging entry points, related listings, cart-add procedure, Buy now flow, report entry point, and responsive states.

Create a field map distinguishing data that is already available from content that needs a safe server procedure. Do not introduce visual placeholders that imply real values. Preserve the existing loading, retrieval-failure-with-retry, unavailable-listing, empty-review, and mutation-feedback states.

## Step 2 — Create the new desktop information architecture

Use a wide, asymmetric two-column product layout. The left column should contain the primary image, thumbnail gallery, image-count or selected-image context, and a calm visual background. The right column should contain:

1. Breadcrumb and category context.
2. Product title and concise seller/listing summary.
3. Real review summary, or an honest no-review state.
4. Current Naira price, optional real comparison price or discount only when stored and valid, and stock/availability context.
5. A short factual description and key listing details.
6. Real trust and fulfilment cards: verified seller status, campus pickup, cash on pickup, and safe buyer reporting.
7. Quantity control with server-authoritative stock validation.
8. Primary **Add to cart** and secondary **Buy now** actions.
9. Favorites, message seller, make offer, and report controls with clear secondary hierarchy.

The main purchase actions should remain visible without overwhelming the title, price, or trust information. Use ESUT red for the primary commercial action, green for verified/trust states, and gold sparingly for attention cues or genuine promotional data.

## Step 3 — Improve the gallery and image treatment

Adopt the reference’s large image stage with a neutral surface, consistent aspect ratio, rounded corners, and a thumbnail row beneath or beside it. Preserve the existing managed-storage URLs and image ordering. Add accessible labels for every thumbnail and keyboard-reachable selection.

If no product image exists, show an intentional branded empty image state rather than a fake product visual. If an image fails to load, retain the product information and expose a clear fallback without breaking the page.

## Step 4 — Build honest trust and purchase-confidence modules

Replace generic reference promises such as free shipping or money-back guarantees with ESUT-specific operational facts. Recommended modules are **Verified seller**, **Campus pickup**, **Cash on pickup**, and **Server-checked stock**. Each module should explain the promise briefly and link to the relevant buyer guidance when available.

Show seller name, store link, verification status, campus/location context, and safe contact entry point using the existing minimized public projection. Never expose private seller identity fields or administrative evidence.

## Step 5 — Add below-the-fold decision support

Introduce a structured content area below the purchase panel with tabs or sections for description, listing details, seller information, reviews, and buyer safety guidance. Keep reviews real and verified-purchase-only. If there are no reviews, use a clear empty state instead of displaying example testimonials.

Add an FAQ accordion only for questions that can be answered from existing product and marketplace rules, such as campus pickup, cash on pickup, stock validation, offers, and reporting. Avoid inventing warranty, return, shipping, or product-specification promises.

## Step 6 — Add related-product discovery without fabricating recommendations

Use the existing server-authorized related-listing result. Present it as a horizontal card row on desktop and a swipeable or stacked layout on mobile. Cards should use real listing images, titles, prices, store context, availability, and verified status. If there are no related products, show a useful route back to the catalogue or category.

Do not use artificial “frequently bought together” claims, fake popularity badges, or unrelated products merely to fill the row.

## Step 7 — Design mobile purchase continuity

On mobile, stack the gallery, title, price, trust summary, description, and controls vertically. Add a restrained sticky bottom action bar containing the current price and Add to cart/Buy now actions only when it does not obscure content or keyboard focus.

Validate the layout at 375px and larger mobile widths. Ensure the sticky bar respects safe-area padding, does not cover review or form controls, and disappears or adapts while dialogs, file pickers, or keyboard input are active.

## Step 8 — Preserve all marketplace workflows

The redesign must continue to use the existing authenticated cart-add procedure, Buy now route, server price and stock validation, favorites procedure, offer flow, participant-authorized messaging, review eligibility rules, listing/store reporting, and guarded tRPC transport.

Guests may view public product data but must be directed to sign in for protected actions. No payment flow, shipping flow, or instant seller operation should be introduced. Campus pickup and cash on pickup remain the only fulfilment/payment options.

## Step 9 — Add visual and behavioral assurance

Add browser coverage for the product-detail structure, image fallback, real/empty review states, mobile sticky actions, guest access boundaries, controlled HTML responses, and non-destructive quantity or action interactions. Add focused unit/procedure tests for any new server projection or calculated field.

Review the page at desktop and mobile breakpoints for hierarchy, contrast, focus states, keyboard reachability, reduced motion, and no horizontal overflow. Confirm that empty, loading, retrieval-failure, unavailable-listing, mutation-pending, mutation-success, and mutation-error states remain explicit.

## Acceptance Criteria

| Area | Completion condition |
|---|---|
| Visual hierarchy | Product image, title, price, trust, and purchase actions are immediately clear on desktop and mobile. |
| Real data | Ratings, reviews, discounts, stock, seller status, related products, and images come from valid marketplace records only. |
| Trust | ESUT-specific verified-seller, campus-pickup, cash-on-pickup, and stock-validation explanations replace unsupported ecommerce claims. |
| Commerce | Add to cart and Buy now continue to use protected server-side pricing, stock, and order safeguards. |
| Accessibility | Gallery, quantity, accordion, actions, sticky mobile controls, and dialogs are keyboard reachable and meaningfully labelled. |
| Assurance | Type checking, unit/procedure tests, browser tests, responsive checks, and response-safety checks pass. |

## Assumptions and Risks

The supplied images are treated as design references, not as content or assets to copy. The implementation will preserve the existing ESUT visual system and database contracts where possible, adding only server-backed fields or procedures that are genuinely missing. The primary risks are introducing unsupported product claims, making the purchase panel too dominant on small screens, exposing private seller information, and allowing visual changes to bypass existing cart or order safeguards. These risks will be controlled through real-data projections, ownership tests, responsive browser coverage, and explicit review of every new product-detail state.
