# ESUT Marketplace — Notification Filtering and Seller Progress Plan

**Status:** Planning only; no application code should change until approval.

## Objective

Add two focused usability improvements without weakening the current one-account dual-role model or introducing duplicate data systems. First, buyers, sellers, and administrators should be able to filter their own dashboard notifications by all, unread, and read states and mark notifications read in a controlled way. Second, new vendors should see a visual, accessible progress indicator on the dedicated seller onboarding checklist so they understand how much of the real setup work is complete.

## Current architectural assumptions

The implementation must reuse the existing `notifications` table, existing protected notification procedures, the existing dashboard notification projection, and the seller checklist already backed by store and product records. The server must remain authoritative for notification ownership, read state, and progress inputs. No notification content, counts, seller progress, or completion state may be fabricated.

Before coding, inspect the exact notification schema fields and existing procedures. If a durable read field already exists, use it. If the schema only has a boolean read flag, preserve that convention. Only if neither exists should an additive migration introduce a nullable `readAt` timestamp or equivalent; this must be reviewed and applied through the schema-first migration process.

## Phase 1 — Audit the current contracts

Read `drizzle/schema.ts`, the notification procedures in `server/routers.ts`, the buyer account notification surface, seller and administrator dashboard notification surfaces, and the existing seller store-settings checklist. Confirm whether read state is represented by `isRead`, `readAt`, or another field; identify current unread counts; and map every dashboard that consumes notifications.

Define the state contract before implementation:

| Filter | Server meaning | Empty-state copy |
| --- | --- | --- |
| All | All notifications owned by the signed-in user | “No notifications yet.” |
| Unread | Owned notifications not marked read | “You’re all caught up.” |
| Read | Owned notifications already marked read | “No read notifications yet.” |

The dashboard must never treat opening a page as an implicit read action. Read state should change only through an explicit user action or a clearly documented notification interaction.

## Phase 2 — Add server-authoritative notification controls

Extend the existing protected notification list procedure with a validated filter input such as `ALL`, `UNREAD`, or `READ`, plus bounded pagination. The query must include `eq(notifications.userId, ctx.user.id)` before any filter is applied. Preserve newest-first ordering and return the current unread total from the same ownership-scoped query contract.

Add a protected `markRead` mutation accepting a positive notification identifier. It must update only a row whose `userId` matches `ctx.user.id`; a missing or foreign identifier should return a safe not-found or forbidden response without revealing whether another user’s notification exists. Make the operation idempotent.

Add a protected `markAllRead` mutation that updates only the current user’s unread rows. It should return the number of rows changed, remain safe when there are no unread rows, and never update administrator, seller, or buyer records belonging to another account.

If the existing product requires an audit entry for notification state changes, record a bounded event without storing notification message contents. Otherwise avoid creating noisy audit records for routine read actions. Add server tests for owner access, IDOR attempts, all/unread/read filter semantics, idempotent single-read behavior, and empty bulk-read behavior.

Illustrative tRPC shape:

```ts
const notificationFilter = z.enum(["ALL", "UNREAD", "READ"]);

notifications: protectedProcedure
  .input(z.object({ filter: notificationFilter.default("ALL"), page: z.number().int().min(1).default(1), limit: z.number().int().min(1).max(50).default(20) }))
  .query(async ({ ctx, input }) => {
    const ownership = eq(notifications.userId, ctx.user.id);
    const readCondition = input.filter === "UNREAD"
      ? eq(notifications.isRead, false)
      : input.filter === "READ"
        ? eq(notifications.isRead, true)
        : undefined;
    const where = readCondition ? and(ownership, readCondition) : ownership;
    const rows = await db.select().from(notifications)
      .where(where)
      .orderBy(desc(notifications.createdAt))
      .limit(input.limit)
      .offset((input.page - 1) * input.limit);
    const unread = await db.select({ id: notifications.id }).from(notifications)
      .where(and(ownership, eq(notifications.isRead, false)));
    return { rows, unreadCount: unread.length };
  });
```

The exact field names and Drizzle query syntax must follow the current schema; this snippet is illustrative and must not be pasted without review.

## Phase 3 — Build the dashboard filtering experience

