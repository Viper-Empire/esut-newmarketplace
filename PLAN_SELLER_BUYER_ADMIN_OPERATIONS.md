# ESUT Marketplace Operations Expansion Plan

## Goal

Extend the production marketplace workspaces with safer seller order operations, buyer-visible pickup reminders, administrator analytics drill-downs, and two source-of-truth operational reports documenting how buyers, sellers, and administrators interact during checkout, campus pickup, and completion confirmation.

The implementation will preserve the existing ESUT visual system, tRPC-first architecture, database-backed data model, server-side authorization, campus pickup and cash-on-pickup constraints, and the authoritative order lifecycle already implemented in `server/orderLifecycle.ts`.

## Current-State Findings

The current seller order list is a protected, seller-scoped paginated query with one-order detail transitions. It currently has no status filters, selection model, or batch mutation. The authoritative lifecycle permits `PENDING → CONFIRMED → PROCESSING → READY_FOR_PICKUP → COMPLETED`, with cancellation or dispute paths constrained by the existing transition policy.

The buyer dashboard already returns buyer-owned orders, favorites, unread notifications, and recent notifications. The notification table and protected notification procedures already exist. The buyer order detail page exposes status history, cash-on-pickup information, dispute entry, and a completed-order review path. Pickup reminder work can therefore begin as an in-app, event-driven experience without introducing email or fabricated data.

The administrator overview already exposes real launch-monitoring KPIs and a seven-day order series. Existing administrator order, user, store, listing, report, dispute, notification, and audit-log pages provide drill-down destinations, but not dedicated analytics breakdown views. New analytics should derive from live records rather than create snapshot or forecast tables unless later requirements demand historical snapshots.

## Key Decisions and Assumptions

| Area | Decision | Rationale |
|---|---|---|
| Seller filters | Add server-side status filtering with optional date/search parameters, then retain seller ownership predicates before all filters. | Keeps results correct for large stores and prevents client-only filtering from hiding authorization mistakes. |
| Bulk updates | Submit a set of seller-owned public order IDs and one target status. Validate every order and every transition before mutating any order. Use one transaction and fail the entire batch if any row is missing, unauthorized, terminal, or transition-invalid. | Prevents partial operational updates and preserves the existing state machine. |
| Bulk completion | Keep completion explicitly labeled as “Complete pickup and record cash.” Do not add online payment or automatic completion. | Matches the existing cash-on-pickup policy. |
| Buyer reminders | First release uses existing in-app notifications plus a dashboard “Pickup reminders” panel for real `READY_FOR_PICKUP` orders and unread pickup-related notifications. | Meets the requested dashboard experience without requiring email delivery or recurring background infrastructure. |
| Recurring reminders | Do not silently add scheduled jobs. If repeated reminders after a time threshold are later required, present a separate decision for a deterministic daily background job with deduplication and opt-out rules. | Avoids unnecessary automation, duplicate notifications, and external delivery assumptions. |
| Administrator analytics | Add a dedicated analytics workspace with server-derived drill-down queries and links into existing admin lists/details. | Reuses existing navigation and keeps analytics traceable to operational records. |
| Operational reports | Produce two Markdown reports: buyer↔seller flow and seller↔administrator flow. Each will distinguish verified current behavior, actors, status transitions, notifications, audit records, controls, and documented gaps. | Prevents reports from overstating functionality and gives the team an implementation baseline. |

## Implementation Phases

### Phase 1 — Establish contracts and schema impact

Inspect the full order, notification, audit-log, and administrator analytics contracts. Confirm whether current order rows contain sufficient timestamps and store/buyer identifiers for the requested breakdowns. Prefer existing tables and indexes. Only generate a migration if a real requirement emerges, such as a durable reminder deduplication key or a persisted batch-operation record.

Define shared input/output types for seller order filters, bulk transition requests, pickup reminder summaries, administrator drill-down filters, and analytics result rows. Keep all monetary values in kobo and all timestamps in UTC at the API layer.

