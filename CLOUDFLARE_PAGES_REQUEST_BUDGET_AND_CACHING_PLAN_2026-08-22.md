# Cloudflare Pages Request Budget and Caching Plan

## Purpose

This plan reduces Cloudflare Pages Function usage for ESUT Marketplace without caching private sessions, orders, seller operations, messages, evidence, carts, or account data. It applies first to the temporary Pages staging preview, which currently shares the managed marketplace backend. No caching change should be deployed until the daily Functions quota resets and the Pages Function route can be verified with a single controlled API-read check.

## Why the daily quota was exhausted

Cloudflare Pages Functions are invoked according to the function invocation routes. Cloudflare documents that a Pages project with Functions can invoke Functions for requests by default, and recommends `_routes.json` to exclude static routes so that static requests remain unlimited. The project’s earlier staging layout had a single `/api/*` proxy function but no verified invocation-route policy, making unnecessary static-asset/function invocation the primary risk to investigate after the quota reset.[1]

The repeated telemetry error was a separate amplification problem. A failed telemetry mutation could be observed by the global API-error listener and reported as another telemetry mutation. The application now contains a client-side loop guard and suppresses best-effort telemetry in the Cloudflare staging preview. This containment does not cache private data and should remain in place.

> **Boundary:** a request budget is not a reason to cache private tRPC responses. Responses containing authentication cookies, account data, orders, messages, evidence, carts, seller controls, or administrator data must remain `Cache-Control: no-store, private`.

## Request classes and policy

| Request class | Examples | Cloudflare Function policy | Browser/client policy | Shared-cache policy |
| --- | --- | --- | --- | --- |
| Static frontend assets | Hashed JavaScript, CSS, logo, fonts, static images | Must bypass Pages Functions. | Browser uses immutable hashed asset cache. | CDN-cached by static asset behaviour. |
| Public read-only catalogue data | Featured shelves, category list, public store summary, product detail that contains no viewer-specific state | Later move to dedicated read-only public endpoints; do not route through general authenticated tRPC batches. | React Query `staleTime` 60–300 seconds; invalidate after public listing/store changes. | Allow only explicit `public, s-maxage` policy after endpoint-by-endpoint review. |
| Public search/discovery | Search result pages and category filters | Debounce/submit requests; paginate. | Preserve query-key cache; avoid refetch on every keystroke. | Cache only anonymous GET results with normalized query keys and a short TTL. |
| Authentication and private user data | `auth.me`, account, cart, orders, messages, dashboard, seller/admin workspaces | Function required once the proxy is repaired. | Use caller-scoped React Query cache and precise invalidation after mutations. | **Never shared-cache.** Keep `no-store, private`. |
| Event and chat polling | Workspace event signals, active conversation refresh, typing | Function required only when signed in, page-visible, and relevant view is open. | Adaptive focused polling; stop while tab is hidden. | **Never shared-cache.** |
| Operational telemetry | Web vitals, client/API/asset errors | Not required in staging while backend lacks the procedure. | Sample and batch only in an approved production backend; never report telemetry failures recursively. | Never cache writes. |

Cloudflare will not cache responses marked `private`, `no-store`, `no-cache`, or `max-age=0`; this is the required state for all private marketplace traffic.[2]

## Immediate controls after the quota reset

### 1. Limit Function invocation routes

After **2026-08-23 00:00 UTC**, deploy and verify an API-only function invocation manifest as part of a controlled test:

```json
{
  "version": 1,
  "include": ["/api/*"],
  "exclude": []
}
```

The test must use one anonymous `GET /api/trpc/auth.me?batch=1` request and confirm `application/json`, `Cache-Control: no-store, private, max-age=0`, and the expected anonymous tRPC response. Do not judge the manifest while the quota is exhausted: Cloudflare can fail open to static assets after the Functions allowance is consumed, which resembles a route misconfiguration.

### 2. Keep static traffic out of the API proxy

The Pages Function should be invoked only for `/api/*`. The frontend HTML, JavaScript chunks, stylesheets, logos, and product-image CDN URLs must remain static or media requests. This is the most important quota saving because a single marketplace visit loads many static resources while it should need only a small number of API requests.

### 3. Tighten polling by view visibility

The current caller-scoped workspace event poll is every 30 seconds. The new messaging design adds focused active-thread refreshes. Before enabling authenticated staging testing, apply these operational limits:

