# ESUT Marketplace Dashboard Communication and Reliability Plan

## Goal

Systematically audit the buyer, seller, and administrator dashboards to identify features that are missing, disconnected, stale, incorrectly authorized, or visually present without a working server-side action. The work will trace every reviewed interface control to its tRPC procedure, database state, notification/audit consequence, and downstream user-facing update. Only verified gaps, faults, and security weaknesses will be repaired; working features will not be rebuilt.

## Audit principles

The audit will use real marketplace records where safe, but will not approve applications, alter order states, delete data, send emails, or change user roles merely to test a dashboard. It will preserve the current one-account dual-role design, campus pickup and cash-on-pickup limitation, two-party pickup confirmation, and existing administrator security gates. Any test requiring a state-changing action will use an isolated fixture or a transaction-safe test double first. Browser checks will distinguish real authentication state from server-test fixtures.

## Phase 1: Cross-role feature inventory

Create a role-to-feature matrix for buyer, seller, and administrator routes. For every route and visible action, record the page component, its query/mutation procedure, expected permissions, backing tables, expected loading/error/empty state, and any side effect such as a notification, audit record, inventory transition, or role change.

The buyer review will cover account overview, orders and pickup codes, cart/checkout, favorites, offers, messages, notifications, profile/settings, password change, seller journey, and dispute/report entry points. The seller review will cover seller onboarding, store settings, store application, listing and inventory actions, orders, pickup-code verification, analytics, offers/messages, and operational queue. The administrator review will cover dashboard KPIs, seller verification and application review, users, stores, listings, orders, reports, disputes, notifications, audit logs, analytics, security alerts, settings, and every navigation entry.

## Phase 2: Contract and data-flow analysis

For each dashboard surface, trace the component’s `trpc.*` calls to the router procedure and then to the relevant schema/database queries. Verify that query projections match the UI’s expected fields, query inputs are stable and role-scoped, mutations invalidate or update every affected dashboard query, and action results are reflected for the originating user and the counterpart role.

This phase will specifically inspect high-risk communication chains: seller application to administrator review to buyer/seller journey updates; buyer checkout to seller order queue to pickup confirmation; seller order changes to buyer pickup reminders; administrator moderation to affected user notifications; and password/profile/security changes to authentication/session state. It will also identify navigation links that point to incomplete pages, filters that do not reach the server, mutation controls without a meaningful response, and analytics cards that are not linked to real drill-down data.

## Phase 3: Safe runtime and browser verification

Run the existing Vitest suite and inspect test coverage by role and dashboard procedure. Add a focused browser scenario matrix for public, buyer, seller, and administrator entry points at desktop and mobile widths. Each scenario will confirm page loading, correct role gating, data rendering, navigation escape paths, query error recovery, and non-destructive controls.

Where a representative authenticated account is needed, use existing role sessions if available. If authentic buyer/seller sessions are unavailable, use procedure-level test contexts and explicitly report the limitation rather than creating or promoting accounts. Browser checks will avoid irreversible operations such as approving a seller, changing a role, marking an order complete, or uploading evidence.

## Phase 4: Gap classification and repair scope

Publish a concise gap matrix before implementation, separating findings into four classes: confirmed broken behavior; incomplete but visible feature; authorization/security defect; and intentional limitation or future feature. For each confirmed issue, define the smallest safe fix across schema, router, UI, and tests. Items that require product decisions, new external credentials, real user data, or destructive test actions will be listed as approval gates rather than silently implemented.

Expected repair patterns include fixing incorrect procedure wiring, adding missing query invalidation after mutations, completing genuine empty/loading/error/retry states, correcting route or navigation destinations, enforcing ownership filters, synchronizing counterpart notifications, and extending regression tests. No fabricated dashboard KPIs, customer activity, or fake review data will be introduced.

## Phase 5: Validation, reporting, and handoff

After approved repairs, run TypeScript validation, the full Vitest suite, targeted procedure tests, and selected browser scenarios. Capture before/after behavior for every fixed communication chain and check that role boundaries, stack-trace suppression, safe response projections, and private evidence protection remain intact. Reconcile `todo.md`, save a checkpoint, and provide a dashboard communication audit report with the final feature matrix, confirmed fixes, remaining limitations, and prioritized next steps.

## Acceptance criteria

The audit is complete when every buyer, seller, and administrator dashboard action has a documented backend contract or an explicit intentional limitation; all confirmed broken links/data-flow gaps have an approved remediation path; cross-role state changes appear consistently in the appropriate counterpart dashboard; no action exposes data outside role and ownership boundaries; and the validated fixes pass automated and browser regression coverage.

## Assumptions and risks

The current connected browser already has an elevated session, while ordinary authenticated role sessions may not be available for a full live walkthrough. The plan therefore combines read-only live checks with non-mutating procedure tests and flags any coverage gap clearly. External dependencies such as email delivery, Google Maps, deployment configuration, and infrastructure monitoring are out of scope unless they are directly proven to cause a dashboard communication failure.
