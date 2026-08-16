# ESUT Marketplace — Public-Focus Design Roadmap

## Goal

Make ESUT Marketplace visually distinctive, immediately understandable, and compelling to the ESUT community while preserving its identity as a serious, real-data university marketplace rather than a generic marketing landing page. The design should attract public attention, build trust quickly, and move visitors toward discovery, registration, campus pickup, or seller onboarding.

## Design Direction

The product will use a recognizable **ESUT Red, Green, and Gold** system with a confident campus-commerce character. Red will express action and urgency, green will communicate trust, approval, and marketplace safety, and gold will highlight value, campus deals, and important moments. The visual language should combine strong editorial headlines, product-led imagery, clean white surfaces, campus-inspired details, and disciplined spacing.

The design will remain grounded in actual marketplace records. No fabricated popularity counts, fake reviews, invented seller claims, or imaginary deals will be introduced. When real data is sparse, the interface will use purposeful editorial guidance and honest empty states rather than manufactured activity.

## Step 1 — Establish the public attention hierarchy

Review the current homepage, header, search, category navigation, product cards, store cards, and responsive behavior. Define the first-screen hierarchy around five questions: what is ESUT Marketplace, why should an ESUT visitor trust it, what can they discover now, how does campus pickup work, and how can a seller join?

The homepage should prioritize a strong headline and one clear primary action, followed by real discovery content. Secondary actions should be visually distinct but restrained: browse categories, explore verified sellers, create an account, and start selling.

## Step 2 — Strengthen the hero without weakening commerce discovery

Refine the hero into a campus-specific value proposition such as discovering products and services around ESUT with trusted sellers and campus pickup. Use a visual composition that feels memorable at desktop and mobile widths, while keeping the search field and real catalogue entry point immediately visible.

Add a compact trust strip below the hero that explains **verified sellers**, **campus pickup**, and **cash on pickup**. These must be presented as operational truths, not promotional claims unsupported by the product.

## Step 3 — Make discovery visually addictive but honest

Improve category tiles, product cards, store cards, and section headers with stronger contrast, clearer prices, seller trust markers, availability cues, and useful action hierarchy. Use real images and records from managed storage and the database.

Create a deliberate rhythm for the page: category discovery, verified seller discovery, real listings, campus services, and seller recruitment. Avoid excessive carousels or decorative sections that hide the marketplace’s actual value.

## Step 4 — Introduce campus-specific storytelling

Add small editorial modules that make the product feel native to ESUT: campus pickup guidance, safe buying reminders, seller verification explanation, and practical examples of what students and staff can discover. These modules should educate and reduce uncertainty rather than merely decorate the page.

Use short, direct copy with a Nigerian university context. Keep the language accessible, confident, and action-oriented while avoiding unsupported claims such as “most popular” or “number one.”

## Step 5 — Improve public trust and conversion paths

Make the trust model visible before visitors need to search for it. Product and store cards should expose verified status, seller identity context, fulfilment method, and real availability where appropriate. The homepage should link naturally to the seller verification explanation, buyer safety guidance, login, registration, and seller application route.

Registration and login should feel like part of the ESUT Marketplace product rather than an external authentication portal. Preserve the existing password visibility controls, account classification choice, paused email-verification boundary, and protected account access behavior.

## Step 6 — Design a stronger seller recruitment experience

Position seller recruitment as a benefit-led public section rather than a generic “sell with us” button. Explain that sellers can reach the ESUT community, manage listings, receive campus-pickup orders, and use performance reporting after completing verification and approval.

Show the onboarding path in three or four honest stages: create an account, submit individual or business verification, receive review, and unlock seller tools after approval. Do not imply instant approval or immediate selling access.

## Step 7 — Build launch campaign surfaces

Prepare reusable visual sections for a launch campaign: campus-deal callouts based on real listings, verified-store spotlights based on real approved stores, seasonal category emphasis, and seller recruitment messages. These should be content-configurable rather than hardcoded fake promotions.

If real inventory is insufficient for a campaign section, show an intentional “coming soon” or “discover by category” state and direct users to the active catalogue. This keeps public attention while preserving trust.

## Step 8 — Refine responsive and accessibility behavior

Validate the public experience at desktop, tablet, and 375px mobile widths. Ensure the primary actions, search, category navigation, product cards, account actions, and seller CTA remain usable without horizontal overflow. Keep visible focus states, meaningful accessible names, sufficient contrast, and reduced-motion compatibility.

Use Playwright to verify the public homepage, catalogue, login, registration, seller recruitment, and key trust modules. Add visual review checkpoints for the most important public surfaces rather than relying only on DOM assertions.

## Step 9 — Validate with real data and public-facing quality gates

Before implementation is considered complete, verify that all public sections render from real database records or clearly labeled editorial content. Check loading, failure, empty, and success states. Confirm that no private seller, buyer, moderation, or administrative fields leak into public cards or summaries.

Run type checking, unit tests, browser tests, responsive checks, and a focused accessibility review. Capture a new checkpoint only after the public design is coherent on desktop and mobile and the public routes remain safe for signed-out visitors.

## Suggested Deliverables

| Deliverable | Purpose |
|---|---|
| Public visual direction update | Establishes ESUT Red/Green/Gold hierarchy, typography, spacing, and attention cues. |
| Homepage attention pass | Improves hero, trust strip, category rhythm, real listing discovery, and seller recruitment. |
| Public trust-content modules | Explains verification, campus pickup, cash on pickup, and buyer safety honestly. |
| Seller recruitment section | Converts potential vendors while clearly explaining the verification gate. |
| Launch campaign components | Supports real-data spotlights, category campaigns, and future configurable promotions. |
| Responsive/accessibility verification | Ensures the public experience works across mobile and desktop without sacrificing clarity. |

## Assumptions and Risks

The existing database-backed marketplace remains the source of truth. The design work will not introduce fake metrics, reviews, inventory, sellers, or promotional claims. The current ESUT logo and Red/Green/Gold identity will be preserved. The main risks are visual over-decoration, hiding the core marketplace search, implying instant seller approval, and using public-facing claims that cannot be supported by real records. These risks will be controlled through real-data checks, explicit copy review, responsive testing, and a final public-route audit.
