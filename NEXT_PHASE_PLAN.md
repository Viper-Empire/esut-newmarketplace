# ESUT Marketplace — Next-Phase Implementation Plan

## Goal

Advance ESUT Marketplace from the current validated development milestone toward launch readiness by strengthening operational monitoring, seller reporting, security assurance, and production prerequisites without weakening real-data requirements, server-side authorization, or the campus-pickup/cash-on-pickup operating model.

## Current Baseline

The current checkpoint is `56913b85`. The project has real marketplace discovery, buyer and seller workflows, administrator and moderator operations, server-authoritative inventory/order handling, seller performance reporting, launch-monitoring KPIs, guarded tRPC transport handling, and protected browser coverage. The latest validation passed `pnpm check`, 64 unit tests, and 17 Chromium browser scenarios.

## Phase 1 — Confirm the release baseline

First, review the current checkpoint, checklist, implementation handoff, production UI state audit, and response-safety validation map. Re-run the type checker, full unit suite, and browser suite before changing code. Confirm that the new administrator and seller analytics procedures are protected by role and ownership guards, use real records only, and do not expose private user data.

## Phase 2 — Complete launch observability

Define a small operational metric contract for launch monitoring. It should cover order volume and completion, ready-for-pickup backlog, low-stock listings, open reports, active disputes, seller verification workload, store applications, and response/error health. Reuse existing server-side aggregations rather than duplicating calculations. Add clear empty and unavailable states, avoid predictive or fabricated numbers, and document the meaning and time window of each metric.

Add practical operational alerts or queue highlights next, prioritizing overdue pickup orders, low stock, unresolved disputes, and verification backlog. Alerts must be derived from real records, be role-restricted, and avoid sending email until an authorized sending domain is available.

## Phase 3 — Mature seller performance reporting

Extend the seller analytics workspace with selectable reporting periods, while preserving the seller’s own-store ownership scope. Include completed sales, order counts by lifecycle state, pickup readiness, completion rate, active and draft listings, available and reserved stock, offers, listing views, favorites, and seven-day activity. Add an exportable CSV or similarly structured report only if the existing project conventions support it, and ensure exports contain no other sellers’ or buyers’ private fields.

Add focused regression tests for period boundaries, empty stores, completed-order revenue rules, seller ownership isolation, and role rejection. Preserve kobo integer handling and local Naira presentation.

## Phase 4 — Expand high-risk browser assurance

Extend Playwright coverage in non-destructive or controlled environments. Add scenarios for validated file type/size rejection and successful evidence-upload UI boundaries without submitting real evidence; client-side tampering attempts against listing IDs, quantities, prices, seller IDs, and order IDs; buyer/seller/admin IDOR attempts; duplicate checkout submission behavior using controlled test data; and concurrent stock/checkout attempts using isolated fixtures or mocked responses.

Where a scenario requires authenticated users, use dedicated test accounts or safe mocked route responses. Never use another user’s real evidence, never approve or reject real marketplace records as part of a smoke test, and never create production orders merely to test concurrency.

## Phase 5 — Prepare deferred production prerequisites

Keep email delivery explicitly deferred until an authorized sending domain or approved provider account is available. When available, verify domain configuration, normal-recipient delivery, verification completion, password reset completion, bounce/failure handling, template rendering, and provider secret isolation. Do not weaken the current paused-mode safeguards while waiting.

Review backup, logging, rate limiting, upload restrictions, secret handling, and deployment configuration. Document a rollback path for analytics and browser-suite changes and ensure all operational metrics are observable without exposing sensitive data.

## Phase 6 — Final validation and handoff

Run type checking, the full unit suite, the complete browser suite, and targeted analytics/ownership tests. Review responsive administrator and seller analytics layouts at desktop and mobile widths. Reconcile the checklist with evidence rather than assumptions. Save a new checkpoint and update the implementation handoff with completed work, validation results, deferred prerequisites, known risks, and the recommended launch sequence.

## Acceptance Criteria

| Area | Completion condition |
|---|---|
| Analytics | Administrator and seller metrics use real server-side data, documented windows, role guards, and empty/error states. |
| Ownership | Seller reports cannot read another store’s metrics; administrator data remains role-restricted. |
| Browser assurance | High-risk upload, tampering, IDOR, and concurrency journeys have safe automated coverage or an explicit documented limitation. |
| Email | No delivery claims are made until an authorized sending domain/provider is available and normal-recipient tests pass. |
| Quality | Type checking, unit tests, browser tests, responsive checks, and focused regression tests pass. |
| Handoff | A new checkpoint and concise implementation handoff identify evidence, open risks, and rollback/launch guidance. |

## Assumptions and Risks

The next implementation phase will continue using the existing React, tRPC, Drizzle, MySQL/TiDB, managed storage, and Playwright stack. No payment provider or alternate fulfilment method will be introduced. The main external dependency is an authorized transactional email sending domain or provider account. The main technical risks are metric-definition drift, accidental cross-store data exposure, and unsafe browser tests that mutate real records; these will be controlled through shared server procedures, ownership tests, isolated fixtures, and explicit review before checkpointing.
