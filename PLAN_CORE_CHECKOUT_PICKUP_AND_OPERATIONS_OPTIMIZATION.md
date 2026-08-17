# ESUT Marketplace — Core Checkout/Pickup Implementation Plan and Operations Optimization

**Status:** Planning only; no application code changed  
**Prepared by:** Manus AI  
**Basis:** Current-state audit, existing schema/router contracts, live role walkthroughs, and the green validation baseline

## Executive decision

The highest-priority missing feature is not QR pickup, escrow, online settlement, or an administrator force-completion override. The highest-priority gap is a **complete, observable, policy-driven pickup coordination and exception flow around the existing checkout, ready-for-pickup, buyer notification, seller handoff, and two-party pickup-code completion system**.

The existing system already provides the critical security primitive: the buyer sees an encrypted-code-backed six-digit pickup code, and the verified seller must submit that code to complete the order. The missing layer is the operational context around that primitive. Buyers and sellers need a structured way to agree on pickup instructions, see pickup readiness and aging, record supported exceptions such as a no-show or code lockout, and give administrators enough evidence to resolve an issue without bypassing the handoff control casually.

This plan therefore keeps cash on pickup and campus pickup as the only current payment and fulfillment methods. It does not introduce QR codes, online payments, escrow, automated settlement, GPS tracking, or unrestricted administrator completion.

> **Design principle:** Add operational clarity around the secure handoff that already exists; do not weaken or replace the two-party confirmation control.

## 1. Target outcome

A buyer should be able to place a multi-seller order, see each store-specific order and its status, receive a clear ready-for-pickup instruction, communicate a pickup window or location through a structured participant-only channel, show the six-digit code at handoff, and understand what to do if the seller is unavailable or the code cannot be used.

A seller should be able to see orders that require action, publish or confirm pickup instructions, see how long an order has been ready, request the buyer through the existing participant channel, enter the buyer’s code, and open a supported exception case without manually changing the order to completed.

An administrator should be able to see pickup aging and exception workload, inspect order history, audit the buyer/seller communications and exception evidence that the policy permits, and resolve a case using a documented decision. The administrator should not receive the buyer’s plaintext pickup code or gain a silent bypass path.

| Outcome | Current support | Planned completion |
| --- | --- | --- |
| Order creation and inventory reservation | Implemented | Preserve and instrument |
| Seller processing and ready state | Implemented | Add pickup context and aging visibility |
| Buyer ready notification | Implemented in-app notification foundation | Add structured instructions and delivery status |
| Buyer/seller pickup coordination | Participant messaging exists | Add order-scoped coordination state |
| Two-party handoff verification | Implemented with encrypted six-digit code | Preserve, add exception handling around it |
| No-show or code lockout handling | Partial/manual | Add explicit case states and policy-driven actions |
| Admin visibility | Analytics, orders, disputes, audit log exist | Add pickup queue and source-linked exception drill-down |

## 2. Proposed domain model

The smallest safe model is a new `pickupCoordination` table linked one-to-one with an order. It should contain operational context, not sensitive plaintext secrets. The existing encrypted pickup code remains on the order, and the buyer-facing code remains available only through the buyer-owned order-detail projection.

### Suggested schema addition

```ts
// drizzle/schema.ts — illustrative only; do not paste without migration review
export const pickupCoordinationStatuses = [
  "NOT_STARTED",
  "SELLER_INSTRUCTIONS_SET",
  "BUYER_ACKNOWLEDGED",
  "MEETING_AGREED",
  "BUYER_NO_SHOW",
  "SELLER_NO_SHOW",
  "CODE_LOCKED",
  "ESCALATED",
  "CLOSED",
] as const;

export const pickupCoordinations = mysqlTable("pickupCoordinations", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull().unique(),
  status: mysqlEnum("status", pickupCoordinationStatuses)
    .default("NOT_STARTED")
    .notNull(),
  pickupLocation: varchar("pickupLocation", { length: 240 }),
  pickupInstructions: text("pickupInstructions"),
  proposedWindowStart: timestamp("proposedWindowStart"),
  proposedWindowEnd: timestamp("proposedWindowEnd"),
  buyerAcknowledgedAt: timestamp("buyerAcknowledgedAt"),
  sellerInstructionsUpdatedAt: timestamp("sellerInstructionsUpdatedAt"),
  lastContactAt: timestamp("lastContactAt"),
  exceptionReason: varchar("exceptionReason", { length: 80 }),
  closedAt: timestamp("closedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("pickup_coordination_status_idx").on(table.status, table.updatedAt),
]);
```