Add a reusable notification control to the existing dashboard notification page or shared account notification panel. The control should provide three accessible tabs or segmented buttons: **All**, **Unread**, and **Read**. Each filter should show a server-derived count where available and should preserve the selected filter during pagination or navigation.

Each unread notification row should have an explicit **Mark as read** action. A global **Mark all as read** action should appear only when the server reports unread rows. On success, invalidate the current filtered list and unread-count queries. On failure, retain the row state and show a scoped retry message. Do not optimistically hide rows unless rollback is guaranteed.

Notification rows should continue to link to their existing target route. A user clicking the route should not automatically mark the notification read unless the product explicitly chooses that behavior later; the safer first release uses an explicit action. The UI must support keyboard navigation, visible focus, screen-reader labels, mobile wrapping, and clear read/unread contrast that does not depend on color alone.

The same reusable control should be available to buyer and seller dashboards where notifications are currently surfaced. Administrator notification management may retain its existing global administrative view, but any personal notification control must remain user-scoped.

## Phase 4 — Add the seller onboarding progress bar

Reuse the existing four real checklist inputs on the dedicated store settings page:

1. Store profile completeness.
2. At least one created product.
3. At least one product image.
4. At least one active listing with available stock.

Calculate progress as `completedSteps / totalSteps * 100`, with a total of four. The progress bar must be derived from the same `SellerSettingsChecklist` state and must not introduce a second progress calculation. If the store or products query is loading, show a neutral skeleton or “Loading setup progress…” state. If the query fails, show a recovery message rather than a fabricated percentage.

Use the existing progress UI component if available. The rendered bar must include `role="progressbar"`, `aria-valuemin="0"`, `aria-valuemax="100"`, and the exact numeric `aria-valuenow`. Display both the percentage and a textual statement such as “2 of 4 setup steps complete” so the status is understandable without color or visual inspection. Each incomplete checklist item remains a direct keyboard-accessible link to its implemented action.

Illustrative React shape:

```tsx
const total = steps.length;
const completed = steps.filter(step => step.done).length;
const percent = Math.round((completed / total) * 100);

<div>
  <div className="flex items-center justify-between">
    <p className="font-extrabold">Store launch progress</p>
    <span>{completed} of {total} complete ({percent}%)</span>
  </div>
  <div
    role="progressbar"
    aria-label="Seller onboarding progress"
    aria-valuemin={0}
    aria-valuemax={100}
    aria-valuenow={percent}
    className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200"
  >
    <div className="h-full rounded-full bg-[#00843d] transition-[width]" style={{ width: `${percent}%` }} />
  </div>
</div>
```

The snippet is illustrative. The production implementation should use the project’s existing UI primitives and motion/accessibility conventions.

## Phase 5 — Validation and rollout gates

Add Vitest coverage for notification filtering, explicit read mutations, mark-all idempotence, owner isolation, and progress calculations for every combination of the four checklist steps. Extend Chromium coverage for the public seller entry boundary and authenticated notification/store-settings states where the test harness supports a safe session; otherwise keep authenticated contract coverage at the procedure level and document the evidence boundary.

Run `pnpm check`, `pnpm test`, and `pnpm test:e2e`. Review desktop and 375px mobile screenshots of the buyer notification surface and seller store settings. Confirm there are no raw JSON parse errors, no fabricated unread counts, no cross-user notification access, no regressions to existing notification target links, and no layout overflow on small screens.

The implementation is ready to checkpoint only when every new checklist item is marked complete, the entire `todo.md` has been reviewed, and all three validation commands pass. The feature should remain separate from deferred QR pickup, settlement, escrow, and administrator override ideas.

## Acceptance criteria

| Area | Acceptance condition |
| --- | --- |
| Notification ownership | A user can read and filter only their own notifications. |
| Filtering | All, unread, and read produce server-backed results and honest empty states. |
| Read actions | Single and bulk read operations are explicit, idempotent, and safe against IDOR. |
| Counts | Unread totals come from the server and update after read actions. |
| Progress | The bar equals the four real seller checklist states and never uses fake progress. |
| Accessibility | Filters, actions, and progress expose useful names and values to keyboard and assistive-technology users. |
| Responsive behavior | Dashboard alerts and the settings checklist remain usable at desktop and 375px widths. |
| Regression safety | TypeScript, unit, and browser suites pass before checkpointing. |
