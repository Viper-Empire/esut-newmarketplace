# Administrator Listing Review Filter and Seller Decision Notifications

## Goal and Scope

This plan improves the administrator workflow for finding **pending marketplace listings** and confirms a reliable, seller-visible notification when an administrator approves or returns listing evidence for correction. The work will extend the existing protected administrator listings query and the existing in-app notification architecture rather than introducing a parallel review or messaging system.

The current codebase already records an in-app `LISTING_MODERATION` notification inside the administrator evidence-review transaction. Implementation will preserve this database-backed mechanism, strengthen its decision-specific wording and destination where useful, and validate that the notification is created exactly once for the owning seller. It will not send emails, push notifications, or SMS messages in this milestone.

> **Explicit deferral:** Live video recording, live streaming, new video upload formats, video-player features, storage changes, and any expansion of the existing evidence-media feature are out of scope. The existing evidence-review capability will only be referenced insofar as it supplies the decision state needed by the queue and seller alert.

| Area | Included | Excluded |
|---|---|---|
| Administrator queue | Server-backed filter for listing state, with an immediate Pending review entry point | New moderation roles, bulk decisions, changes to approval authority |
| Seller alert | One in-app, owner-scoped notification for an evidence approval or return-to-draft decision | Email, push, SMS, notification-provider changes |
| Evidence media | Reuse existing review status as queue context | Live video, recording, streaming, player/storage changes |
| Data model | Reuse `listings`, `listingVideoEvidence`, `notifications`, and audit records | New notification tables or migrations unless inspection identifies a genuine missing index/field |

## Implementation Approach

### Phase 1 — Inspect and Lock the Current Contract

First, inspect the current `admin.listings` projection, administrator listings page, and `reviewListingVideoEvidence` transaction to identify the precise response shape and current cache invalidations. Confirm that existing seller notification records are inserted atomically with the evidence and listing transition, are scoped to `stores.ownerUserId`, and cannot be duplicated because a non-pending listing is rejected by the current transition guard. Review the seller notifications page and seller product/evidence route so the alert resolves to a useful, authorized destination.

No schema change is expected. If the existing review mutation already meets the ownership and single-notification requirement, the implementation will make the smallest compatible change: retain the same `notifications` table and improve only the content, route, or cache refresh required for the seller-facing experience.

### Phase 2 — Add a Server-Enforced Listing-Status Filter

Extend the administrator-only listings procedure input from its current pagination-only contract to accept an optional, allowlisted listing-state filter. The selected set will be bounded to valid persisted listing statuses, with **Pending review** as the primary queue choice. The server—not the browser—will append the corresponding `where` condition before ordering and pagination, preserving the existing administrator authorization guard and safe listing/store/category/inventory/evidence projection.

The plan uses the following queue controls. “All listings” remains available for investigation, while “Pending review” is the main operational queue and is surfaced first in the interface. The implementation will choose a compact status filter control rather than adding unrelated search or sorting behavior.

| Filter choice | Server condition | Intended administrator use |
|---|---|---|
| All listings | No additional status predicate | Investigate any listing state |
| Pending review | `PENDING_REVIEW` | Find listings awaiting an evidence decision |
| Draft / returned | `DRAFT` | Verify items returned to the seller for correction |
| Published | `ACTIVE` | Confirm successfully approved listings |
| Archived | `ARCHIVED` | Investigate withdrawn or moderated listings |

The query input will be stable in React state. Changing the filter resets pagination to the first page, retains loading/error/empty feedback, and invalidates/refetches only the relevant administrator listing query after a decision. The implementation will preserve accessible labels, keyboard focus, pressed/selected state, and an honest empty state that says no listings match the selected filter rather than implying that there are no listings overall.

### Phase 3 — Complete the Seller Decision Notification Experience

Retain the existing transactional notification creation in `admin.reviewListingVideoEvidence`; do not emit a notification from the client. The server will create a single seller-owned notification only after the evidence and listing decision is successfully applied. Approval will identify that the product is live; return-to-draft will clearly say that evidence needs attention and include the administrator’s review note. The notification target will lead to the seller’s relevant product/evidence context when that route is available, otherwise it will retain the existing seller products destination.

The seller-facing notification list will continue to show title, message, unread styling, timestamp, safe route link, and mark-read controls. Any product title or administrator note included in the message will be bounded and sourced from the protected transaction; no storage key, signed URL, internal reviewer detail, or media metadata will be exposed in the notification.

### Phase 4 — Regression Coverage and Verification

Add procedure tests covering the following guarantees: non-administrators cannot query filtered administrator listings or decide evidence; the filter rejects unrecognized input and returns only the requested status; an evidence decision creates exactly one notification for the listing owner; no notification is written when the decision fails; and a previously decided listing cannot produce a second decision notification. Existing administrator endpoint tests will be extended instead of duplicated where possible.

Run TypeScript validation and the complete Vitest suite. Review the administrator listings page at desktop and 375px mobile widths, including the Pending review filter, selected-state semantics, loading/error/empty states, and the post-decision refresh. Finally, inspect the signed-in seller notifications view to confirm that the alert is visible, unread-count behavior refreshes, the link is authorized, and the review note is clear without disclosing protected evidence data.

## Important Decisions

| Decision | Rationale |
|---|---|
| Filter on the protected server query | Avoids loading a broad administrator dataset in the browser and makes pagination truthful. |
| Reuse the existing notification table and transaction | Prevents duplicate notification systems and keeps evidence decisions, audit records, listing state, and alerts consistent. |
| Use in-app notifications only | Matches the implemented notification architecture and avoids reopening deferred outbound-email prerequisites. |
| Do not alter live-video/evidence storage features | Honors the requested deferral and confines this milestone to review operations and communication. |
| Keep the review mutation single-decision | The existing pending-status precondition is the correct protection against duplicate alerts and conflicting publication outcomes. |

## Assumptions and Risks

This plan assumes the current `PENDING_REVIEW`, `DRAFT`, `ACTIVE`, and `ARCHIVED` listing states remain the correct administrator queue vocabulary and that the evidence-decision mutation remains the sole path from pending review to publication or return-to-draft. It also assumes the user wants notification delivery inside the existing authenticated marketplace account, not a new external delivery channel.

The main implementation risk is cache inconsistency after a decision: the administrator filter, seller product list, seller notification list, and unread badge must all refetch their respective real records. This will be addressed with the project’s existing scoped cache-refresh pattern and verified in the browser. A second risk is accidental duplicate alerts; transaction ordering and the existing pending-only transition check will be explicitly tested. If source inspection identifies an existing redundant or stale client-side notification path, it will be removed or consolidated rather than layered on top of the server-authoritative event.

## Acceptance Criteria

The milestone is complete when an administrator can select **Pending review** and see only real pending listings, change filters without stale pagination, and receive clear empty/error recovery feedback. After a valid approve or return-to-draft decision, the listing state and queue refresh, exactly one in-app notification is recorded for the owning seller, and the seller can read the decision and safely navigate to the appropriate product context. All authorization boundaries, TypeScript validation, automated regression tests, and desktop/mobile checks must pass. Live video evidence remains untouched.
