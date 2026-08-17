# Seller–Administrator Checkout, Campus Pickup, and Completion Oversight Flow

**Author:** Manus AI  
**Project:** ESUT Marketplace  
**Status:** Current implementation flow with operational control gaps identified

## Executive Summary

ESUT Marketplace currently gives sellers operational control over the fulfilment stages of their own orders while administrators retain marketplace-wide oversight, dispute authority, moderation capability, and access to order/audit evidence. Checkout itself is initiated by the buyer, but the resulting seller-specific orders become visible to the corresponding verified seller and to protected administrator order oversight.

The current system records completion when the seller confirms pickup and cash collection. Administrators can inspect the order, status history, audit log, disputes, reports, store, buyer, and seller records. The system does not yet require a separate buyer confirmation before an order becomes completed, so this report treats seller completion as the current operational evidence and clearly marks buyer acknowledgement as a future control.

## Operational Actors

| Actor | Operational authority | Restrictions |
|---|---|---|
| Buyer | Creates checkout, receives status notifications, attends pickup, pays cash, opens a dispute, and reviews a completed purchase. | Can only access and mutate buyer-owned carts/orders/support records. |
| Verified seller | Sees and manages orders routed to the seller’s own store; confirms, processes, marks ready, cancels where allowed, and records pickup completion. | Must pass seller verification and store ownership checks; cannot update another store’s order. |
| Administrator | Reviews marketplace-wide orders, users, stores, trust queues, disputes, reports, audit records, and analytics. Can perform administrator-authorized order transitions and dispute resolution. | Protected by administrator role procedures; sensitive actions are audited. |
| Moderator | Reviews reports/listings/reviews under scoped moderation authority. | Does not receive general administrator authority. |

## A. Checkout Creation and Seller Visibility

The buyer’s checkout request is validated and committed transactionally. Multi-seller carts create a separate order for each seller group under a shared order batch. Each order stores the buyer, seller store, payment and fulfillment policy, totals, item snapshots, and a `PENDING` status.

The seller receives an in-app `NEW_ORDER` notification linking to the seller order detail route. The administrator does not need a separate approval action for every ordinary checkout order; administrators can inspect the resulting order through protected administrator order oversight and the new analytics drill-down views.

The following records establish the operational chain:

| Record | Administrator and seller value |
|---|---|
| `orders` | Identifies buyer, store, lifecycle, fulfillment, payment state, totals, and timestamps. |
| `orderItems` | Preserves what was ordered at the time of checkout. |
| `inventoryReservations` | Shows stock held for the order before completion or cancellation. |
| `orderStatusHistory` | Provides the chronological state and actor trail. |
| `auditLogs` | Records sensitive order creation and transitions. |
| `notifications` | Shows seller and buyer operational messages. |
| `disputes` and `reports` | Provide escalation evidence when an order or participant is contested. |

## B. Seller Confirmation and Processing

The seller opens the seller order workspace and may move an owned order through the server-enforced lifecycle. The allowed progression is `PENDING → CONFIRMED → PROCESSING → READY_FOR_PICKUP → COMPLETED`. Cancellation and dispute transitions are also governed by the order lifecycle policy.

For each transition, the server validates the current state and then updates the order, appends a status history row, appends an audit event, and notifies the buyer. The seller interface communicates that cash is collected only at pickup. The administrator can later distinguish the actor who made a transition from the participant who received the notification.

The seller bulk-operation capability follows the same rules. A batch request accepts only bounded, unique order identifiers, resolves them through the seller’s store-owner predicate, validates every selected transition before applying any, and commits all effects in one transaction. A mixed selection that includes an invalid lifecycle transition is rejected rather than partially applied.

## C. Ready-for-Pickup Oversight

When the seller marks an order `READY_FOR_PICKUP`, the buyer receives an order-status notification and the buyer dashboard promotes a real pickup reminder. The administrator analytics drill-down groups ready orders by live age: within one day, two to three days, and four or more days, using the order’s current update timestamp.

This enables administrators to answer operational questions without fabricated metrics:

| Question | Current evidence |
|---|---|
| How many orders are ready? | Live order status counts. |
| Which sellers have pickup backlog? | Seller performance rows with ready-for-pickup counts. |
| How old is the backlog? | Ready-order age buckets within the selected range. |
| What is the commercial value? | Live order totals by lifecycle status in kobo, displayed as Naira in the UI. |
| Which order should be inspected? | Links from analytics to administrator order records. |

The dashboard reminder is an in-app presentation of a real ready status. It is not an email, SMS, push message, or repeated scheduled reminder. The project continues to document the existing normal-recipient email delivery boundary.

## D. Campus Pickup, Cash, and Completion Evidence

The seller and buyer coordinate campus collection using the available order and participant-authorized communication surfaces. The buyer presents the order details and receives the items. The payment method remains `CASH_ON_PICKUP`; the platform does not authorize online card or wallet payment for this flow.

The seller then uses the explicit completion action **Complete pickup and record cash**. The server moves the order from `READY_FOR_PICKUP` to `COMPLETED`, changes payment status to `PAID`, commits the active inventory reservations, records the status transition, records an audit event, and notifies the buyer.

From an administrator perspective, completion evidence currently consists of:

