# ESUT Marketplace Security Remediation Audit

**Audit date:** 25 August 2026  
**Source brief:** `pasted_content_2.txt`  
**Scope:** Authentication, authorization, routing, data validation, legal links, SEO, media exposure, reliability, and release hardening.

## Executive finding

The current application already contains substantial security and marketplace integrity work: first-party password reset/token procedures, server-side role middleware, ownership-aware tRPC procedures, server-authoritative checkout, Cloudinary media eligibility controls, protected evidence storage, guarded API fallbacks, and broad automated coverage. The brief is therefore not a request to replace the architecture. The highest-confidence gaps found during this audit are runtime security headers, public legal/support/contact route coverage, a duplicated Active listings render in `StorePage.tsx`, and the need for targeted regression proof for the remaining brief claims.

## Verified mapping

| Brief finding | Current implementation evidence | Audit state | Planned disposition |
|---|---|---|---|
| Password recovery | `PasswordRecoveryPage.tsx` exposes request/reset/verify flows; the server has password-reset procedures and availability gating. | Partially satisfied. Normal-recipient email delivery remains unavailable until an authorized sending domain/provider prerequisite is resolved. | Preserve the existing secure flow; test generic responses, expiry, single-use behavior, and session handling. Do not fabricate delivery. |
| Search XSS / unsafe sinks | Repository search found only the shadcn chart configuration sink in `client/src/components/ui/chart.tsx`; user-facing marketplace content uses React text rendering. | No confirmed user-controlled HTML sink found. | Add payload regression coverage for search and representative user-content surfaces; do not add an unsafe sanitizer or blacklist. |
| Admin disclosure | `server/_core/trpc.ts` gates `adminProcedure` to `ADMIN`/`SUPER_ADMIN`; admin pages are registered in `App.tsx`. | Server procedure boundary exists; direct route/API regression coverage must be confirmed. | Verify anonymous, customer, seller, admin, stale-session, and manipulated-role cases. |
| Terms/privacy/support/contact | `App.tsx` has no public `/terms`, `/privacy`, `/support`, or `/contact` route in the current registry. | Confirmed route gap. | Add truthful, owner-reviewable pages with last-updated metadata and working navigation; avoid unsupported legal claims. |
| Unknown product/store | `ProductPage.tsx` has loading/error/unavailable states; `StorePage.tsx` has loading/error/unavailable states and retry. | Frontend recovery exists; real HTTP status behavior and regression coverage need verification. | Add tests and safe route messaging without exposing internal IDs. |
| Explore validation | Explore has client-side normalized range handling from the prior discovery release. | Client safeguards exist; server-side bounds/enums and impossible-range behavior require targeted audit proof. | Verify the actual procedure contract and add server regression coverage where needed. |
| Store duplicate listings | `StorePage.tsx` contains two identical `STORE CATALOGUE` / `Active listings` sections, one immediately after the other. | Confirmed functional/UI defect. | Remove the duplicate render at component logic level and add regression coverage. |
| Security headers/CORS | `server/_core/index.ts` currently registers parsers, storage/OAuth/tRPC/API fallback, schedules, and static/Vite serving; no general security-header middleware is present. | Confirmed runtime hardening gap. | Add non-breaking baseline headers and production-safe transport policy; inspect CORS need before allowing any cross-origin credentials. |
| Cookies/session | `server/_core/cookies.ts` sets HttpOnly, Secure according to transport, and SameSite None for secure proxy requests / Lax locally; dedicated tests exist. | Existing and tested. | Preserve; add only missing regression proof if required. |
| CSRF/request security | OAuth includes a state/nonce cookie check; tRPC uses session cookies. | OAuth callback protection exists; broader state-changing request-origin policy requires review. | Do not add an unvalidated token. Determine same-origin deployment requirement and test appropriate Origin/Referer handling. |
| Cloudinary/media | Cloudinary is authoritative for eligible public media; private evidence remains in managed storage; server validation and lifecycle metadata exist. | Existing architecture aligns with brief. | Preserve; audit public response fields and opaque media identifiers. |
| Public data/location exposure | Store pages display public store location and public store/listing data. | Requires deliberate response review; no automatic destructive normalization. | Verify public/business pickup wording and avoid exposing private residential detail. |
| Guest cart | Guest cart exists with local device storage and authenticated cart merge. | Existing feature; integrity edge cases require focused tests. | Verify stale listing, changed price/stock, duplicate, merge, and cross-account cases. |
| SEO | No `robots.txt`, `sitemap.xml`, or dedicated SEO route files were found in the inspected paths. | Confirmed SEO configuration gap. | Add public crawler controls and dynamic-safe metadata without indexing private routes. |
| Light-only visual state | `NotFound.tsx` still contains `dark:` utility classes although `App.tsx` removes the dark class and enforces light color scheme. | Runtime is light-only, but stale dark utilities remain. | Remove stale dark-only classes where touched and add a light-only regression. |