A separate `pickupCoordinationEvents` table is recommended if the team wants a complete append-only timeline rather than relying only on `orderStatusHistory` and `auditLogs`. It should store event type, actor, safe metadata, and timestamp. It must never store the plaintext pickup code.

```ts
export const pickupCoordinationEvents = mysqlTable("pickupCoordinationEvents", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  coordinationId: int("coordinationId").notNull(),
  actorUserId: int("actorUserId").notNull(),
  eventType: mysqlEnum("eventType", [
    "INSTRUCTIONS_SET",
    "WINDOW_PROPOSED",
    "BUYER_ACKNOWLEDGED",
    "CONTACTED",
    "NO_SHOW_REPORTED",
    "CODE_LOCKED",
    "ESCALATED",
    "CLOSED",
  ]).notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
```

### State rules

The coordination state must not become a second uncontrolled order lifecycle. `orders.status` remains authoritative for commercial state. The coordination record describes pickup operations only.

| Coordination state | Allowed meaning | Who may create/update |
| --- | --- | --- |
| `NOT_STARTED` | Order is not yet ready or no pickup instructions exist | System creates when order becomes eligible |
| `SELLER_INSTRUCTIONS_SET` | Seller has provided a campus location and instructions | Verified seller, scoped to own order |
| `BUYER_ACKNOWLEDGED` | Buyer has seen and acknowledged the instructions | Buyer, scoped to own order |
| `MEETING_AGREED` | Both participants have a recorded pickup window | Buyer or seller, with the other party’s acknowledgement policy |
| `BUYER_NO_SHOW` / `SELLER_NO_SHOW` | A participant reports a failed meeting | Reporting participant; case becomes visible to admin |
| `CODE_LOCKED` | Five invalid code attempts have been reached | System; seller cannot clear it directly |
| `ESCALATED` | Admin review is required | System or administrator |
| `CLOSED` | Exception has been resolved or withdrawn under policy | Administrator or system policy |

## 3. Server contracts and authorization

The implementation should add small, explicit procedures rather than expanding the existing generic transition mutation with loosely typed fields.

### Buyer projection

The existing `orders.detail` response can add a safe `pickupCoordination` projection. It must be selected only after confirming `orders.buyerUserId = ctx.user.id`.

```ts
const buyerOrder = await tx.query.orders.findFirst({
  where: and(
    eq(orders.publicId, input.publicId),
    eq(orders.buyerUserId, ctx.user.id),
  ),
});

if (!buyerOrder) {
  throw new TRPCError({ code: "NOT_FOUND", message: "Order not found." });
}

const coordination = await tx.query.pickupCoordinations.findFirst({
  where: eq(pickupCoordinations.orderId, buyerOrder.id),
});

return {
  order: redactPickupCode(buyerOrder),
  pickupCode: buyerPickupCode(buyerOrder),
  pickupCoordination: coordination
    ? {
        status: coordination.status,
        pickupLocation: coordination.pickupLocation,
        pickupInstructions: coordination.pickupInstructions,
        proposedWindowStart: coordination.proposedWindowStart,
        proposedWindowEnd: coordination.proposedWindowEnd,
        buyerAcknowledgedAt: coordination.buyerAcknowledgedAt,
        updatedAt: coordination.updatedAt,
      }
    : null,
};
```

The projection must not return `pickupCodeCiphertext`, failed-attempt counts, internal exception notes, or administrator-only evidence.

### Seller instruction mutation

Seller instructions must be available only for a seller-owned order and only when the order is `READY_FOR_PICKUP`. The mutation should validate location length, instruction length, and a reasonable time window.

