# Seller Feedback, Administrator Refresh, and Reversible Moderation Plan

## Goal

Improve operational clarity in the seller workspace, keep administrator data current after moderation, and introduce a **safe, auditable, administrator-only undo/redo mechanism** for a deliberately limited set of moderation actions. The work will preserve the existing server-authoritative role, ownership, pickup-code, inventory, and audit-log protections.

## Confirmed scope

| Workstream | Included outcome |
|---|---|
| Seller inventory feedback | Inventory rows show a compact loading animation while saving, prevent duplicate submission, announce success accessibly, and identify the item and save time in the visible success state. Existing toast feedback remains as a secondary confirmation. |
| Administrator cache refresh | A shared client-side helper invalidates the administrator overview, analytics, audit log, security alerts, and directly affected list/detail queries after a successful moderation action. |
| Undo/redo | First release covers **administrator moderation actions only**. It records an immutable reversible-action ledger and presents a protected action-history panel for eligible recent decisions. |

## Important product and security decisions

> Undo/redo is not deletion. Every original action, undo, and redo remains in the immutable audit log with actor, target, timestamp, reason, and action-chain reference.

The initial reversible set will be limited to actions whose prior state can be restored atomically without changing payments, stock commitments, physical pickup evidence, or role-derived stores:

| Reversible in v1 | Why it is safe enough to restore |
|---|---|
| User active/inactive state | Restores one explicitly tracked access flag, subject to self-protection and current-state checks. |
| Store active/suspended moderation state and verification flag | Restores store moderation state without changing inventory or completed commerce. |
| Listing active/archived moderation state | Restores a listing visibility state only. |
| Safety-report investigation/resolution status and resolution note | Restores the recorded moderation classification. |
| Review published/removed moderation status | Restores the review visibility state. |

The following are explicitly excluded from v1: checkout, reservation expiry, inventory changes, payment status, pickup-code issuance or verification, completed/cancelled order transitions, disputes that change order lifecycle, seller verification/application approvals that create roles or stores, password/session changes, role changes, audit log changes, email configuration, and destructive data deletion. These actions will display no undo control.

## Phase 1 — Establish the reversible-action model

1. Inspect each existing administrator mutation and map its safe before/after fields, transaction boundary, current audit event, and affected query keys.
2. Add an additive `admin_reversible_actions` table and Drizzle relation/migration. The record will contain the immutable original-action ID, action type, target type/ID, actor ID, allowlisted before and after snapshots, eligibility status, creation time, undo/redo actor and timestamps, and a monotonic revision/version.
3. Store only narrowly allowlisted state fields in snapshots. The table and API will never copy passwords, tokens, evidence keys, URLs, identity documents, private messages, or unrestricted JSON blobs.
4. Add database indexes for recent administrator action history, target lookup, eligibility status, and actor/time ordering.

## Phase 2 — Add transactional server-side moderation and reversal contracts

1. Extract a small server helper for recording an eligible action and its safe snapshots within the same transaction as the original moderation mutation.
2. Update only the included administrator mutations to create both their existing audit event and reversible-action record atomically.
3. Add protected administrator procedures:
   - `admin.reversibleActions.list` for bounded, paginated eligible/recent history with safe actor and target projections.
   - `admin.undoReversibleAction` for a current-state-checked reversal.
   - `admin.redoReversibleAction` for a current-state-checked reapplication.
4. Enforce these rules in every undo/redo procedure:
   - the caller must be `ADMIN` or `SUPER_ADMIN`;
   - an `ADMIN` may reverse only an eligible action they created within a short 15-minute recovery window;
   - a `SUPER_ADMIN` may reverse any eligible action in the supported retention window;
   - no one can deactivate themselves or alter their own privileged access through reversal;
   - the target’s present values must match the expected current snapshot (optimistic-concurrency check);
   - an action may be undone only once, and redone only after a successful undo;
   - a later conflicting moderation event blocks undo/redo rather than overwriting a newer decision;
   - every outcome writes a new immutable audit-log entry with a chain reference and a clear reason.
