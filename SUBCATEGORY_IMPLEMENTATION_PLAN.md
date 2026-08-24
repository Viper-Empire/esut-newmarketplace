# ESUT Marketplace Attached Verticals and Sub-Category Plan

## Purpose

ESUT Marketplace will remain the shared university commerce platform, but two existing top-level areas will become dedicated vertical experiences rather than ordinary product categories:

| Current direction | Approved product direction | Initial canonical route | Future hosting option |
|---|---|---|---|
| Food & Groceries | **Food**, branded **ESUTChop** | `/esutchop` | `esutchop.<approved-domain>` or an attached custom domain later |
| Hostel & Lodge | **Accommodation**, for apartments, lodges, and student housing | `/accommodation` | `accommodation.<approved-domain>` or an attached custom domain later |

The current marketplace still has **nine top-level areas**. This plan changes the two display concepts and their experiences; it does not create two unrelated applications, duplicate user accounts, or split trust and security systems.

## Architecture decision

The recommended architecture is a **modular vertical platform**:

> One ESUT identity, security, seller verification, notifications, media layer, audit system, and database foundation; three specialized discovery experiences: the general marketplace, ESUTChop, and Accommodation.

The general marketplace continues to serve physical products, services, and digital learning products. ESUTChop receives food-specific discovery and order rules. Accommodation receives housing-specific discovery and inquiry rules. All verticals share account authentication, seller/vendor profiles, moderation, reporting, messaging, analytics, and contextual navigation.

The verticals should begin as route modules in the current application, not as three separately deployed codebases. This avoids duplicated authentication, inconsistent permissions, fragmented notifications, and unnecessary hosting cost. Later, Cloudflare or another edge provider can map dedicated subdomains to the same application or to independently scaled frontends without changing the shared data contracts.

## Updated top-level taxonomy

The current top-level catalog should become:

| Top-level area | Role | Data behavior |
|---|---|---|
| Electronics | General products | Existing listing model |
| Fashion | General products | Existing listing model |
| Phones & Accessories | General products | Existing listing model |
| Beauty & Personal Care | General products | Existing listing model |
| Accommodation | Student housing vertical | Housing-specific property and inquiry model |
| Food | ESUTChop food vertical | Food-specific vendor, menu, availability, and order model |
| Services | General/service listings | Existing listing model with service-specific presentation |
| Computing | General products | Existing listing model |
| Digital Books & Courses | Digital learning vertical within the marketplace | Existing listing model with learning sub-categories |

The existing category records should be renamed in place where safe so IDs and historical links remain stable. `Food & Groceries` should become `Food`; its public brand should be **ESUTChop**. `Hostel & Lodge` should become `Accommodation`. Old slugs should redirect to the new canonical slugs rather than becoming dead links.

## ESUTChop product definition

ESUTChop is the attached food website for the ESUT community. It should feel like a focused food marketplace, not a generic category-filter page.

### ESUTChop scope

ESUTChop should support verified food vendors, menu items, prices, food photos, preparation/availability windows, pickup points, vendor instructions, order status, and safe in-app communication. The first release should prioritize campus pickup and vendor-defined availability. Delivery should not be implied unless a real delivery workflow, service area, fee model, and responsibility boundary are implemented.

### ESUTChop sub-categories

The initial controlled sub-category set can include Prepared Meals, Rice & Local Dishes, Snacks, Drinks, Breakfast, Pastries, and Groceries. The exact list should be approved before seed data is written. Categories must not imply that a vendor sells an item unless a real approved menu listing exists.

### Food-specific data extensions

Food items need more than a generic condition and inventory field. The design should introduce a food metadata relation or vertical payload containing preparation status, availability window, order cutoff, pickup location, dietary/allergen notes, portion or serving description, and whether the item is made-to-order or ready stock. These fields must be validated server-side and displayed clearly to buyers.