```ts
const setPickupInstructions = verifiedSellerProcedure
  .input(z.object({
    publicId: z.string().min(8).max(40),
    pickupLocation: z.string().trim().min(3).max(240),
    pickupInstructions: z.string().trim().min(10).max(2_000),
    proposedWindowStart: z.coerce.date(),
    proposedWindowEnd: z.coerce.date(),
  }).superRefine((value, ctx) => {
    if (value.proposedWindowEnd <= value.proposedWindowStart) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["proposedWindowEnd"],
        message: "Pickup window must end after it starts.",
      });
    }
  }))
  .mutation(async ({ ctx, input }) => {
    const db = await ensureDb();

    return db.transaction(async (tx) => {
      const row = (await tx.select({ order: orders, store: stores })
        .from(orders)
        .innerJoin(stores, eq(orders.storeId, stores.id))
        .where(and(
          eq(orders.publicId, input.publicId),
          eq(stores.ownerUserId, ctx.user.id),
        ))
        .limit(1))[0];

      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found." });
      if (row.order.status !== "READY_FOR_PICKUP") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Pickup instructions are available only for ready orders.",
        });
      }

      const existing = (await tx.select().from(pickupCoordinations)
        .where(eq(pickupCoordinations.orderId, row.order.id)).limit(1))[0];

      const values = {
        orderId: row.order.id,
        status: "SELLER_INSTRUCTIONS_SET" as const,
        pickupLocation: input.pickupLocation,
        pickupInstructions: input.pickupInstructions,
        proposedWindowStart: input.proposedWindowStart,
        proposedWindowEnd: input.proposedWindowEnd,
        sellerInstructionsUpdatedAt: new Date(),
        lastContactAt: new Date(),
      };

      if (existing) {
        await tx.update(pickupCoordinations)
          .set(values)
          .where(eq(pickupCoordinations.id, existing.id));
      } else {
        await tx.insert(pickupCoordinations).values(values);
      }

      await tx.insert(notifications).values({
        userId: row.order.buyerUserId,
        type: "ORDER_STATUS",
        title: "Pickup instructions updated",
        message: `Your seller added pickup instructions for order ${row.order.publicId}.`,
        targetRoute: `/account/orders/${row.order.publicId}`,
      });

      await tx.insert(auditLogs).values({
        actorUserId: ctx.user.id,
        action: "PICKUP_INSTRUCTIONS_UPDATED",
        targetType: "ORDER",
        targetId: String(row.order.id),
        metadata: { publicId: row.order.publicId },
      });

      return { success: true };
    });
  });
```

### Buyer acknowledgement mutation

The buyer should explicitly acknowledge that they have seen the location and instructions. This is not payment confirmation and must not complete the order.

```ts
const acknowledgePickup = protectedProcedure
  .input(z.object({ publicId: z.string().min(8).max(40) }))
  .mutation(async ({ ctx, input }) => {
    const db = await ensureDb();

    return db.transaction(async (tx) => {
      const order = (await tx.select().from(orders).where(and(
        eq(orders.publicId, input.publicId),
        eq(orders.buyerUserId, ctx.user.id),
        eq(orders.status, "READY_FOR_PICKUP"),
      )).limit(1))[0];

      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Ready order not found." });

      const coordination = (await tx.select().from(pickupCoordinations)
        .where(eq(pickupCoordinations.orderId, order.id)).limit(1))[0];

      if (!coordination?.pickupLocation || !coordination.pickupInstructions) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "The seller has not published pickup instructions yet." });
      }

      await tx.update(pickupCoordinations).set({
        status: "BUYER_ACKNOWLEDGED",
        buyerAcknowledgedAt: new Date(),
        lastContactAt: new Date(),
      }).where(eq(pickupCoordinations.id, coordination.id));

      await tx.insert(auditLogs).values({
        actorUserId: ctx.user.id,
        action: "PICKUP_INSTRUCTIONS_ACKNOWLEDGED",
        targetType: "ORDER",
        targetId: String(order.id),
        metadata: { publicId: order.publicId },
      });

      return { success: true };
    });
  });
```

### Supported exception mutation

A participant should be able to report a no-show or code lockout, but the mutation must create an exception record or move coordination to `ESCALATED`; it must never directly mark an order `COMPLETED` or silently clear the code failure counter.

