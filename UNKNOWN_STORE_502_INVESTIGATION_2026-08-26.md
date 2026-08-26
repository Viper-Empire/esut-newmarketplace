# Unknown-store 502 investigation — 2026-08-26

## Scope

This investigation covered the reported production route `https://esutshop-59wzg8bs.manus.space/store/elon-16350002`. The probe was read-only. No marketplace records, seller stores, listings, infrastructure settings, domains, or provider configuration were changed.

## Findings

The production route shell returned HTTP 200 on three consecutive requests. The local preview route also returned HTTP 200 on three consecutive requests.

The exact production tRPC request for `marketplace.store` returned HTTP 404 on three consecutive requests with the application envelope `{ code: "NOT_FOUND", message: "This store is unavailable." }`. The response included `cache-control: no-store` and the expected security headers.

The backend source already contains an explicit missing-store guard before the product and review queries. The frontend StorePage already has a dedicated error state with “We could not load this store”, a retry action, and a marketplace navigation action.

A browser verification initially displayed “Loading store…” while the request/retry cycle settled. After the request completed, the browser displayed the intended “We could not load this store” recovery state. The browser network trace showed the store RPC request and retries; it did not show a reproducible production 502 for the store RPC during this investigation.

## Remediation and validation

A focused regression test was added to `server/buyerExperience.procedure.test.ts` to assert that an unknown public store slug returns the typed `NOT_FOUND` error and does not execute the downstream product/review queries.

Validation passed: the focused test, full Vitest suite, TypeScript compilation, and production build. This establishes that the currently observed behavior is a transient gateway/proxy report or an earlier request-state observation rather than a reproducible store-query crash. The existing retry and error UI remain appropriate for temporary API failures.

## Follow-up boundary

If a future probe captures an actual HTTP 502, the timestamp, response headers, Cloudflare ray ID, and the corresponding browser network request should be retained so the managed-hosting proxy event can be correlated with runtime logs. No code change is justified by the current reproducible evidence beyond the regression coverage added here.