Food orders should use a dedicated order-type contract while reusing the existing protected order and payment/pickup boundaries. Statuses should distinguish accepted, preparing, ready for pickup, completed, cancelled, and disputed. A food vendor must not be able to mark an order completed without the existing buyer/pickup confirmation safeguards.

## Accommodation product definition

Accommodation is the attached student-housing website where students can find apartments, lodges, rooms, and related accommodation options. It should not be implemented as a normal product category because housing has different availability, pricing, inquiry, verification, and safety requirements.

### Accommodation scope

The first release should support accommodation providers or verified listers, property profiles, room/unit details, location, rent period, deposit information, utilities, furnished status, occupancy, availability date, contact/inquiry flow, photo media, verification status, and reports. It should not claim live availability unless the provider updates availability through a controlled workflow.

### Accommodation sub-categories

The initial controlled set can include Student Lodge, Apartment, Self-Contained Room, Shared Room, Flat/House, and Short Stay, subject to owner approval. The label **Accommodation** should cover the vertical; the sub-category should explain the property type.

### Housing-specific data extensions

Housing needs a dedicated accommodation model linked to the seller/provider account and optionally to an existing store profile. Recommended entities are `accommodations`, `accommodationUnits` or `accommodationListings`, `accommodationAmenities`, `accommodationMedia`, `accommodationInquiries`, and `accommodationAvailability`. Rent frequency, caution/deposit, service charges, occupancy, location, landmark, and verification details must be separate typed fields rather than hidden in a generic description.

The first release should be an inquiry and discovery workflow, not an automated tenancy contract or payment flow. Buyers should be warned to inspect and verify accommodation before transferring money. Reports, evidence uploads, provider verification, and admin moderation are mandatory for trust and safety.

## Shared identity and trust layer

Users should sign in once and move between the general marketplace, ESUTChop, and Accommodation without separate accounts. Existing role boundaries remain in force. A food vendor or accommodation provider must use the same seller verification and authorization boundaries, with additional vertical-specific approval requirements where applicable.

Shared capabilities include account security, active sessions, notifications, messaging, report/dispute handling, media storage, audit logs, seller reputation, moderation, and contextual return navigation. Private evidence and verification documents remain private; approved public media continues to use the public media path.

## Routes and navigation

The route structure should make the attached sites feel independent while preserving a clear return path to ESUT Marketplace:

| Experience | Proposed routes | Required navigation |
|---|---|---|
| ESUTChop | `/esutchop`, `/esutchop/menu`, `/esutchop/vendor/:slug`, `/esutchop/item/:slug`, `/esutchop/orders` | ESUTChop header, marketplace escape link, account access, cart/order access |
| Accommodation | `/accommodation`, `/accommodation/search`, `/accommodation/:slug`, `/accommodation/provider/:slug`, `/accommodation/inquiries` | Accommodation header, marketplace escape link, account access, saved/inquiry access |
| General marketplace | Existing routes | Links into ESUTChop and Accommodation where relevant |

Old `/category/food-groceries` and `/category/hostel-lodge` links should redirect or resolve to the new canonical vertical entry routes. Existing category detail links must not strand users. The public header should expose Food and Accommodation as distinct destinations, not as ambiguous ordinary category chips.

## Search, filters, and saved searches

Each vertical needs a specialized search contract while retaining the existing protected and public query boundaries.

ESUTChop filters should include vendor, food sub-category, availability, pickup location, price, preparation type, and dietary information where supplied. Accommodation filters should include property type, location/landmark, rent range, rent frequency, room/occupancy type, furnished status, amenities, and availability date.

Saved searches must store category or vertical IDs and typed criteria rather than matching display-name strings. Existing marketplace saved searches must continue to work after category renames. Notification matching must respect whether a user selected in-app, email, or both, using the existing provider-aware notification boundary.

## Seller and provider workflows