```ts
const reportPickupException = protectedProcedure
  .input(z.object({
    publicId: z.string().min(8).max(40),
    reason: z.enum(["BUYER_NO_SHOW", "SELLER_NO_SHOW", "CODE_LOCKED", "OTHER"]),
    details: z.string().trim().min(10).max(2_000),
  }))
  .mutation(async ({ ctx, input }) => {
    const db = await ensureDb();

    return db.transaction(async (tx) => {
      const order = (await tx.select().from(orders)
        .where(eq(orders.publicId, input.publicId)).limit(1))[0];
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found." });

      const isBuyer = order.buyerUserId === ctx.user.id;
      const seller = (await tx.select().from(stores)
        .where(and(eq(stores.id, order.storeId), eq(stores.ownerUserId, ctx.user.id))).limit(1))[0];
      const isSeller = Boolean(seller);
      if (!isBuyer && !isSeller) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You cannot report an exception for this order." });
      }

      const coordination = (await tx.select().from(pickupCoordinations)
        .where(eq(pickupCoordinations.orderId, order.id)).limit(1))[0];
      if (!coordination) throw new TRPCError({ code: "BAD_REQUEST", message: "Pickup coordination has not started." });

      await tx.update(pickupCoordinations).set({
        status: "ESCALATED",
        exceptionReason: input.reason,
        lastContactAt: new Date(),
      }).where(eq(pickupCoordinations.id, coordination.id));

      await tx.insert(notifications).values({
        userId: isBuyer ? seller!.ownerUserId : order.buyerUserId,
        type: "DISPUTE_UPDATE",
        title: "Pickup exception reported",
        message: `Pickup support is reviewing order ${order.publicId}.`,
        targetRoute: "/account/support",
      });

      await tx.insert(auditLogs).values({
        actorUserId: ctx.user.id,
        action: "PICKUP_EXCEPTION_REPORTED",
        targetType: "ORDER",
        targetId: String(order.id),
        metadata: { reason: input.reason, details: input.details },
      });

      return { success: true };
    });
  });
```

In production code, the details should be stored in a dedicated support/dispute record rather than only in audit metadata. The example illustrates the authorization and lifecycle boundary, not the final data model.

## 4. Checkout and notification improvements

At checkout, create the coordination row when each store-specific order is created, but leave it in `NOT_STARTED`. When the seller transitions an order to `READY_FOR_PICKUP`, update or create the row and send a notification containing an instruction to open the order detail. Do not include the six-digit code in email or broad notifications; the code should remain in the authenticated buyer order detail.

```ts
// Inside the same checkout/order transaction
await tx.insert(pickupCoordinations).values({
  orderId: createdOrderId,
  status: "NOT_STARTED",
});

// Inside the READY_FOR_PICKUP lifecycle transition
await tx.insert(pickupCoordinations).values({
  orderId: order.id,
  status: "NOT_STARTED",
}).onDuplicateKeyUpdate({
  set: { updatedAt: new Date() },
});

await tx.insert(notifications).values({
  userId: order.buyerUserId,
  type: "ORDER_STATUS",
  title: "Your order is ready for campus pickup",
  message: `Open order ${order.publicId} to view the secure pickup code and seller instructions.`,
  targetRoute: `/account/orders/${order.publicId}`,
});
```

The notification worker or email adapter should expose delivery state and failure reason to administrators. Since the current sender configuration has normal-recipient limitations, the UI must continue to identify in-app notifications as the reliable path until authorized email delivery is confirmed.

## 5. Frontend implementation plan

### Buyer order detail

Add a `Pickup coordination` panel only for `READY_FOR_PICKUP` orders. It should show the seller’s location and instructions, the proposed pickup window, whether the buyer has acknowledged the instructions, the secure code display, and actions to acknowledge or report a supported exception. The code should have a copy button with an accessible label but no automatic clipboard assumption. Use a clear warning that the buyer should share the code only at the physical handoff.

```tsx
{order.status === "READY_FOR_PICKUP" ? (
  <section aria-labelledby="pickup-coordination-heading" className="rounded-2xl bg-emerald-50 p-5 ring-1 ring-emerald-200">
    <h2 id="pickup-coordination-heading" className="font-extrabold">Campus pickup</h2>
    <p className="mt-2 text-sm text-slate-700">
      Meet the seller at the confirmed location. Show the secure code only when you receive the order.
    </p>
    {data.pickupCoordination?.pickupLocation ? (
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <div><dt className="text-xs font-bold uppercase text-slate-500">Location</dt><dd>{data.pickupCoordination.pickupLocation}</dd></div>
        <div><dt className="text-xs font-bold uppercase text-slate-500">Status</dt><dd>{readable(data.pickupCoordination.status)}</dd></div>
      </dl>
    ) : <p className="mt-4 text-sm text-slate-600">The seller has not added pickup instructions yet.</p>}
    {data.pickupCode ? <p className="mt-5 text-3xl font-black tracking-[0.35em] text-[#08243b]">{data.pickupCode}</p> : null}
    <div className="mt-5 flex flex-wrap gap-3">
      {!data.pickupCoordination?.buyerAcknowledgedAt && data.pickupCoordination?.pickupLocation ? (
        <Button onClick={() => acknowledgePickup.mutate({ publicId: data.order.publicId })} disabled={acknowledgePickup.isPending}>
          Acknowledge instructions
        </Button>
      ) : null}
      <Button variant="outline" onClick={() => setExceptionOpen(true)}>Report a pickup problem</Button>
    </div>
  </section>
) : null}
```

