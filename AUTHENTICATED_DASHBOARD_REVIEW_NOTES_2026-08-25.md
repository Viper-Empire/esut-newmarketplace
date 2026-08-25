# Authenticated Dashboard Review Notes — 2026-08-25

## Session and scope

The managed ESUT Marketplace site was reviewed read-only using the authenticated Bernard Raphael session. No data, moderation decision, order status, listing, profile, or setting was changed.

## Buyer dashboard (`/account`)

The buyer workspace loaded successfully after a brief workspace skeleton. It showed the expected persistent sidebar navigation for Overview, My orders, Saved listings, Product reminders, Saved search alerts, My offers, Messages, Notifications, Reviews, Security & devices, and Profile & security. The overview displayed real zero-state metrics, truthful seller-journey status for the same account, quick actions, recent activity, and explicit routes back to the marketplace, cart, orders, messages, and seller workspace. Light-only branding was intact. No private content was exposed beyond the authenticated account’s own data.

## Seller dashboard (`/seller`)

The seller workspace loaded successfully and showed the expected navigation for Overview, My listings, Orders, Inventory, Offers, Messages, Reviews, Analytics, and Store settings. Real store metrics and order records rendered, including action-queue links for open orders, pickup readiness, and low stock. Quick actions exposed add-product, order, inventory, offer, and analytics paths. The workspace provided a visible marketplace escape route and logout control. Light-only branding was intact and the page stated that records belong only to the seller’s store.

## Administrator boundary (`/admin`)

The same non-administrator session received a safe protected boundary: the public moderation explanation and a link to the protected queue were visible, followed by “Administrator access required.” No administrator dashboard data, moderation records, or private marketplace records were exposed. This confirms the server-side role boundary is active.

## Remaining gate

A complete administrator dashboard visual review requires a genuine administrator-authenticated session. The current session is not an administrator and was not elevated. Mobile-specific authenticated screenshots also require a browser viewport/session review. No authorization bypass, role change, or account mutation was attempted.

## Administrator session review

A genuine administrator-authenticated session loaded `/admin` successfully. The overview showed real operational metrics, a product-reminder delivery panel, runtime and asset health, security alerts, seven-day launch activity, seller verification, store application review, and administrator attribution. The page retained light-only branding and real-data labeling.

The protected `/admin/listings` moderation queue loaded with explicit `Back to admin overview` and `Browse marketplace` escapes, a persistent administration navigation rail, visible filters for Needs review, Legacy evidence, All listings, Drafts, Live, Paused, Suspended, and Archived, and a read-only public listing image integrity check that states it does not reveal private storage keys or evidence URLs. The initial loading state was visible and truthful; no moderation action was clicked.

The admin dashboard review is continuing across deeper read-only routes and responsive states. No records, evidence decisions, listing statuses, or settings were changed.

## Administrator overview and analytics

The authenticated `/admin` overview presented real marketplace metrics, including attention count, users, buyers, stores, products, order totals, completed sales, low-stock listings, reminder delivery, runtime/asset health, security alerts, launch activity, seller verification, and application history. It included a visible logout control and protected moderation entry. Light-only styling remained consistent.

The authenticated `/admin/analytics` route loaded with a persistent administration navigation rail, explicit `Back to admin overview` and `Browse marketplace` escapes, date-range inputs with Reset, operational drill-down cards, order-lifecycle links, pickup-aging links, seller-performance data, and trust-workload links. The page consistently labeled values as current/real operational records and did not expose private evidence URLs. No filters were changed and no action links were activated.

## Administrator settings and audit log

The authenticated `/admin/settings` route loaded as a concise settings hub with explicit links for Notification settings and Catalogue categories, plus the standard admin navigation, `Back to admin overview`, and `Browse marketplace` escapes. No setting controls were changed.

The authenticated `/admin/audit-logs` route loaded with server-evaluated filters for sensitive action, actor name/email, and date range, with Apply and Reset controls. The page explicitly states that passwords, tokens, evidence keys, storage URLs, and other secret values are excluded. No filters were submitted and no audit records were modified.

The administrator review confirms working overview, moderation, analytics, settings, and audit-log surfaces with consistent light-only branding and contextual escape navigation. Mobile-specific visual verification remains limited by the current browser viewport tooling; no mobile-only defect was inferred without evidence.
