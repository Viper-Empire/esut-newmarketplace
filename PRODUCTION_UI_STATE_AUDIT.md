# ESUT Marketplace Production UI State Audit

## Scope and method

This audit covers the production-facing pages under `client/src/pages`. It inventories every page-level tRPC query and mutation, then confirms the visible state contract in source: loading or pending feedback, retrieval or mutation error feedback, empty or unavailable data feedback, and successful real-data or mutation outcomes. `ComponentShowcase.tsx` is excluded because it is a development showcase rather than a marketplace route.

The audit is source-backed and was followed by `pnpm check`, 59 Vitest tests, and the eleven-scenario Chromium smoke suite. It does not fabricate data or claim that deferred normal-recipient email delivery is live.

## Page-by-page state matrix

| Production page or group | Real queries | Mutations | Loading / pending | Retrieval or mutation failure | Empty / unavailable | Success / real-data outcome |
| --- | ---: | ---: | --- | --- | --- | --- |
| `Home.tsx` | 1 | 0 | Explicit loading state | Scoped Try again on marketplace-home failure; guarded transport boundary tested | Real collection sections and unavailable collection messaging | Real categories, listings, stores, services, and recruitment content |
| `ExplorePage.tsx` | 1 | 0 | Explicit loading state | Scoped Try again on search failure | Real no-result state | Real search, filter, sort, and pagination results |
| `ProductPage.tsx` | 1 | 6 | Product loading; mutation pending buttons | Scoped Try again on product failure; mutation errors use visible toasts | Unavailable listing state and real related/review/offer boundaries | Real product, seller, review, favorite, cart, offer, message, and report outcomes |
| `StorePage.tsx` | 1 | 1 | Store loading | Scoped Try again on store failure; report mutation error feedback | Unavailable store and real listing/review empty states | Real store, listing, review, and report outcomes |
| `CartPage.tsx` | 1 | 5 | Cart loading and mutation pending states | Scoped Try again on cart failure; mutation errors use visible feedback | Guest, empty, saved-for-later, and real cart states | Server-authoritative quantities, totals, merge, clear, save, and checkout navigation |
| `CheckoutPage.tsx` | 1 | 1 | Explicit cart loading and place-order pending | Scoped Try again on cart retrieval failure; place-order error regenerates idempotency key and reports failure | Sign-in, empty-cart, and real campus-pickup/cash-on-pickup review states | Successful order placement routes to real order history |
| `OrderPages.tsx` | 6 | 4 | List/detail loading and transition pending states | Scoped list/detail retries; mutation errors are visible | Empty order, unavailable detail, and real status-history states | Buyer, seller, and administrator order views preserve ownership and transition guards |
| `AuthPage.tsx` | 0 | 2 | Login/register pending state | Visible mutation error feedback and lockout messaging | Form validation and paused-email boundary | Real session creation, account creation, and role-aware navigation |
| `PasswordRecoveryPage.tsx` | 1 | 3 | Availability and mutation pending states | Scoped Try again on availability failure; mutation errors are visible | Deferred normal-recipient email availability is explicit | Real token procedures remain server-enforced; delivery boundary is honestly labeled |
| `AccountFeaturePages.tsx` | 16 | 13 | Query and mutation pending states | Scoped query retries and visible mutation errors across buyer account views | Empty favorites, offers, messages, notifications, reviews, and profile states | Real buyer-owned profile, settings, notifications, messages, offers, favorites, reviews, and password change |
| `SellPage.tsx` | 1 | 2 | Explicit onboarding loading and submission pending states | Scoped Try again on onboarding retrieval failure; mutation errors are visible | Signed-out, not-started, pending, rejected, and gated onboarding states | Visible verification/store-application success feedback and real approval gates |
| `SellerDashboardPage.tsx` | 2 | 0 | Summary loading states | Scoped retries for analytics and recent orders | Real empty summary states | Real seller-owned analytics and recent orders |
| `SellerManagePages.tsx` | 6 | 8 | Store/product/inventory/analytics loading and mutation pending states | Scoped retries for protected retrievals; mutation errors are visible | Real no-store, no-product, inventory, and analytics empty states | Real seller-owned store, product, image, inventory, and analytics mutations |
| `ModeratorPage.tsx` | 4 | 3 | Queue loading states | Scoped queue-specific retries; moderation mutation errors are visible | Real empty dashboard, report, listing, and review queues | Real role-gated moderation outcomes and audit-preserving mutations |
| `AdminPage.tsx` | 3 | 3 | KPI and queue loading states | Scoped overview, verification, and store-application retries; mutation errors are visible | Real empty queue/KPI states | Real administrator-only KPI and approval outcomes |
| `AdminSuitePages.tsx` | 12 | 7 | Shared `AdminQueryFeedback` covers list loading; mutation pending where action controls expose it | Shared error boundary with scoped refetch for administrator lists; mutation errors are visible | Real empty users, sellers, stores, listings, categories, offers, reports, disputes, reviews, notifications, and audit queues | Real role-gated moderation and settings actions with success notifications and invalidation |
| `NotificationSettingsPage.tsx` | 2 | 2 | Provider/template loading and mutation pending states | Scoped retries for both protected retrievals; mutation errors are visible | Explicit unavailable configuration and real template states | Real provider/template updates with success feedback and invalidation |

## Intentional boundaries

Normal-recipient email verification and password-reset completion remain deferred because the configured temporary sender is restricted and no authorized sending domain is available. The UI exposes this as an unavailable or paused state rather than pretending that delivery succeeded. Controlled browser regressions return HTML from public and authenticated tRPC paths and confirm that the guarded transport renders recovery boundaries without exposing `Unexpected token` text; the original development-server disconnect was not intentionally induced because doing so would disrupt a live service.

## Validation record

The source audit was followed by `pnpm check`, all 59 Vitest tests, and eleven passing Chromium scenarios. The browser scenarios cover public discovery, catalogue controls, mobile navigation, branded login and registration, protected account and role boundaries, cart, password-recovery availability, controlled public and authenticated HTML-response boundaries, and accessible button names.

## Remaining evidence work

The remaining unchecked objectives are not silently closed by this audit: broader continuous browser coverage for IDOR, tampering, uploads, concurrency, and full accessibility remains an expansion task; live valid-token email completion remains dependent on an authorized sending domain; and exact reproduction of the historical development-server disconnect remains intentionally deferred. The final handoff is only prepared after these limitations are reconciled in `todo.md`.

Generated: 2026-08-16