### Seller order detail

Replace any generic “complete” affordance for ready orders with the existing pickup-code verification form plus a coordination panel. Add instructions editing, pickup-window selection, buyer-acknowledgement state, readiness age, and a report-exception action. Keep completion impossible without the code.

### Buyer dashboard

Add a ready-order count, oldest-ready age, and a compact “pickup needs attention” card. These values must be projections from real orders and coordination rows. Never use a fixed reminder count.

## 6. Test and rollout plan for the buyer flow

The implementation should be delivered in the following sequence.

| Stage | Work | Required verification |
| --- | --- | --- |
| 1 | Confirm schema and policy wording | Review migration, retention, allowed exception reasons, and privacy boundaries |
| 2 | Add coordination tables and migration | Apply additive migration through the schema-first workflow and verify indexes |
| 3 | Add server procedures | Unit-test buyer ownership, seller ownership, ready-state gating, and no direct completion |
| 4 | Integrate lifecycle side effects | Test creation at checkout, initialization at ready state, notifications, audit entries, and rollback behavior |
| 5 | Add buyer and seller UI | Test loading, empty, error, retry, acknowledgement, lockout, exception, and mobile states |
| 6 | Add admin pickup queue | Test admin-only access, source links, safe metadata, and no plaintext code exposure |
| 7 | Run a controlled staging rehearsal | Complete buyer checkout, seller processing, ready notification, coordination, code handoff, completion, and exception paths |
| 8 | Release behind a feature flag if needed | Compare error rates, stale-ready aging, notification failures, and support cases before broad rollout |

### Required regression cases

The minimum unit and integration coverage should include the following cases:

```ts
it("does not expose pickup coordination to another buyer", async () => {
  await expect(callAsBuyer(otherBuyer).orders.detail({ publicId }))
    .rejects.toMatchObject({ code: "NOT_FOUND" });
});

it("allows only the owning verified seller to set instructions", async () => {
  await expect(callAsSeller(otherSeller).seller.setPickupInstructions(input))
    .rejects.toMatchObject({ code: "NOT_FOUND" });
});

it("does not allow acknowledgement before seller instructions exist", async () => {
  await expect(callAsBuyer(buyer).orders.acknowledgePickup({ publicId }))
    .rejects.toMatchObject({ code: "BAD_REQUEST" });
});

it("does not let a pickup exception complete an order", async () => {
  await callAsBuyer(buyer).orders.reportPickupException(input);
  const order = await readOrder(publicId);
  expect(order.status).toBe("READY_FOR_PICKUP");
});

it("keeps completion atomic when two pickup confirmations race", async () => {
  const results = await Promise.allSettled([
    confirmAsSeller(firstSeller, publicId, code),
    confirmAsSeller(firstSeller, publicId, code),
  ]);
  expect(results.filter(result => result.status === "fulfilled")).toHaveLength(1);
  expect(await readOrder(publicId)).toMatchObject({ status: "COMPLETED" });
});
```

The existing pickup-code tests, seller order procedure tests, lifecycle tests, ownership tests, and Chromium route safety tests should be extended rather than replaced.

## 7. Administrator analytics optimization roadmap

The administrator analytics already provide live lifecycle, pickup, seller, listing, and trust/safety projections. The next optimization is to make those metrics operationally comparable, actionable, and source-linked.

### Metric contract and historical meaning

Create a documented metric dictionary for each card and drill-down. It should define numerator, denominator, time zone, order statuses included, treatment of cancelled/disputed orders, and whether a date filter applies to `createdAt`, `updatedAt`, or the transition event timestamp. This prevents two admin views from reporting different meanings for “completed sales” or “pickup rate.”