### Phase 2 — Implement seller order filters

Extend the protected seller order query with validated filters such as status, date range, and normalized public-order search. Apply the store-owner predicate first and return the existing safe order/store projection. Preserve pagination limits and add deterministic ordering.

Update the seller orders page with accessible status tabs or a select control, search/date controls only where supported by the current design, loading/error/empty states, and a clear “reset filters” action. Filters must work at desktop and mobile widths and must not expose orders from another store.

### Phase 3 — Implement transactional bulk status updates

Add a verified-seller mutation accepting selected public order IDs, a target lifecycle status, and an optional operator note. In a single database transaction, load all selected orders joined to stores, confirm ownership, reject duplicates and missing IDs, validate each transition through the existing lifecycle helper, and apply transitions using the same status-history, audit-log, notification, inventory, and dispute rules used by the single-order path.

Use a bounded selection size, explicit confirmation for irreversible or customer-visible actions, disabled controls while pending, clear success/error feedback, and query invalidation after success. The UI should show the number of selected orders, explain the target action, and remove or refresh completed selections after the transaction.

The batch action menu will only offer statuses that are valid for every selected order. If there is no common valid next status, the interface will explain why a mixed selection cannot be updated together. This avoids a misleading “bulk update” control that would fail unpredictably.

### Phase 4 — Add buyer pickup reminder presentation

Extend the buyer dashboard projection with a real pickup-reminder section derived from buyer-owned orders in `READY_FOR_PICKUP` and the buyer’s notification rows related to order readiness or pickup. Include order public ID, seller/store name, current status, total, creation/update timestamp, and a direct link to the protected order detail page.

Ensure seller transitions to `READY_FOR_PICKUP` create or update a buyer notification exactly once per lifecycle transition, with a target route to the buyer order detail. Add a reminder card that explains campus pickup and cash-on-pickup without implying payment was completed. Provide loading, retrieval failure with retry, no-reminders, unread, and already-read states.

Add focused notification ownership and duplicate-prevention tests. Do not send normal-recipient email as part of this phase because the project’s authorized sending-domain limitation remains documented.

### Phase 5 — Build administrator analytics drill-downs

Create an administrator-only analytics route and navigation entry using the existing admin shell. Add server-authoritative drill-down procedures for:

| View | Real data to expose | Drill-down destination |
|---|---|---|
| Order lifecycle | Counts and monetary totals by `PENDING`, `CONFIRMED`, `PROCESSING`, `READY_FOR_PICKUP`, `COMPLETED`, `CANCELLED`, and `DISPUTED`, with selected date range. | Filtered administrator order list and order detail. |
| Pickup operations | Ready-for-pickup backlog, age buckets, completed pickups, cancellations, and disputes. | Admin orders, disputes, and order details. |
| Seller performance | Active sellers, active listings, order volume, completed sales, completion rate, low stock, and pickup readiness, scoped by seller. | Admin stores, seller/store detail, and orders. |
| Buyer activity | New members, orders placed, saved/favorite activity where already available, notifications, and completion/review eligibility signals. | Admin users, orders, notifications, and reviews. |
| Trust and safety | Reports, disputes, pending verifications, and seller applications over the chosen period. | Existing reports, disputes, verification, and application queues. |

Use validated date ranges and bounded result sizes. Each chart/card must disclose whether it represents a count, kobo amount, rate, or current backlog. Use links from each metric into existing administrator list/detail routes so administrators can inspect the source records. Do not fabricate trend lines or calculate percentages with an undefined denominator.

### Phase 6 — Produce the two operational flow reports

Write `BUYER_SELLER_CHECKOUT_PICKUP_FLOW_REPORT.md` documenting the buyer-to-seller journey from cart validation and multi-seller checkout through seller confirmation, processing, ready-for-pickup notification, campus collection, cash payment, completion, review eligibility, cancellation, and dispute paths. Include actors, system procedures, database records, notifications, status history, ownership controls, and exact current limitations.

