# Concurrency-Safe Inventory and Order Management Blueprint

**Product:** ESUT Marketplace  
**Purpose:** Turn the current checkout record-creation flow into a safe, auditable campus-pickup order system that cannot oversell stock under concurrent buyer activity.

> **Core principle:** Inventory must be allocated by the database in the same transaction that creates the order. The browser may request an order, but it must never be the authority on price, availability, reservation, payment state, or permitted status transitions.

## 1. Current State and Required Change

The current checkout already recalculates cart totals on the server, validates active listing status and stock, splits a cart by seller, creates one order per seller, snapshots order items, and runs the writes inside a transaction. This is a good foundation.

The remaining concurrency problem is the **check-then-decrement sequence**. Two requests can each read the same available quantity before either one reduces it. Both requests can then create orders, producing an oversold listing. The remedy is not another client-side check; it is an atomic database reservation.

## 2. Target Inventory Model

Keep `inventory.quantity` as the physical quantity on hand and use `inventory.reservedQuantity` as the total quantity held for active campus-pickup orders.

> **Available to buy = quantity − reservedQuantity**

| Field | Meaning after the change |
| --- | --- |
| `quantity` | Physical stock that has not yet been committed to a completed seller acceptance. |
| `reservedQuantity` | Stock temporarily held by valid pending/confirmed orders. |
| `quantity - reservedQuantity` | The only quantity a new checkout may allocate. |

Add an `inventoryReservations` table rather than trying to infer every held unit from current orders:

| Column | Purpose |
| --- | --- |
| `id` | Internal primary key. |
| `orderId` | The order holding the inventory. |
| `listingId` | The listing being held. |
| `quantity` | Units held for that line. |
| `status` | `ACTIVE`, `COMMITTED`, `RELEASED`, or `EXPIRED`. |
| `expiresAt` | Time after which an unconfirmed pickup reservation is released. |
| `createdAt`, `updatedAt` | Audit timing. |

Add an `orderBatches` table to represent a single buyer checkout that creates multiple seller orders. Its unique `(buyerUserId, idempotencyKey)` constraint prevents a browser retry or network replay from creating duplicate order sets.

| Column | Purpose |
| --- | --- |
| `publicId` | Buyer-facing checkout reference. |
| `buyerUserId` | Purchaser. |
| `idempotencyKey` | Client-provided UUID; unique per buyer. |
| `status` | Aggregate checkout status. |
| `createdAt` | Audit timestamp. |

Each `orders` row should receive a nullable `orderBatchId` and `reservationExpiresAt`. The existing order remains the seller-specific fulfilment unit.

## 3. Atomic Checkout Algorithm

Use one database transaction for every checkout. Do not use an in-memory lock; it fails across multiple instances and after restarts.

### Step-by-step transaction

1. Authenticate the buyer and require a stable `idempotencyKey` UUID from the checkout request.
2. Look for an existing order batch for `(buyerUserId, idempotencyKey)`. If it exists, return its existing seller order IDs without reserving stock again.
3. Read the buyer’s active cart and reject an empty cart.
4. Validate every listing is `ACTIVE`, belongs to an active store, and calculate all prices on the server.
5. For each cart line, reserve stock through a conditional update such as:

```sql
UPDATE inventory
SET reservedQuantity = reservedQuantity + :requestedQuantity
WHERE listingId = :listingId
  AND quantity - reservedQuantity >= :requestedQuantity;
```

6. Check the affected-row count. If it is not exactly one for any line, throw an availability error. The surrounding transaction rolls back every earlier reservation automatically.
7. Create the order batch, one seller order per store, order-item snapshots, and an `ACTIVE` reservation row for every order item.
8. Insert the initial `PENDING` status row into `orderStatusHistory` for each order.
9. Remove only the successfully ordered cart lines, then commit.
10. Return the already-created order IDs and batch reference. Repeated calls with the same idempotency key return the same result.

This conditional update is preferable to a read-before-write availability decision. It is atomic at the database level and makes concurrent checkout outcomes deterministic: one buyer gets the final available unit; the other receives a clean “stock no longer available” response.

## 4. Recommended Order State Machine

Keep the current order-status vocabulary, but formalize permitted transitions and actor ownership. Every permitted transition must be performed by a backend procedure and must append `orderStatusHistory` in the same transaction.

| From | To | Authorized actor | Inventory action | Notes |
| --- | --- | --- | --- | --- |
| `PENDING` | `CONFIRMED` | Store owner | Keep reservation active | Seller accepts the campus-pickup request. |
| `PENDING` | `CANCELLED` | Buyer, store owner, or administrator | Release reservation | Buyer cancellation allowed before confirmation. |
| `PENDING` | `CANCELLED` | System expiry job | Release reservation | Expire unconfirmed orders after the configured hold window. |
| `CONFIRMED` | `PROCESSING` | Store owner | Keep reservation active | Seller prepares the item. |
| `PROCESSING` | `READY_FOR_PICKUP` | Store owner | Keep reservation active | Buyer receives pickup instruction. |
| `READY_FOR_PICKUP` | `COMPLETED` | Store owner or administrator | Commit reservation | Decrease `quantity`, decrease `reservedQuantity`, mark reservation `COMMITTED`; record cash-on-pickup collection. |
| `CONFIRMED`, `PROCESSING`, `READY_FOR_PICKUP` | `CANCELLED` | Store owner or administrator; buyer only by policy | Release reservation | Decrease `reservedQuantity`, mark reservation `RELEASED`. |
| Any non-terminal allowed state | `DISPUTED` | Buyer or administrator | Keep reservation until adjudication | Prevent automatic release while a dispute is open. |
| `DISPUTED` | `COMPLETED` or `CANCELLED` | Administrator | Commit or release based on outcome | Must require a resolution note and audit entry. |