| Metric family | Add or clarify |
| --- | --- |
| Lifecycle | Orders created, confirmed, processing, ready, completed, cancelled, disputed; counts and rates |
| Pickup | Ready count, median ready age, oldest ready order, completion after ready, no-show/exception rate |
| Sellers | Active verified sellers, pending verification age, seller activation funnel, fulfillment aging, listing quality failures |
| Buyers | New members, repeat buyers, active buyers, checkout attempts, cancelled orders, support cases |
| Trust/safety | Reports by reason, time to investigation, time to resolution, disputed handoff rate, review removals |
| Notifications | In-app unread backlog, email attempted/succeeded/failed, critical-event delivery failures |

### Drill-down design

Each summary card should link to a filtered source view. For example, clicking “oldest ready order” should open `/admin/orders?status=READY_FOR_PICKUP&sort=oldest`, while clicking “pending verifications” should open `/admin/verifications?status=PENDING`. This converts analytics from passive reporting into an operations queue.

```ts
const adminAnalyticsInput = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  sellerId: z.number().int().positive().optional(),
  status: z.enum(orderStatuses).optional(),
});

const adminAnalytics = adminProcedure
  .input(adminAnalyticsInput)
  .query(async ({ input }) => {
    const period = buildUtcPeriod(input.from, input.to);
    const lifecycle = await getLifecycleMetrics(period, input.sellerId);
    const pickup = await getPickupAgingMetrics(period, input.sellerId);
    const trust = await getTrustSafetyMetrics(period);

    return {
      period,
      definitionsVersion: "2026-08-17",
      lifecycle,
      pickup,
      trust,
      links: {
        readyOrders: `/admin/orders?status=READY_FOR_PICKUP`,
        disputes: `/admin/disputes?status=OPEN`,
        verifications: `/admin/verifications?status=PENDING`,
      },
    };
  });
```

Historical comparison can begin without a full scheduled snapshot system by comparing two equal live periods. A durable snapshot table should be introduced only when the product has approved the metric definitions and the periodic-update policy. The analytics UI should show “current period vs previous period” with absolute counts and percentage change, while avoiding misleading percentages when the prior period is zero.

### Analytics performance and data safety

Use grouped aggregate queries rather than fetching all orders into application memory. Add composite indexes for common admin filters such as order status plus creation/update time, pickup coordination status plus update time, notification event type plus creation time, and report status plus creation time. Paginate drill-down rows. Never include pickup-code ciphertext or sensitive identity evidence in analytics responses. Keep source links permission-aware.

### Admin alerting

Add threshold indicators only after definitions are stable. Good first thresholds are oldest ready order age, pending verification age, unresolved report age, notification failure count, and repeated pickup-code lockouts. An alert should link to a queue and state the underlying count, threshold, time period, and last refresh time.

## 8. Seller cockpit optimization roadmap

The seller cockpit currently answers “how is my store doing?” The next version should answer “what should I do next, and which order or listing needs attention?”

### Priority seller panels

| Panel | Data source | Action link |
| --- | --- | --- |
| Orders requiring action | Seller-owned orders in pending, confirmed, processing, or ready states | Open filtered seller orders |
| Pickup aging | Seller-owned ready orders, coordination status, ready transition time | Open oldest ready order |
| Inventory reconciliation | Available, reserved, expired reservations, low-stock threshold | Open inventory and reservation review |
| Listing quality | Active listings missing image, location, fulfillment details, or adequate description | Open listing edit |
| Buyer response | Unanswered offers and messages by age | Open offers/messages |
| Notification health | Seller order events not successfully delivered in-app/email | Open notification detail |
| Store trust | Verification state, review reports, unresolved complaints | Open reviews and support |

### Seller analytics contract

Seller analytics should use the same metric dictionary as administrator analytics, scoped by `stores.ownerUserId = ctx.user.id`. Add order aging buckets, ready-for-pickup aging, completion after ready, cancellation rate, listing stockout rate, and response backlog. Avoid presenting raw buyer names or unrelated stores.

```ts
const sellerActionQueue = verifiedSellerProcedure.query(async ({ ctx }) => {
  const db = await ensureDb();
  const store = await getOwnedStore(db, ctx.user.id);
  if (!store) throw new TRPCError({ code: "NOT_FOUND", message: "Store not found." });

  const [ordersToAction, readyAging, lowStock, unansweredOffers] = await Promise.all([
    getSellerOrdersToAction(db, store.id),
    getSellerReadyAging(db, store.id),
    getSellerLowStock(db, store.id),
    getSellerUnansweredOffers(db, store.id),
  ]);

  return {
    ordersToAction,
    readyAging,
    lowStock,
    unansweredOffers,
    links: {
      orders: "/seller/orders?attention=action",
      inventory: "/seller/inventory?attention=low-stock",
      offers: "/seller/offers?attention=unanswered",
    },
  };
});
```

