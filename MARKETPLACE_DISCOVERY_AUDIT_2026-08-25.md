# Marketplace discovery audit — 25 August 2026

## Verified current state

The public `/explore` route uses the real `marketplace.search`, `marketplace.categories`, and `marketplace.suggestions` procedures. It already provides newest/popular/price sorting, condition, price, verified-seller filters, category links, loading skeletons, fetching feedback, retry handling, no-results suggestions, saved-search notifications, pagination, and category-aware honest image fallbacks. The product page already provides seller/category context, related real listings, verified-purchase review presentation, buyer guidance, reminders, offers, messaging, reporting, and a Back to marketplace escape.

## Verified issues selected for this slice

The filter controls did not expose an active-filter summary while results were present, so users had no quick way to understand or clear the current search state. Price input accepted invalid or contradictory ranges without a local explanatory state. Result cards did not announce an explicit real-result count or busy state around the grid. The category strip used a single horizontal overflow row at desktop width; the supplied 1280px visual check clipped the later Digital Books & Courses category from the initial view even though it remained reachable by horizontal scrolling.

The 375px mobile visual check showed the two-column product grid, stacked filter controls, category scrolling, honest image fallbacks, metadata, and pagination remain usable without page-level horizontal overflow. The new active-filter summary was not visible in the no-filter state, as expected.

## Scope boundary

This slice remains frontend-focused and preserves the existing server search contract, canonical category slugs, real marketplace records, Cloudinary public-media boundaries, and the prohibition on fabricated listings, reviews, ratings, or testimonials. Infrastructure, domains, email sender readiness, and database-provider migration remain paused.

## Post-change verification

After the discovery changes, the 1280px Explore screenshot wrapped all nine active category links, including Digital Books & Courses, into a visible second row instead of hiding it behind a horizontal scroll. The product-detail screenshot showed the new linked `Phones & Accessories listings` context directly above the title while retaining the existing Back to marketplace escape, seller/store link, related real listings, and light-only presentation.

Focused Explore and ProductPage tests, TypeScript, and production build passed after the changes. A mobile screenshot remains part of the final verification pass.

## Mobile verification

At 375px, Explore retained a readable two-column product grid, stacked filter controls, horizontally scrollable category chips, honest image fallbacks, real seller/location metadata, and visible pagination without page-level horizontal overflow. At the same width, Product detail retained the Back to marketplace link, direct linked category label, image gallery, structured specifications, purchase safety panel, stacked actions, seller context, reviews, buyer guidance, and related real listings. The mobile layout is compact but usable; no additional blocking discovery defect was observed in this pass.

## Tablet verification

At 768px, Explore wrapped the filter controls into two rows, kept the category strip touch-scrollable, rendered the real listings in a three-column grid, and preserved pagination without horizontal page overflow. Product detail presented the gallery first, then trust cards, category breadcrumb, title/specifications, purchase controls, seller context, reviews, and related listings in a readable single-column flow. The tablet layouts passed visual inspection with the existing light-only ESUT palette.

## Final safety correction

A final review identified that non-empty non-numeric, negative, or zero price values could otherwise be omitted from the server input. The Explore page now disables the marketplace query for those values, displays a specific actionable correction state, and offers a one-click clear action. Focused coverage now includes five Explore tests, and the complete suite passes with 67 files, 193 tests passed, and one intentional skip.
