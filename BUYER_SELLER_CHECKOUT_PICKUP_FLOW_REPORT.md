# Buyer–Seller Checkout, Campus Pickup, and Completion Flow

**Author:** Manus AI  
**Project:** ESUT Marketplace  
**Status:** Current implementation flow with explicit future gaps

## Executive Summary

ESUT Marketplace currently supports a buyer journey that begins with a real, database-backed cart and ends with a seller-recorded campus pickup completion. The platform permits only **campus pickup** and **cash on pickup**. The server validates listings, prices, stock, seller grouping, and order ownership before creating orders. The buyer and seller then follow an authoritative lifecycle: `PENDING`, `CONFIRMED`, `PROCESSING`, `READY_FOR_PICKUP`, and `COMPLETED`, with cancellation and dispute branches protected by server-side rules.

> The current implementation treats seller completion as the operational confirmation that pickup occurred and cash was collected. It does not yet require a separate buyer acknowledgement action.

## Participants and Responsibilities

| Participant | Responsibility during the flow | Source of authority |
|---|---|---|
| Buyer | Maintains a cart, submits checkout, follows order status, attends campus pickup, pays cash, and may dispute or review an eligible completed purchase. | Buyer-owned procedures in `server/routers.ts`; buyer order pages in `client/src/pages/OrderPages.tsx`. |
| Seller | Confirms the order, prepares the items, marks the order ready for pickup, coordinates collection, records completion, and may cancel within permitted states. | Seller-owned procedures and verified-seller guard in `server/routers.ts`. |
| Marketplace | Validates stock and totals, reserves inventory, records status history, sends in-app notifications, and enforces ownership and lifecycle rules. | `checkout`, `applyOrderTransition`, `orderStatusHistory`, `inventoryReservations`, `auditLogs`, and notification procedures. |

## Step 1: Discovery, Cart, and Checkout Preparation

The buyer discovers an active listing and adds it to the cart through the protected cart procedure. The server resolves the active listing, active store, current price, and inventory. The cart can contain listings from more than one seller, but checkout groups the lines by store so each store receives its own order record inside one order batch.

The buyer sees the server-calculated subtotal and proceeds through a protected checkout route. The order summary identifies campus pickup and cash on pickup. The buyer does not enter online payment credentials because the project explicitly excludes online payment processing for this flow.

## Step 2: Checkout Submission and Atomic Order Creation

When the buyer submits checkout, the server re-reads the cart and validates each active listing, store, price, quantity, and available stock. It rejects stale prices, unavailable listings, insufficient stock, invalid quantities, and duplicate order-batch submissions. The transaction creates the order batch, one order per seller group, order items with price/title/image snapshots, active inventory reservations, initial `PENDING` history rows, and audit records.

The cart’s active checkout lines are deleted only after the order creation transaction succeeds. The seller receives an in-app `NEW_ORDER` notification with a route to the seller order detail page. The buyer receives the created order public IDs and a cash-on-pickup payment policy in the checkout response.

| Record created or changed | Purpose |
|---|---|
| `orderBatches` | Groups the buyer’s multi-seller checkout attempt. |
| `orders` | Stores one seller-specific order with the buyer, store, totals, fulfillment, payment method, and lifecycle status. |
| `orderItems` | Preserves the listing title, image, unit price, quantity, and subtotal at purchase time. |
| `inventoryReservations` | Holds stock while the seller confirms and prepares the order. |
| `orderStatusHistory` | Records the initial `PENDING` status and the actor/note for later auditability. |
| `auditLogs` | Records the sensitive order-creation event. |
| `notifications` | Alerts the seller that an order awaits confirmation. |

## Step 3: Seller Confirmation and Preparation

The seller sees only orders belonging to the seller’s own approved store. The seller can open the order detail and advance the status through the lifecycle. A `PENDING` order can become `CONFIRMED`; a confirmed order can become `PROCESSING`. Each transition is checked by `assertAllowedOrderTransition` on the server, not trusted from the client button.

Every successful transition updates the order, appends status history, appends an audit record, and notifies the buyer. The seller’s interface explains that cash is collected only when the pickup is completed. If the seller cannot fulfil the order, the permitted cancellation path releases active inventory reservations safely.

## Step 4: Ready for Campus Pickup