### Seller interaction improvements

Add filter persistence in the URL so a seller can refresh or share a safe workspace view. Add a visible “why this needs attention” label for each row. Preserve bulk updates only for transitions that are valid for every selected row; do not bulk-complete orders, because completion requires the buyer’s unique code. Add confirmation dialogs with readable lifecycle labels and a clear result summary after a batch update.

## 9. Implementation order for analytics and seller cockpit

1. **Freeze metric definitions.** Agree on UTC period semantics, lifecycle inclusion, pickup aging calculation, dispute treatment, and notification success terminology.
2. **Add shared query helpers.** Centralize admin and seller aggregates so the two workspaces cannot drift into different calculations.
3. **Add indexes and pagination.** Verify query plans against production-shaped data before adding more visual panels.
4. **Add source-linked drill-down routes.** Every card should lead to an actionable filtered list.
5. **Add pickup and exception queues.** Prioritize oldest ready orders, lockouts, no-shows, and unresolved support cases.
6. **Add seller action queue.** Replace passive KPI-only emphasis with prioritized next steps.
7. **Add tests.** Cover administrator-only access, seller ownership, date boundaries, zero-period comparisons, duplicate rows, and sensitive-field redaction.
8. **Perform responsive and accessibility review.** Test keyboard access, focus return from dialogs, long tables, mobile filters, loading/error states, and screen-reader labels.
9. **Run a staging rehearsal.** Validate that each metric links to the expected source records and that a real order lifecycle updates every relevant dashboard.

## 10. Release gates

The buyer checkout/pickup improvement should not be released until the following conditions are met:

| Gate | Acceptance criterion |
| --- | --- |
| Authorization | A buyer cannot read or mutate another buyer’s coordination record; a seller cannot access another store’s order; admin access remains protected |
| Lifecycle | Coordination never changes commercial order status except through the existing guarded lifecycle helper |
| Handoff | Seller completion still requires the buyer code; no exception mutation bypasses it |
| Privacy | Code plaintext, code ciphertext, identity evidence, and private notes are absent from unauthorized responses and analytics |
| Reliability | Checkout, ready transition, instruction update, acknowledgement, exception report, and code completion are transaction-safe or idempotent where appropriate |
| Notifications | Ready/instruction/exception events create in-app notification records with target routes and observable failure states |
| Operations | Admin has a source-linked queue for stale ready orders and escalated pickup exceptions |
| Testing | TypeScript, all Vitest tests, focused concurrency/ownership tests, and Chromium scenarios pass |
| Documentation | Buyer, seller, and admin policies explain pickup, code use, no-shows, lockouts, and dispute escalation |

## Final recommendation

Approve the buyer pickup coordination and exception layer as the next core implementation, but keep this document as the design contract until the marketplace policies, schema migration, and evidence-retention rules are reviewed. In parallel, refactor administrator and seller analytics around shared metric contracts and action queues. Do not spend the next implementation cycle on QR convenience, online settlement, or force-completion overrides until the current campus-pickup operation can be rehearsed, supported, measured, and audited end to end.

## References

[1]: `/home/ubuntu/esut-marketplace/ESUT_MARKETPLACE_FULL_CURRENT_STATE_AUDIT.md` — Current-state audit and core-purpose gap report.

[2]: `/home/ubuntu/esut-marketplace/drizzle/schema.ts` — Current database schema.

[3]: `/home/ubuntu/esut-marketplace/server/routers.ts` — Current tRPC procedures and ownership boundaries.

[4]: `/home/ubuntu/esut-marketplace/server/orderLifecycle.ts` — Shared order transition policy.

[5]: `/home/ubuntu/esut-marketplace/server/pickupCode.ts` — Existing encrypted pickup-code implementation.

[6]: `/home/ubuntu/esut-marketplace/client/src/pages/OrderPages.tsx` — Current buyer and seller order-detail surfaces.

[7]: `/home/ubuntu/esut-marketplace/client/src/pages/AdminSuitePages.tsx` — Current administrator suite and drill-down views.