Write `SELLER_ADMIN_CHECKOUT_PICKUP_FLOW_REPORT.md` documenting the seller-to-administrator operational relationship: order visibility, seller lifecycle actions, audit history, administrator oversight, dispute and cancellation authority, inventory effects, notification responsibilities, metrics, and the evidence administrators can use to confirm that a buyer’s order reached completion. Explicitly distinguish the current behavior—seller records pickup completion—from any future requirement for an explicit buyer confirmation action.

Both reports will identify the authoritative source files and include a concise “current versus recommended” gap table. They will not claim that a buyer-confirmation step, recurring reminder scheduler, email delivery, or payment settlement exists unless the codebase proves it.

### Phase 7 — Validate and checkpoint

Add or extend Vitest coverage for seller filter ownership, invalid filter inputs, mixed-selection rejection, all-or-nothing bulk transitions, legal and illegal lifecycle transitions, notification ownership, reminder deduplication, administrator role rejection, analytics aggregation contracts, date-range boundaries, zero-data states, and rate/denominator correctness.

Extend Chromium coverage for protected seller bulk controls, buyer reminder rendering and navigation boundaries, administrator analytics access boundaries, responsive layouts, accessible labels, confirmation dialogs, and controlled HTML-response recovery. Use authenticated browser sessions for operational screens and non-destructive fixtures only.

Run `pnpm check`, `pnpm test`, and `pnpm test:e2e`. Visually inspect seller, buyer, and administrator desktop/mobile states, including empty, loading, error, filtered, selected, and confirmation states. Reconcile `todo.md`, save a checkpoint, and deliver the checkpoint plus the two Markdown reports.

## Validation and Security Requirements

Every seller query and mutation must enforce store ownership on the server. Every buyer reminder and order link must enforce buyer ownership. Every administrator analytics query and drill-down must enforce administrator or super-administrator role checks. Batch mutations must be transaction-safe, bounded, idempotency-conscious, and audited per order.

The UI must never show fabricated sales, orders, pickup confirmations, reviews, payouts, or buyer activity. All customer-visible messages must preserve the marketplace policy that fulfillment is campus pickup and payment is cash on pickup. The reporting must treat the order status history and audit log as evidence, not client-side button clicks.

## Automation Options for Pickup Reminders

| Approach | Tradeoffs | Cost | Setup Complexity |
|---|---|---:|---:|
| Event-driven in-app reminders on `READY_FOR_PICKUP` plus dashboard promotion | Immediate, deterministic, no scheduler, reuses existing notifications; does not send repeated reminders after several days. | No additional recurring service cost | Low |
| Daily deterministic reminder job for aged ready-for-pickup orders | Can remind buyers until collection, but requires deduplication, reminder cadence, timezone policy, opt-out behavior, and background execution. | Depends on the hosting/background-job configuration | Medium |

The recommended first implementation is the event-driven in-app approach because it satisfies the current dashboard request while avoiding duplicate background notifications and the project’s deferred email-domain dependency. A recurring reminder job remains an explicitly scoped follow-up if the marketplace requires escalating reminders for uncollected orders.

## Open Risks and Assumptions

The current code appears to let the seller record `COMPLETED` when pickup and cash collection occur; the requested reports will document this faithfully and flag explicit buyer confirmation as a potential future control rather than silently change the state machine. The existing analytics use live transactional data, so historical values can change when records are corrected or moderated; the administrator UI will label these as live operational metrics.

If the user expects SMS, WhatsApp, push notifications, or recurring email reminders rather than dashboard-only reminders, the notification architecture and provider/domain decisions will need to be revisited before implementation. No such external channel is assumed in this plan.

## Expected Deliverables

The implementation will deliver seller order filtering and transaction-safe bulk status updates, buyer pickup reminder presentation, administrator analytics drill-down views, focused automated and browser coverage, an updated checklist, a saved project checkpoint, and the two Markdown operational flow reports described above.