After preparation, the seller advances the order from `PROCESSING` to `READY_FOR_PICKUP`. The buyer receives an in-app order-status notification and the buyer dashboard now presents a **Pickup reminders** panel for real ready-for-pickup orders. The reminder links directly to the buyer-owned order detail page and states that payment is cash on pickup.

The reminder does not imply that the buyer has collected the order, that the seller has been paid, or that the marketplace has settled a payment. It is a readiness signal only. A future recurring reminder job would require separate deduplication, cadence, and notification-preference decisions; the current dashboard implementation is event-derived and does not fabricate repeated notices.

## Step 5: Campus Pickup and Cash Collection

The buyer and seller arrange or follow the seller’s pickup instructions. The buyer checks the order details and the seller verifies the order items. The payment method remains `CASH_ON_PICKUP`, and the payment status remains unpaid until the seller records completion through the protected transition path.

The buyer can open a dispute before completion for a permitted active status. This provides a protected escalation path if the item, quantity, condition, or pickup experience is not acceptable. The dispute is routed for administrator review rather than silently changing the order outcome from the browser.

## Step 6: Completion Confirmation

The seller uses the explicit action **Complete pickup and record cash** to move the order from `READY_FOR_PICKUP` to `COMPLETED`. The server then commits the active inventory reservations, decreases available quantity, decreases reserved quantity, changes payment status to `PAID`, records status history, records an audit event, and notifies the buyer.

This is the current completion evidence model:

| Evidence | Current behavior |
|---|---|
| Seller action | Required to mark the order completed. |
| Buyer acknowledgement | Not currently a separate required mutation. |
| Cash confirmation | Encoded by seller completion and payment status becoming `PAID`; no receipt upload or cash amount field exists. |
| Inventory | Committed atomically during completion. |
| Review eligibility | Completed orders become eligible for buyer review through the existing review procedure. |
| Dispute | Available before completion and governed by the existing support/dispute procedures. |

## Step 7: Post-Completion Review and Support

After completion, the buyer can access the review route for eligible purchases. Reviews are restricted to completed purchases and subject to ownership, uniqueness, and moderation controls. The buyer may also view order history and the full status timeline.

The seller can view completed order activity and respond to verified buyer reviews. Administrators and moderators can inspect order history, audit logs, disputes, reports, and related seller/buyer records according to their protected roles.

## Security and Data-Integrity Controls

The buyer’s order queries require the authenticated buyer ID. Seller order queries and transitions require the verified-seller guard and the seller’s store-owner predicate. The checkout transaction validates stock and price at submission time, while inventory reservations and completion/cancellation updates use guarded arithmetic. The state machine rejects invalid transitions, terminal orders cannot be advanced, and sensitive transitions create history and audit evidence.

## Current Gaps and Recommended Follow-Ups

| Gap | Current status | Recommended follow-up |
|---|---|---|
| Separate buyer pickup confirmation | Not implemented; seller completion is the current confirmation. | Add a buyer acknowledgement mutation only if the business wants a two-party confirmation model. Define timeout, seller escalation, and dispute consequences first. |
| Pickup location/time coordination | Existing seller/store information and messaging are available, but there is no dedicated appointment workflow. | Add a participant-authorized pickup coordination record or structured message template. |
| Repeated pickup reminders | Dashboard readiness reminder is implemented; scheduled repeat notices are not. | Add a deduplicated background reminder policy only after cadence and opt-out rules are approved. |
| Cash receipt evidence | Payment status changes to paid at seller completion; no cash receipt or amount capture exists. | Add an optional seller receipt/reference field and audit metadata if required by operations. |
| Multi-party confirmation | Status history identifies actors, but the buyer is not required to confirm collection. | Consider a buyer confirmation step with a safe fallback for non-responsive buyers. |

## Authoritative Source Files

The primary implementation sources are [`server/routers.ts`](server/routers.ts), [`server/orderLifecycle.ts`](server/orderLifecycle.ts), [`client/src/pages/OrderPages.tsx`](client/src/pages/OrderPages.tsx), [`client/src/pages/AccountPage.tsx`](client/src/pages/AccountPage.tsx), [`drizzle/schema.ts`](drizzle/schema.ts), and [`server/checkoutPolicies.ts`](server/checkoutPolicies.ts).
