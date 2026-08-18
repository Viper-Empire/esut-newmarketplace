# Buyer, Seller, and Administrator Dashboard Communication Audit

**Audit date:** 18 August 2026  
**Scope:** Publicly reachable dashboard routes, authenticated buyer workflows, verified seller operations, administrator oversight, shared tRPC contracts, mutation refresh behavior, and real browser review.  
**Method:** Source trace, server-contract review, non-destructive browser walkthroughs, recent diagnostic-log review, TypeScript validation, and Vitest regression tests.

## Executive conclusion

The marketplace’s core buyer → seller → administrator lifecycle is server-authoritative and substantially connected: checkout creates seller notifications, seller lifecycle changes create buyer notifications and history, pickup coordination is ownership-scoped, and administrator decisions persist review/audit records. The audit found several **client-to-server contract and workspace synchronization defects**, primarily in seller operations. These defects have been repaired without changing marketplace records.

| Area | Result | Notes |
|---|---|---|
| Buyer orders and pickup | Connected | Ownership-scoped order detail, buyer-only pickup code display, pickup acknowledgement, support escalation, and retry states are present. |
| Seller order operations | Repaired | Queue filtering now works; invalid page-size inputs and unsafe bulk-completion affordance were removed. |
| Seller store/catalogue | Repaired | Important mutations now invalidate related overview, analytics, action-queue, onboarding, and marketplace data caches. |
| Seller route feedback | Repaired | Seller-only subpages now show onboarding guidance to ordinary members before protected queries are issued. |
| Administrator oversight | Connected | Server-protected review, analytics, audit log, alerts, and detailed records are present. The suite navigation label is now accurate. |
| Cross-role notifications | Connected | Checkout, order status, pickup instructions, offers, reviews, seller applications, and disputes write counterpart notifications. |

## Confirmed findings and applied repairs

### 1. Seller orders could not load

The seller orders screen requested **30 records** while the shared server pager allows a maximum of **24**. The live browser displayed a validation failure (`limit` too big) instead of an order list. The same mismatch existed in seller store/products/inventory pages and the administrator orders page.

**Repair:** All affected dashboard queries now request at most 24 records. A live visit to `/seller/orders?status=READY_FOR_PICKUP` now resolves successfully and displays the accurate filtered empty state when no matching orders exist.

### 2. Seller action-queue links did not apply their requested status

The seller operations cockpit linked to `/seller/orders?status=READY_FOR_PICKUP`, but the orders page did not read the query string. Sellers therefore landed on **All orders**, which disconnected the action queue from the intended operational view.

**Repair:** The orders page now reads and validates its `status` query parameter, synchronizes the status selector, and fetches the corresponding server-authorized status filter. Invalid parameters safely fall back to **All orders**.

### 3. Bulk completion conflicted with pickup security

The bulk seller-order menu exposed “Complete pickup and record cash,” but secure completion requires the buyer’s individual six-digit pickup code. The server correctly rejected that action, but the UI made it appear available.

**Repair:** Bulk completion was removed from both the UI and the server input schema. Sellers now complete each ready order only on its order-detail handoff page after entering the buyer’s code. A dedicated regression test proves a batch cannot submit `COMPLETED` status.

### 4. Seller subpages gave inconsistent feedback to buyers

Seller offers, reviews, messages, and settings had a generic authenticated gate. A signed-in buyer could reach the page and then encounter an unhelpful protected-query error or ambiguous empty state.

**Repair:** These routes now use an explicit verified-seller route gate with clear paths to seller onboarding and the buyer account. Server-side authorization remains the final enforcement layer.

### 5. Seller overview data could remain stale after operations

Several seller mutations refreshed only the local page query. Store edits, inventory changes, product status changes, images, and product updates could leave cached analytics, dashboard action queues, onboarding progress, or public marketplace search results stale until a manual reload.

**Repair:** Related queries are now invalidated after successful store, catalogue, inventory, image, and status mutations. No client cache is treated as authorization; fresh server queries continue to enforce ownership and role boundaries.

### 6. Administrator suite navigation mislabeled the overview

The `/admin` nav entry was labeled “Trust reviews,” even though it is the main administrator overview with marketplace operations, review queues, and security alerts.

**Repair:** The label is now **Overview**.

## Verified communication chains

| Trigger | Buyer effect | Seller effect | Administrator effect |
|---|---|---|---|
| Buyer checkout | Order appears in buyer purchases | New-order notification and seller order record | Order visible in oversight/analytics |
| Seller confirms/processes/marks ready | Status notification, history, pickup-code availability | Order lifecycle and action queue update | Lifecycle/analytics reflect durable state |
| Seller publishes pickup instructions | Buyer receives targeted order notification | Seller detail retains coordination state | Audit record available; exception workflow remains protected |
| Buyer acknowledges or escalates pickup | Buyer detail updates | Seller receives exception notification when applicable | Audit/operational records available for follow-up |
| Seller confirms code-based handoff | Completed order, payment recorded, review eligibility | Completion/sales analytics update | Order history and audit trail reflect completed handoff |
| Administrator reviews seller application | Applicant receives state-specific notification | Approved applicants gain verified seller role/store access | Reviewer attribution and immutable review history are visible |

## Validation evidence

| Check | Result |
|---|---|
| TypeScript (`pnpm check`) | Passed |
| Vitest | **30 files, 88 tests passed** |
| Seller queue browser review | Passed: query status visibly selected; filtered request completed without input-validation error; bulk completion absent |
| Signed-out / ordinary-member admin boundaries | Previously verified in the endpoint security audit: protected admin routes reject unauthorized access |

## Residual operational observations

1. Browser walkthroughs used the available elevated session and real existing data. The current dataset has no ready-for-pickup seller orders, so the filtered queue correctly showed an empty state. A dedicated test account with buyer and seller orders is still recommended before launch for full end-to-end handoff rehearsal.
2. Administrator mutations are server-authoritative and durable. Some separate administrator list pages may retain a local cached count until navigation or query refetch; this is a usability improvement opportunity, not a data-integrity or authorization failure.
3. Notification delivery is recorded in the database. Transactional email delivery remains constrained by the configured sender/domain state and should be tested after the sending-domain rollout.

## Recommended next validation

1. Create controlled test accounts for buyer, verified seller, and administrator roles, then execute a full checkout → pickup instructions → acknowledgement → code handoff → review → dispute drill.
2. Add Playwright journeys that verify filtered seller queue navigation, page-size constraints, seller route feedback, and cache-refresh expectations.
3. Add administrator list-page invalidation helpers for instantaneous KPI/audit refresh after moderation decisions.