## Owner or external-dependency blockers

Normal-recipient password-reset and verification email delivery remains dependent on an authorized sender domain/provider configuration. Custom-domain binding, hosting-provider migration, PostgreSQL migration, and infrastructure/RPO/RTO decisions remain explicitly paused by the owner. This remediation may test and harden the current implementation but must not pretend those dependencies are resolved.

## First remediation batch

The safest first batch is: remove the duplicate store catalogue render; add truthful legal/support/contact routes and navigation; add baseline runtime security headers without broad credentialed CORS; add regression tests for admin authorization, unknown product/store recovery, legal route availability, duplicate render prevention, and XSS-as-text behavior; then validate the complete suite, build, and responsive routes.

## First batch validation

The duplicate store catalogue was reduced to one Active listings section. Public `/terms`, `/privacy`, `/support`, and `/contact` routes render with truthful owner-review notices, last-updated metadata, safe return paths, and registration/footer links. Runtime smoke checks confirmed `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and `Content-Security-Policy: frame-ancestors 'none'`; HSTS is intentionally absent over local HTTP and is applied behind forwarded HTTPS. No wildcard credentialed CORS header is advertised. Unknown product/store recovery and the administrator access boundary were visually checked. Desktop and mobile checks showed readable legal pages, safe 404 recovery, protected admin messaging, and no horizontal overflow.

The exact validation run passed **70 test files, 204 tests, and 1 intentional skip**, followed by TypeScript and the production build. The contract coverage includes duplicate-render prevention, legal route registration, registration/footer link targets, crawler controls, light-only 404 utilities, safe React text-rendering paths, admin procedure boundary presence, and security-header behavior.

## Deferred after first batch

The remaining broad brief items still require deeper procedure-level verification or owner/external decisions: full auth/session lifecycle proof, exhaustive admin anonymous/customer/seller/stale-session cases, formal CSRF/origin policy, dynamic public-resource HTTP status semantics, complete guest-cart and order-tampering matrix, public location disclosure policy, final legal approval, and production sender-domain, hosting, custom-domain, database-provider, RPO/RTO, and migration decisions. These are not claimed as complete.

## Runtime cache hardening follow-up

The Express entrypoint now disables the `X-Powered-By` fingerprint and applies `Cache-Control: no-store` to `/api/trpc` responses so authenticated RPC payloads are not stored by browsers or shared proxies. This does not alter public Cloudinary/media delivery caching and does not add wildcard credentialed CORS. Focused and full validation now passes **70 test files, 205 tests, and 1 intentional skip**, with TypeScript and production build passing.

## Authorization follow-up

The server authorization regression now includes an anonymous-request case across administrator, moderator, operations, seller, and super-administrator boundaries. The test confirms that missing sessions cannot enter protected procedures, while the existing role matrix continues to enforce the intended staff boundaries. This is evidence for the shared middleware boundary, not a claim that every individual admin route has been manually exercised; that exhaustive route matrix remains pending.

The latest validation passed **70 test files, 205 tests, and 1 intentional skip**, followed by TypeScript and the production build. The public legal and support pages, registration links, crawler controls, unknown-resource recovery, runtime headers, and light-only 404 were checked again at desktop and mobile widths.
