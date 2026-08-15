# ESUT Marketplace Response-Safety Entry-Point Inventory

## Scope

This inventory records the client data-fetching boundary used by the ESUT Marketplace application after the resumed response-safety audit. The marketplace uses the shared tRPC client configured in `client/src/main.tsx`; its transport is wrapped by `client/src/lib/trpcFetch.ts`, which rejects non-JSON responses before the tRPC parser runs. The server-side `server/_core/apiFallback.ts` returns structured JSON for unknown `/api/*` routes before the SPA fallback can emit an HTML document.

## Client entry-point groups

| Entry-point group | Registered routes | Data boundary | Response-safety status |
|---|---|---|---|
| Public storefront | `/`, `/explore`, `/category/:slug`, `/product/:slug`, `/store/:slug` | Shared `trpc` procedures through the guarded transport | Source-audited; public homepage and catalogue were live-checked |
| Authentication | `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email` | Shared `trpc` procedures through the guarded transport | Source-audited; authentication transport regressions cover HTML responses |
| Buyer account | `/account`, `/account/orders`, `/account/orders/:id`, `/account/favorites`, `/account/offers`, `/account/messages`, `/account/messages/:id`, `/account/notifications`, `/account/reviews`, `/account/support`, `/account/verification`, `/account/profile`, `/account/settings` | Shared `trpc` procedures through the guarded transport | Source-audited; account and messages were live-checked with a connected customer session |
| Cart and checkout | `/cart`, `/checkout` | Shared cart and checkout tRPC procedures through the guarded transport | Source-audited; server-side ownership, inventory, price, and payment-policy checks remain authoritative |
| Seller workspace | `/sell`, `/seller`, `/seller/store`, `/seller/products`, `/seller/products/new`, `/seller/products/:id/edit`, `/seller/inventory`, `/seller/orders`, `/seller/orders/:id`, `/seller/offers`, `/seller/messages`, `/seller/messages/:id`, `/seller/reviews`, `/seller/analytics`, `/seller/settings` | Shared `trpc` procedures through the guarded transport | Source-audited; `/seller` approval gate was live-checked |
| Moderator workspace | `/moderator` | Shared moderator tRPC procedures through the guarded transport | Source-audited; role boundary was live-checked |
| Administrator workspace | `/admin`, `/admin/users`, `/admin/users/:id`, `/admin/sellers`, `/admin/stores`, `/admin/listings`, `/admin/categories`, `/admin/orders`, `/admin/orders/:id`, `/admin/offers`, `/admin/verifications`, `/admin/reports`, `/admin/disputes`, `/admin/reviews`, `/admin/notifications`, `/admin/audit-logs`, `/admin/settings`, `/admin/settings/notifications` | Shared administrator tRPC procedures through the guarded transport | Source-audited; customer role boundary was live-checked; list queries now use `MARKETPLACE_PAGE_SIZE` (24) |

## Non-tRPC paths

The client source audit found no direct `fetch`, alternate tRPC client, or unguarded JSON parser for marketplace data. Static assets, the Vite development bridge, OAuth callback infrastructure, and managed storage proxy are framework or infrastructure paths rather than marketplace data-fetching entry points and are not routed through the client marketplace tRPC transport.

## Regression evidence

`client/src/lib/trpcFetch.test.ts` injects HTML responses for representative public, authentication, and seller paths and asserts that the guarded transport rejects them before JSON parsing. `server/_core/apiFallback.test.ts` asserts that unknown `/api/*` routes return a JSON error response. The broader automated suite passes with 59 tests.

## Development request-aborted traces

The recurring `raw-body` `BadRequestError: request aborted` entries are recorded separately in `RESUMED_VALIDATION_NOTES.md`. They occur during cancelled HTTP streams associated with navigation or development HMR and have not correlated with an HTML-as-JSON response, a failed marketplace mutation, or a stuck data query. They should remain low-noise development diagnostics rather than being treated as a marketplace response-parsing defect unless a future network capture shows a user-visible 400/500 failure.

## Remaining limitation

A safe, end-to-end reproduction of the original development-server disconnect that first exposed the HTML-as-JSON symptom remains open. The application-level safeguards and representative route checks are in place, but the original failure condition has not been intentionally recreated because doing so would require disrupting a live development request.