| Evidence layer | What it proves | What it does not prove |
|---|---|---|
| Order status `COMPLETED` | The seller submitted a permitted completion transition. | It is not a separate buyer signature or receipt upload. |
| Payment status `PAID` | The platform has recorded cash as collected according to the seller completion action. | It is not a bank settlement or payment-provider confirmation. |
| Status history | Which actor and note were recorded at each stage. | It does not independently verify physical handover. |
| Audit log | A sensitive order event was recorded with an actor and metadata. | It does not replace a buyer acknowledgement. |
| Inventory commitment | Reserved units were atomically decremented. | It does not prove item condition or buyer satisfaction. |
| Buyer notification | The buyer was notified of the status. | Notification delivery is not the same as acceptance. |

## E. Disputes, Exceptions, and Administrator Intervention

The buyer can open a dispute during permitted pre-completion stages. Administrators can inspect active disputes and use the protected administrator tools to investigate and resolve operational conflicts. Moderators manage applicable report, listing, and review queues under their separate authority.

An administrator may also inspect an order directly, review its items and history, and perform an authorized transition where the business policy permits administrator intervention. Any such action should contain an explicit note because the note becomes part of the operational record and explains why the administrator changed the normal seller path.

Cancellation releases active inventory reservations through guarded arithmetic. Completion commits inventory through guarded arithmetic. If the database update does not affect exactly one expected row, the operation raises a conflict rather than silently producing an inconsistent stock state.

## F. Administrator Analytics Drill-Downs

The new administrator analytics workspace derives live metrics from orders, stores, listings, inventory, reports, disputes, seller applications, and verification requests. It includes a selected date range and links from summary cards or rows to existing operational pages.

| Drill-down | Administrator use |
|---|---|
| Order lifecycle | Compare volume and value across pending, confirmed, processing, ready, completed, cancelled, and disputed states. |
| Pickup aging | Find ready orders that may need operational attention. |
| Seller performance | Compare store order volume, completion, ready backlog, completed sales, active listings, and low stock. |
| Trust and safety | Move from counts of reports, disputes, pending verifications, and applications to the existing review queues. |
| Source records | Open orders, stores, listings, disputes, reports, verifications, or applications rather than treating a chart as the final authority. |

These metrics are live operational views. They should be read together with the underlying order detail, status history, audit trail, and dispute records when an administrator is making a consequential decision.

## Security and Governance Controls

Seller order filters and bulk operations apply the seller’s store-owner predicate on the server. Buyer reminders are built from orders selected by the authenticated buyer ID. Administrator analytics is protected by the administrator procedure. Public order identifiers are not treated as authorization; ownership and role checks remain mandatory for every read and write.

Batch updates are bounded and transaction-safe. The server validates all selected states before beginning the transition loop. Each individual transition still creates the same order history, audit, notification, reservation, and payment effects as the single-order path.

## Current Gaps and Recommended Controls

| Gap | Current behavior | Recommended future control |
|---|---|---|
| Buyer confirmation | Not required; seller completion records the pickup. | Add a buyer acknowledgement step, with a non-response policy and dispute window, if two-party confirmation is required. |
| Cash evidence | Payment becomes `PAID` at seller completion. | Add optional receipt/reference data and a structured cash-collection note if operational reconciliation needs it. |
| Physical handover proof | No photo, signature, code, or QR confirmation is required. | Add a low-friction pickup code or buyer/seller confirmation pair, while preserving a safe fallback for offline campus conditions. |
| Repeat reminders | Dashboard reminder is event-derived; no recurring job exists. | Add a deduplicated reminder schedule only after cadence, opt-out, and escalation policy approval. |
| Analytics history | Drill-downs derive from current live records. | Add immutable daily snapshots only if the business needs historical reporting unaffected by later record corrections. |

## Authoritative Source Files

The current flow is grounded in [`server/routers.ts`](server/routers.ts), [`server/orderLifecycle.ts`](server/orderLifecycle.ts), [`drizzle/schema.ts`](drizzle/schema.ts), [`client/src/pages/OrderPages.tsx`](client/src/pages/OrderPages.tsx), [`client/src/pages/AdminPage.tsx`](client/src/pages/AdminPage.tsx), [`client/src/pages/AdminSuitePages.tsx`](client/src/pages/AdminSuitePages.tsx), and [`client/src/pages/AccountPage.tsx`](client/src/pages/AccountPage.tsx).


## Two-Party Pickup Confirmation and Administrator Evidence

The current handoff control adds a two-party confirmation step to the seller completion path. A six-digit code is generated per seller-specific order and stored encrypted. The buyer-only order detail reveals it only when the order is ready for pickup. The seller must collect the code from the buyer at the physical handoff and submit it through the seller-owned order detail mutation.

The server rejects codes for another seller’s order, codes entered before `READY_FOR_PICKUP`, malformed or incorrect codes, replay attempts, and attempts after five failures. A successful match is consumed atomically with the `COMPLETED` transition, cash payment status, inventory commitment, status history, audit log, and participant notifications. This gives administrators a stronger operational trail: completion now indicates seller action plus possession of the buyer-visible handoff code, rather than an unverified seller button alone.

Administrator order transitions continue to respect the shared lifecycle helper. They cannot bypass the pickup-code requirement for completion. If a dispute requires exceptional intervention, the administrator must resolve it through the supported dispute policy; a future administrator-assisted confirmation workflow would need explicit buyer-consent, evidence, and audit requirements before being introduced.