### Reservation timing

For cash-on-pickup, use a short but realistic initial reservation expiry, for example **two hours while awaiting seller confirmation**. Once a seller confirms, set a pickup deadline appropriate to the marketplace’s campus policy, such as 48 hours. The policy must be explicit in the order and shown to both parties.

The reservation-expiry worker must run transactionally. It should find `ACTIVE` reservations past `expiresAt`, transition eligible orders to `CANCELLED`, lower `reservedQuantity`, mark reservation rows `EXPIRED`, append status history, and create notifications. Do not run this as an ad-hoc client action. Implement it as a scheduled server task using the project’s supported periodic-job mechanism.

## 5. Server Procedure Design

The following procedures should be created or expanded. Every procedure must assert actor ownership at the server layer.

| Procedure | Who may call it | Required checks |
| --- | --- | --- |
| `checkout.place` | Buyer | Idempotency key, active cart ownership, listing/store status, conditional inventory reservation, transactional batch/order creation. |
| `orders.myOrders` | Buyer | `orders.buyerUserId === ctx.user.id`; pagination and seller-order grouping. |
| `orders.detail` | Buyer, owned seller, admin | Buyer ownership or store ownership or administrator role. |
| `seller.orders` | Verified seller | Only orders where `stores.ownerUserId === ctx.user.id`. |
| `seller.transitionOrder` | Verified seller | Store ownership, allowed transition map, reservation state, atomic status history write. |
| `buyer.cancelOrder` | Buyer | Buyer ownership and only allowed pre-confirmation states. |
| `admin.transitionOrder` | Admin/Super Admin | Mandatory reason, audit log, dispute-resolution policy. |
| `system.expireReservations` | Scheduled server job | Expired active reservations only; idempotent batched processing. |

Use a central `assertOrderTransition(currentStatus, requestedStatus, actor)` helper. Do not allow individual route components to decide which changes are valid. The helper should make illegal transitions impossible to execute, including through direct API calls.

## 6. Notifications and User Interface

Order management must be an end-to-end workflow rather than hidden server state.

| User | Required interface |
| --- | --- |
| Buyer | Orders list, order detail, current status timeline, seller/store context, pickup instruction, cancellation when permitted, dispute entry, and receipt/reference number. |
| Seller | Seller order queue grouped by urgency, order detail, confirmation/processing/ready controls, stock-aware fulfilment controls, cancellation reason field, and pickup code or handover confirmation. |
| Administrator | Cross-marketplace order search, status filter, forced transition with reason, dispute queue, stock reservation diagnostics, and audit history. |

Create in-app notifications for order creation, seller confirmation, ready-for-pickup, cancellation, expiration, dispute opening, and resolution. Send transactional email only when the delivery provider is fully verified and the event preference is enabled. Notifications should never be the sole source of truth; every message should link to the current order detail page.

## 7. Migration Sequence

1. Add `orderBatches`, `inventoryReservations`, `orders.orderBatchId`, and `orders.reservationExpiresAt` through a non-destructive Drizzle migration.
2. Backfill existing orders conservatively: existing completed orders have no active reservation; existing pending orders should be reviewed before an automatic reservation is created.
3. Change checkout to use idempotency and conditional inventory reservation.
4. Add status-history writes and transition helper before exposing seller controls.
5. Add buyer/seller/admin order screens and notification events.
6. Enable expiry processing only after reservation records and status transitions have been tested.
7. Remove the old direct `quantity = quantity - cartQuantity` checkout behavior after the new release path is live.

## 8. Mandatory Test Plan

| Test | Expected result |
| --- | --- |
| Two buyers buy the final unit concurrently | Exactly one checkout succeeds; the other fails cleanly; quantity/reserved quantities remain valid. |
| Network retry with same idempotency key | Returns the same batch/orders; creates no duplicate order or reservation. |
| Checkout fails halfway through | Transaction rollback leaves no order, item, reservation, or partial stock change. |
| Seller tries to update another seller’s order | Server returns `FORBIDDEN`. |
| Buyer cancels a pending order | Reservation releases once; history and notification are created. |
| Seller confirms then marks ready | Only permitted status history rows exist; reservation remains held. |
| Completed pickup | Physical quantity decreases once; reservation is committed once; payment is recorded consistently. |
| Expired pending order | Reservation releases once even if the expiry job runs twice. |
| Disputed order | Automatic expiry does not release a reservation that requires administrator resolution. |

Use a real disposable test database for these tests. At least one test must submit concurrent checkout requests through actual tRPC procedures rather than unit-testing only helper functions.

## 9. Rollout Recommendation

Ship this in three controlled increments:

1. **Safety increment:** schema, reservation transaction, idempotency, and concurrent checkout tests. Keep existing seller controls disabled.
2. **Operational increment:** buyer order history, seller queue, approved transition controls, status history, and release/commit paths.
3. **Automation increment:** expiry job, notifications, disputes, administrator order oversight, metrics, and alerting.

Do not enable public selling at scale until the safety increment and its concurrent-checkout tests are complete.

## 10. Decision Required Before Implementation

Before code work begins, confirm the campus-pickup reservation policy:

| Policy question | Recommended default |
| --- | --- |
| How long can an unconfirmed order hold stock? | 2 hours. |
| How long can a confirmed order wait for pickup? | 48 hours. |
| Can a buyer cancel after seller confirmation? | Yes, only until `READY_FOR_PICKUP`, with seller/admin visibility. |
| When is cash marked collected? | On seller pickup completion; allow administrator correction with audit reason. |
| What happens to disputed stock? | Keep reserved until the administrator resolves the order. |

These are business-policy decisions; the system should enforce the final approved policy consistently.
