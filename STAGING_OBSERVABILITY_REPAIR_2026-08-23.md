# Staging Observability Repair — 2026-08-23

## Scope

This note records the repair of the repeated Cloudflare Pages staging request for `/api/trpc/observability.record`. It does not deploy Cloudflare, change DNS, alter the managed public site, change database or Redis state, or activate any new provider configuration. The managed Manus website remains the sole public environment while Cloudflare staging work is paused by owner direction.

## Verified failure path

The frontend telemetry component emits best-effort operational events through the existing tRPC mutation `observability.record`. The shared transport rejects a response before tRPC parsing when its content type is not JSON. The visible message is therefore a transport-level diagnostic such as “received an unexpected API response,” not evidence that a product, order, account, or message operation failed.

The prior staging guard recognized `staging.esut-marketplace-staging.pages.dev` and branch hosts below `.esut-marketplace-staging.pages.dev`, but not the default project hostname `esut-marketplace-staging.pages.dev`. A deployment using that default hostname could therefore enable telemetry against a staging backend that might not expose the same current procedure contract. Multiple page errors or asset failures could then produce repeated recorder mutations; if the recorder failed, the global mutation-error observer already suppressed recursive API-error events, but it did not prevent the initial best-effort recorder fan-out.

## Repairs

The staging predicate now normalizes hostnames and recognizes the default project hostname, the named staging alias, and branch-preview subdomains. Production and the managed Manus domain are not matched.

The telemetry emitter now has two client-only safety controls. It allows at most one recorder request in flight and opens a five-minute circuit after any recorder failure. A successful request clears the in-flight state. A failed request clears the in-flight state and blocks additional telemetry for the circuit window. Telemetry remains non-critical and does not affect marketplace requests, authentication, checkout, inventory, messaging, or moderation behavior.

The existing Pages Function proxy remains deliberately narrow: it forwards only same-origin `/api/*` requests, preserves request methods and bodies including POST mutations, forwards cookies and forwarded-host/protocol context, removes hop-by-hop headers, and applies private no-store/noindex response headers. The current proxy tests continue to verify these boundaries.

## Validation

The following checks passed after the repair:

| Check | Result |
| --- | --- |
| Staging-host helper tests | Passed, including default alias, case normalization, branch preview, and managed production non-match |
| Telemetry contract tests | Passed, including staging guard, recorder failure suppression, five-minute circuit, and single-flight containment |
| Full Vitest suite | 62 files passed; 177 tests passed; 1 intentional skip |
| TypeScript | Passed with no errors |
| Production build | Passed; route-level lazy loading and deterministic runtime chunks remain intact |
| Chromium smoke suite | 20 scenarios passed |
| Responsive managed-preview review | Public home, catalogue, guest cart, seller onboarding, and signed-out messages checked at 375×812; no protected data exposed |
| Cloudflare proxy unit coverage | Existing same-origin forwarding, cookie/header, non-API rejection, and POST-body tests passed in the full suite |

## Remaining boundary

An actual refreshed Cloudflare Pages deployment was not performed because the project owner previously paused Cloudflare staging, Pages API-proxy, caching, and provider-migration work and designated the managed Manus site as the sole public environment. When the owner authorizes staging again, the first verification should use both `esut-marketplace-staging.pages.dev` and a branch-preview hostname, confirm that no `observability.record` request is emitted from either staging host, then validate the same-origin proxy with a read-only anonymous tRPC request before any authenticated or mutation testing.
