# Narrow-mobile remediation findings — 2026-08-28

## 320px and 360px baseline after shared fixes

The public homepage, Explore, product detail, cart, login, messages, and anonymous admin boundary were captured at 320px and 360px full-page widths. The public product grid now reads as a deliberate single-column mobile catalogue; product cards, prices, seller metadata, and actions remain inside the viewport. Explore filter controls stack without document-level horizontal scrolling. Product detail content stacks through gallery, purchase controls, seller block, reviews, and related listings. Cart empty state, login, protected messages, and anonymous admin access remain visible and actionable.

The category strip is intentionally locally scrollable on narrow phones rather than forcing all categories into a compressed grid. The dialog width and dashboard loading skeleton were corrected at source level for viewport safety. No global overflow suppression was added.

The 360px capture shows the homepage still has a long vertical composition, but its content is readable and contained. The remaining review focus is to test the exact 375px and 390px boundaries, tablet/desktop regression, and authenticated responsive workspaces where the browser session is available. A transient historical App.tsx Vite pre-transform warning remains in prior logs, while current TypeScript checks pass; it should not be treated as an active build failure without reproduction.

## 375px and 390px boundary findings

The same seven routes were captured at 375px and 390px. The homepage hero, category strip, Explore controls, product detail review/actions, cart state, login surface, protected messages state, and anonymous admin boundary remained contained and readable. The product grid stayed intentionally single-column through the narrow-phone range. No new document-level horizontal overflow, clipped primary action, or malformed mobile route state was observed.

Next required checks are 768px and 1280px regression captures, followed by the broader authenticated workspace QA where the current browser session permits it.

## 768px and 1280px regression findings

The required tablet and desktop capture sets completed at 768px and 1280px. The existing two-column desktop hero, four-column product catalogue, product-detail split layout, auth presentation, and public/admin boundary states remain visually intact. The narrow-mobile additions are scoped below 480px, so tablet and desktop composition were not restructured.

Across the six required widths, the tested public routes and protected-state routes remained contained. Authenticated buyer/seller/admin workspace visual QA is still limited where the screenshot session is unauthenticated; no authenticated behavior is claimed from those captures. The current implementation and test suite continue to report no TypeScript errors or active build failure.

## Extended store, checkout, account, and seller-entry findings

Store-not-found and protected checkout/account states remain contained and actionable at 320px and 390px. The `/sell` seller-entry page composes into a readable single-column flow with wrapped buttons, stacked trust sections, and accordion questions. The tested `/seller/dashboard` path correctly returns the existing safe 404 because that URL is not the application’s seller workspace route; this is a route-state observation, not a responsive overflow defect. No destructive authenticated actions were performed.

## Canonical buyer/seller workspace state findings

The canonical `/seller`, `/seller/messages`, `/account/orders`, and `/account/search-alerts` routes were checked at 320px and 390px. Protected seller and buyer states remain readable, with stacked actions, visible return paths, and no clipped primary controls. Seller messaging exposes its workspace context and return-to-buyer path without overflowing. The earlier `/seller/dashboard` probe was not treated as a real application route because the canonical seller route is `/seller`.

Authenticated interaction inside buyer/seller workspaces was not performed destructively; the screenshot context showed protected or onboarding states rather than an authenticated seller/buyer session. This limitation is retained for final reporting.

## Admin route group 1 findings

The admin operations, analytics, users, listings, orders, verifications, security, and settings routes were captured at 320px and 390px. The anonymous protected state remains generic and does not expose public commerce navigation, metrics, or control data. The route entry surfaces remain contained within the viewport and preserve the admin boundary at both narrow-phone widths.

Because these captures use the managed screenshot session rather than the signed-in browser session, they validate the protected responsive fallback and route separation—not authenticated drawer interaction or real admin table rendering. That distinction remains explicit for final QA reporting.

## Admin route group 2 findings

The remaining seller/store/category/offer/report/dispute/review/notification admin routes were captured at 320px and 390px. Their anonymous protected states remain contained, generic, and free of public commerce navigation. No route-level mobile overflow or clipped access state was observed.

The `/admin/audit-logs`, `/admin/recovery`, `/admin/reservations`, and `/admin/staff` routes remain covered by the shared route architecture and source/security contracts; their authenticated content was not exercised destructively. The managed screenshot session cannot be treated as authenticated admin QA, so that limitation remains documented.