5. Return safe, user-oriented conflict responses when an action is no longer reversible; never expose raw database state or other administrators’ private metadata.

## Phase 3 — Centralize administrator cache refresh behavior

1. Add a reusable `useAdminWorkspaceRefresh` client hook backed by `trpc.useUtils()`.
2. The helper will invalidate the overview/security-alert projection, administrator analytics, audit log, relevant queue/list query, and relevant detail query after a completed action.
3. Replace one-off success callbacks in administrator users, stores, listings, reports, reviews, disputes, verification, and application views with scoped calls to the helper. This keeps the refresh set intentional rather than invalidating every query blindly.
4. Invoke the same helper after successful undo and redo, ensuring the audit history, active records, overview KPIs, and alert panel immediately agree.

## Phase 4 — Improve seller inventory save feedback

1. Update `SellerInventoryPage` and `InventoryRow` so the currently saving item is identified from mutation variables rather than showing an indistinct global pending state.
2. Use the existing spinner component or Lucide loader with `aria-busy`, a concise 160–240 ms opacity/transform-safe animation, and `prefers-reduced-motion` support.
3. Disable only the affected inventory row while saving; retain a visible `Saving inventory…` label and prevent duplicate requests.
4. On success, refetch/invalidate the linked seller products, analytics, action queue, onboarding progress, and marketplace projections, then show an inline accessible success message such as “Inventory saved for [product] at [local time].”
5. Preserve clear error feedback and restore the editable control after a failed request.

## Phase 5 — Build the administrator interface

1. Add a **Recent reversible actions** section to the administrator overview or audit-log workspace, using the existing ESUT admin visual language and responsive table/card patterns.
2. Show action, target, original actor, timestamp, current reversible state, and safe summary—not raw snapshots.
3. Use a confirmation dialog for Undo and Redo that explains the exact state transition and requires an administrator note. The dialog must not claim a reversal is available if the server has marked the action ineligible.
4. Provide explicit loading, empty, conflict, success, and retry states. Buttons remain disabled while a mutation is pending.
5. Keep primary moderation controls unchanged; undo/redo is a recovery tool, not a replacement for normal operations.

## Phase 6 — Test and validate

| Test area | Required validation |
|---|---|
| Schema/migration | Migration generation, SQL review, application, indexes, and no destructive alteration of existing audit rows. |
| Authorization | Signed-out, buyer, seller, moderator, `ADMIN`, and `SUPER_ADMIN` caller cases. |
| Reversibility | Each supported action stores an allowlisted snapshot, undoes once, redoes once, and leaves a complete audit chain. |
| Safety | Reject unsupported action types, self-deactivation, stale state, conflicting later action, duplicate undo, redo-before-undo, and secret/sensitive snapshot fields. |
| Cache behavior | Unit or component-level checks that each mutation invokes the scoped refresh helper; browser check confirms overview, list, and audit history update without manual page reload. |
| Seller inventory UX | Browser validation for row-local loading state, accessible announcement, success display, invalidation of seller metrics, and error recovery at desktop and mobile sizes. |
| Regression | Run `pnpm check`, full Vitest suite, focused browser scenarios, and manual responsive review before checkpointing. |

## Assumptions and risks

The plan assumes that the intended “undo or redo” feature means accidental **administrator moderation** decisions, as confirmed by the selected option A. Reversal will not be used for commerce, payment, order, or identity decisions in the first release because their side effects require a dedicated compensating workflow.

The action ledger is intentionally additive and audit-preserving. It creates more data rather than erasing history. The main operational risk is an administrator attempting to reverse an action after another authorized administrator has made a later related decision; optimistic concurrency and conflict responses will reject that unsafe reversal. The planned retention window and Super Admin override policy should be reviewed before a broader enterprise/compliance rollout.

## Acceptance criteria

The work is complete only when seller inventory updates give clear row-level progress and completion feedback; administrator moderation success immediately refreshes dependent dashboard data; only eligible moderation actions receive undo/redo controls; all reversible transitions are atomic, server-authorized, audit-preserving, and concurrency-safe; and the full test/visual validation suite passes.