| Screen state | Proposed maximum behaviour |
| --- | --- |
| Signed-out visitor | No `/api/*` polling. |
| Signed-in dashboard, visible tab | One event-signal poll every 90–120 seconds. |
| Browser tab hidden | Stop polling entirely; refetch once on visibility return. |
| Conversation list open, no active thread | One list refresh every 30–60 seconds. |
| Active chat thread, visible tab | Message detail refresh every 10–15 seconds and list refresh every 30–60 seconds. |
| Typing indicator | Emit at most once every 6 seconds while there is non-empty input; expire server-side after 9 seconds; do not poll it when the chat is not open. |

The application should invalidate the precise affected React Query records after a successful send, seller action, order transition, or moderator decision instead of broadly refetching all workspace data. That supplies immediate feedback without an extra polling round trip.

## Safe caching implementation phases

### Phase A — Browser query cache first

This phase needs no shared edge cache. It uses existing React Query deduplication and stores only data already authorised for the active browser session.

| Area | Proposed `staleTime` | Invalidation trigger |
| --- | ---: | --- |
| Categories | 5 minutes | Administrator category change. |
| Public featured/home shelves | 60–120 seconds | Listing publish, pause, stock-out, or store-status change. |
| Public product detail | 60 seconds | Listing, price, inventory, or evidence decision change. |
| Private profile/cart/orders/messages | 0–30 seconds only where needed | Exact successful mutation or relevant durable event. |
| Search results | 30–60 seconds per normalized query | Search submit/filter change; no request per keystroke. |

Set the query client’s default `refetchOnWindowFocus` to false for non-critical discovery views, then explicitly refetch security-sensitive or order-state screens when the user returns to a visible tab.

### Phase B — Dedicated public-read API endpoints

The current shared tRPC `/api/trpc` transport can batch public and private procedures and is not a safe shared-cache target. Create narrow anonymous read endpoints only after an endpoint contract review:

```text
GET /api/public/catalog/featured
GET /api/public/categories
GET /api/public/listings/:slug
GET /api/public/stores/:slug
```

Each endpoint must return only public fields, reject cookies/authorization-dependent projections, use normalized cache keys, and set an explicit response policy such as:

```text
Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=600
```

Public listing, inventory, price, store-status, and moderation changes must invalidate the affected cache key immediately. Until targeted invalidation is implemented, use a conservative 60-second shared TTL for stock-sensitive product data and do not cache checkout availability.

### Phase C — Controlled edge cache

Pages Functions can use Cloudflare cache APIs, but only for the reviewed public endpoints. The cache key must exclude cookies and any user identity header; the response must be constructed as a public anonymous projection. Private `/api/trpc/*`, OAuth callbacks, uploads, signed URLs, evidence, messages, dashboards, and order routes remain outside the cache.[3]

## Telemetry and retry safeguards

Telemetry must be best-effort. It should never be required for an interaction, never show an error toast, and never retry itself after an API error. In staging it is disabled because the preview proxies to an older backend that does not expose the current observability procedure. When the backend is upgraded, enable it gradually with these constraints:

1. Sample only a small percentage of routine web-vital events.
2. Batch or coalesce duplicate client errors by route and metric name.
3. Enforce a browser-side per-page cap.
4. Do not capture error messages, identifiers, request bodies, session information, or private URLs.
5. Never trigger telemetry from the telemetry procedure’s own failure.

## Monitoring and decision gates

The Cloudflare usage panel should be checked at least once after the reset and after each controlled staging test. Record Function invocations separately from static asset traffic. The decision gates are:

| Gate | Required evidence | Decision |
| --- | --- | --- |
| Function route restored | One JSON API-read response through Pages after reset | Permit controlled anonymous discovery test. |
| Static bypass verified | Cloudflare usage shows static browsing does not add Function invocations materially | Permit broader frontend UI testing. |
| Private no-store verified | Authenticated API responses retain `no-store, private` | Permit limited account testing. |
| Polling budget verified | Visible-only request counts remain within the daily budget under a realistic session | Permit chat/dashboard testing. |
| Public cache endpoint reviewed | Contract, TTL, invalidation, and no-cookie rule are tested | Enable shared cache for that endpoint only. |

## Recommendation

The recommended order is: restore the route after the reset, enforce API-only Function invocation, reduce focused polling, use browser query caching, and then introduce explicit public-read endpoints with short shared caching. Do **not** cache the existing general tRPC transport at the edge. The first three steps reduce invocation volume without risking another user’s marketplace data being delivered to the wrong account.

## References

[1]: https://developers.cloudflare.com/pages/functions/routing/ "Cloudflare Pages Functions routing"
[2]: https://developers.cloudflare.com/cache/concepts/default-cache-behavior/ "Cloudflare default cache behavior"
[3]: https://developers.cloudflare.com/workers/runtime-apis/cache/ "Cloudflare Workers Cache API"