Existing sellers should not automatically become food vendors or accommodation providers. The seller dashboard should offer separate “Apply for ESUTChop” and “Apply as Accommodation Provider” paths when these workflows are enabled. Each path should include its own checklist, required evidence, service expectations, and moderation status.

Food vendor onboarding should capture food-handling information, pickup process, menu accuracy expectations, operating times, and allergen disclosure. Accommodation provider onboarding should capture ownership or authorization evidence, location, property details, contact information, availability responsibility, and anti-fraud warnings. All applications and review decisions must be auditable.

## Administration and governance

Administrators need a vertical-aware moderation queue. Admin views should distinguish general listings, food menu items, and accommodation records, with filters for vertical, parent/sub-category, verification status, and moderation state.

Category management should remain administrator-controlled. Sellers must not create arbitrary sub-categories. Renames, slug changes, deactivation, merges, vertical assignment, provider approval, and high-risk status changes require server authorization, a factual audit note, and impact visibility before confirmation.

Deleting a category or accommodation record should not be the default action. Deactivation, archival, and audited reassignment should preserve historical order, inquiry, review, and report references.

## Safe implementation phases

### Phase 1 — Owner approval and taxonomy freeze

Confirm the exact names **Food**, **ESUTChop**, and **Accommodation**; approve each vertical’s sub-category list; confirm whether the first Accommodation release is inquiry-only; confirm whether ESUTChop supports pickup only or also delivery; and identify which existing listings, if any, belong to each vertical. No seed or reassignment should happen before this freeze.

### Phase 2 — Shared contracts and additive schema

Use the existing category `parentId` hierarchy for ordinary sub-categories. Add vertical identifiers or dedicated relations only where domain-specific fields require them. Generate migrations from `drizzle/schema.ts`, review the SQL, apply through the managed database migration workflow, and verify every affected foreign-key relationship. Preserve existing category IDs and listing ownership.

### Phase 3 — Canonical routes and compatibility

Rename the two real category records, add canonical slugs, implement old-slug compatibility redirects, update the public header and category navigation, and keep the existing marketplace route available. Add route-contract tests for old and new URLs.

### Phase 4 — ESUTChop vertical

Build the ESUTChop landing, menu discovery, vendor page, item page, availability display, pickup order flow, seller/vendor management, moderation queue, and vertical notifications. Reuse shared components only where their interaction semantics remain correct; do not force accommodation or food data into generic product cards when the presentation would be misleading.

### Phase 5 — Accommodation vertical

Build accommodation discovery, typed filters, property detail pages, provider profile, inquiry flow, availability state, evidence/report controls, moderation, and safety messaging. Do not introduce payment or tenancy-contract automation until a separate approved workflow and legal/product review exists.

### Phase 6 — Validation and staged rollout

Run schema and migration checks, authorization tests, route and redirect tests, saved-search tests, vertical query tests, notification tests, and full Vitest/TypeScript/build validation. Use real database rows only. Verify desktop, tablet, and 375px mobile layouts. Push first to the isolated staging environment, validate public routes and same-origin API behavior, then checkpoint. Do not change custom domains or the managed production architecture as part of this rollout.

## Security, safety, and data integrity

The client must never be trusted to enforce vertical permissions, availability, prices, provider status, or category relationships. All sensitive operations are server-authorized and audited. Public data must exclude private evidence, verification documents, internal notes, and unpublished provider information.

Food listings must make stock and preparation status explicit. Accommodation listings must make availability date and verification status explicit. The interface must discourage off-platform payments and provide a report path. No fabricated vendor reviews, ratings, property availability, customer testimonials, or menu activity may be introduced.

## Decisions needed before implementation

The owner should confirm the final ESUTChop sub-category names, whether “Food” is the only public category label while “ESUTChop” is the brand, the preferred public label for the housing vertical (“Accommodation”), and whether both verticals should launch as route modules first or receive custom subdomains immediately. The safest recommendation is route modules first, with future subdomains after real usage and hosting requirements are understood.
