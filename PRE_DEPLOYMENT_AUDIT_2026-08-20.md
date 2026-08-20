# ESUT Marketplace — Focused Pre-Deployment Audit

**Prepared:** 20 August 2026  
**Scope:** Public routes, representative mobile/desktop UI states, route integrity, asset use, runtime/build health, and performance-sensitive client structure.  
**Method:** Type check, complete automated test suite, production build, static route/reference scan, managed asset reference scan, runtime-log sample, and desktop/mobile UI captures. No marketplace records were fabricated or changed during the audit.

## Executive Assessment

The marketplace has a sound functional baseline: type checking passed, the production build completed, and the automated suite passed with **41 test files, 130 tests passed, and 1 intentionally skipped live Redis test**. The audit did not identify a confirmed broken public navigation link or a current runtime API failure in the sampled logs.

However, the site is **not yet ready for external hosting cutover or high-volume public launch**. The highest-priority issues are operational email readiness, excessive initial JavaScript, residual oversized authentication branding assets, sparse listing imagery, and a small number of internal UX/accessibility inconsistencies.

## Confirmed Findings

| Priority | Finding | Evidence | User impact | Recommended repair |
|---:|---|---|---|---|
| P0 | Ordinary-recipient password-recovery email is intentionally unavailable until a verified sending domain is configured. | The password-recovery screen correctly presents the unavailable state; the current report identifies verified email delivery as a high launch gate. | Users cannot rely on self-service password recovery or normal-recipient verification for a wider launch. | Verify an ESUT-controlled sending domain, then perform real recipient tests for verification, reset, order, and security email flows. |
| P1 | The initial JavaScript bundle is oversized and has no route-level code splitting. | Production build: `index-*.js` 1.70 MB, 326 KB gzip; Vite emitted its chunk-size warning; no `React.lazy` or dynamic imports were found. | Slower first load and higher data use, especially on mobile networks. | Split public, auth, buyer, seller, moderator, and administrator routes into lazy-loaded chunks; defer heavy charts and administrative modules. |
| P1 | Authentication and password-recovery pages still load the legacy 6.1 MB logo PNG. | `AuthPage.tsx` and `PasswordRecoveryPage.tsx` reference `esut-main-logo_0f99c6ab.png`; public storefront header already uses the 24 KB WebP replacement. | Slower account entry and inconsistent logo optimization. | Replace remaining legacy logo references with the managed 24 KB WebP and retain the existing branded fallback pattern. |
| P1 | Many active listings have no seller-provided primary photo, causing repeated generic fallback cards. | Public catalogue and home captures show multiple `Seller photo unavailable` cards; catalogue response records contain `image: null` for several active listings. | The catalogue looks sparse and buyer confidence is reduced even though the fallback is honest. | Make a primary photo mandatory before publication for new listings; guide existing sellers to add real images; provide category-specific fallbacks only while media is absent. |
| P1 | Product detail text can be visually difficult to scan when sellers enter dense unstructured specifications in the description. | The inspected iPhone detail shows a long all-capitals detail block with weak field separation. | Buyers may struggle to compare condition, capacity, pickup facts, and pricing quickly. | Add structured product attributes by category and render them as labelled specification rows; preserve the existing free-text description as supplementary content. |
| P1 | Administrator note flows still use browser-native `window.prompt`. | `AdminSuitePages.tsx` has a shared `note()` helper based on `window.prompt`. | Poor accessibility, inconsistent visual language, weak validation feedback, and an avoidable production UX inconsistency. | Replace this remaining helper with the existing structured dialog pattern used for moderator and customer-facing report/dispute actions. |
| P2 | The public mobile header shows only the small logo mark, with limited marketplace name context. | Mobile homepage capture shows the logo mark, cart, and menu but not the ESUT Marketplace wordmark. | Brand recognition is weaker on first mobile visit. | Add a compact text wordmark beside the mobile logo or an accessible persistent brand label in the mobile header. |
| P2 | Homepage shelves have similar card-grid treatment despite different editorial roles. | Desktop home capture shows Fresh Arrivals, Deals, Trending, and Campus Picks with very similar visual structure. | Shoppers receive less visual distinction between urgency, popularity, and student relevance. | Give each shelf a limited editorial signature while preserving the existing common product-card system. |
| P2 | Asset availability and live performance require ongoing monitoring rather than one-off manual checks. | Current runtime sample showed no active 4xx/5xx API failure; historic aborted-request entries exist in the development log. | Emerging regressions may be found late without operational visibility. | Add production error monitoring, core-web-vitals collection, upload-failure metrics, and alert thresholds before hosting cutover. |

## Route and Runtime Results

The route audit compared 42 literal navigation targets with 69 registered client routes. It found no confirmed public navigation defect. The only unmatched literal was `/components`, located in the internal component-showcase page rather than ordinary marketplace navigation. The seller dashboard target `/seller/orders?status=READY_FOR_PICKUP` was reported by the literal scanner only because its query string was not normalized; the base `/seller/orders` route is registered.

The sampled runtime logs showed no fresh client or API error pattern. The older `request aborted` server-log entries are not sufficient on their own to diagnose a defect; they should be observed in production with counts, request IDs, and route context before being prioritized as a repair.

## UI Review Results

Desktop and mobile captures of the homepage, catalogue, login, registration, seller onboarding, and a real product detail page were reviewed. The responsive layout remains coherent at 375 px width: account entry, marketplace search/filter controls, seller onboarding, and registration controls stay within the viewport. Public account entry is clear, and seller onboarding communicates the verification gate well.

The strongest UX improvements should now target **catalogue completeness and scanability**, rather than rebuilding the working responsive shell. Listing-image coverage, structured product information, a faster first load, and consistent branded authentication assets will produce the most practical improvement before hosting migration.

## Recommended Repair Order

1. Resolve the verified email-sending domain and perform real end-to-end delivery validation.
2. Replace legacy auth/recovery logo asset references and implement category-aware missing-image treatment.
3. Make photo readiness and structured attributes part of the seller publication flow without fabricating any product data.
4. Remove remaining privileged `window.prompt` flows in favour of accessible structured dialogs.
5. Add route-level code splitting and measure the new bundle output on desktop and mobile.
6. Add production monitoring and complete the staff case-management/media-safety launch work identified in the comprehensive report.

## Deployment Decision

The audit recommends **holding the external Vercel migration** until the P0 email gate is resolved and the P1 performance/media/administrative UX repairs are implemented and validated. The current codebase is stable enough for focused remediation; it should not be treated as a final high-volume external-hosting release yet.
