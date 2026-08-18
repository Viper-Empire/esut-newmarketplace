# ESUT Marketplace — Product Reminders, Verified Purchase Reviews, and Re-Purchase Discovery

## Executive Summary

The uploaded requirements fit the marketplace’s core purpose and can be implemented without rebuilding its existing buyer, seller, order, cart, notification, or moderation systems. The review-security foundation is already strong: reviews are tied to a completed buyer-owned order item, duplicate reviews for the same order/listing are blocked, public review data already exposes only the buyer’s display name, and seller reviews cannot be silently deleted by sellers. The new work should therefore add **real buyer-owned reminders**, richer review-to-product discovery, and safe re-purchase actions around these existing controls.

> **Scope boundary:** This plan does not change live video evidence, evidence storage, livestreams, seller verification, payment methods, or the dual buyer/seller account model. It preserves campus pickup and Cash on Pickup, server-side cart validation, administrator/moderator review control, and every existing authorization boundary.

## Audit Findings and Reusable Foundations

| Area | Reusable implementation already present | Gap to address |
|---|---|---|
| Buyer identity | `users` and `profiles` support authenticated dual-role accounts | None; reminder ownership must always derive from the authenticated user. |
| Products and availability | `listings`, `inventory`, and server-owned `IN_STOCK`, `LOW_STOCK`, and `AWAITING_STOCK` states | Historical review cards need a truthful active/unavailable product context. |
| Stores | Active store detail page, public catalogue, and verified-store signals | Review cards do not yet link back to the currently available reviewed product. |
| Orders and purchases | `orders`, `orderItems`, completed-order lifecycle, and transactional stock checks | Add re-purchase candidates based on current listings, not old snapshots alone. |
| Reviews | One review per order/listing, completed-purchase eligibility, seller responses, reporting, admin moderation, audit trail | Add optional review title, buyer-safe product discovery context, and an explicit post-purchase prompt. |
| Public reviewer identity | Product and store review projections already expose `buyer.name` only | Retain this safe projection; never fall back to email or private account fields. |
| Saved products | Buyer-owned `favorites` with a unique `(userId, listingId)` constraint and saved-listings page | Favorites are not sufficient for scheduled/triggered/cancelled reminder states. |
| Notifications | In-app, user-owned notifications with unread/read management and protected routing | Add only real reminder-trigger and review-prompt notifications. |
| Buyer dashboard | Saved listings, pickup reminders, recent orders, unread updates, and review eligibility UI already exist | Add product reminders, purchase review prompts, and safe Buy again candidates. |
| Seller and administrator reviews | Seller review visibility/response, review reporting, administrator moderation, and audit logging exist | Extend projections only if the audit reveals a specific missing metric; do not duplicate moderation. |

The current system does **not** have a product-reminder persistence model or scheduled reminder delivery. It also has no canonical cross-listing product entity. Therefore, a reminder must reference the actual listing a buyer selected, and “similar products” should reuse the current search/category mechanisms rather than inventing automatic product matching.

## Reminder Delivery Decision Required

The request includes real timed choices such as tomorrow, weekend, next week, and a custom date. Those require a durable background delivery mechanism; a button or a browser timer would not be truthful. Two viable approaches are below. Please approve one before reminder delivery is implemented.

| Approach | Tradeoffs | Cost | Setup complexity |
|---|---|---|---|
| **Saved product reminders only** | Buyers can save, edit, and remove reminder records, but reminders appear only in their account; no timed notification is claimed or sent. This is lighter but does not fully meet the timed-reminder journey. | No recurring delivery cost. | Low. |
| **Automatic in-app reminders** | A durable background job checks due reminders at a defined interval (for example, every 15 minutes), creates one real in-app notification, and marks the reminder triggered only after the insert succeeds. This fully supports tomorrow/weekend/next-week/custom reminders but requires the published site to be configured for background delivery. | No per-notification provider fee for the existing in-app channel; normal hosting background-job usage applies. | Medium. |
| **Exact per-reminder delivery schedules** | Each reminder receives its own exact schedule. This gives closer delivery times but creates more jobs to manage, makes cancellation/update lifecycle more complex, and is unnecessary for the first campus-marketplace release. | No external-message fee for in-app delivery, but more background job management. | High. |

The plan below is written so that the first approach can be delivered without pretending notifications were sent, while the second approach can be enabled later without redesigning the database. The implementation will not create a recurring job, promise notifications, or mark reminders triggered until the user selects and approves an automatic-delivery approach.

## Data Model and Migration Plan

### 1. Add `productReminders`

Create an additive `productReminders` table because Favorites cannot represent schedule, delivery, cancellation, or product-unavailable state without changing its meaning. The row will include an internal primary key; `userId`; `listingId`; a nullable `storeId` snapshot for graceful historical context; `reminderType` (`LATER`, `TOMORROW`, `WEEKEND`, `NEXT_WEEK`, `CUSTOM`); nullable `scheduledFor`; `status` (`ACTIVE`, `TRIGGERED`, `CANCELLED`, `UNAVAILABLE`); `triggeredAt`; `cancelledAt`; optional background-delivery task identifier only if the exact-schedule option is later selected; and server-owned timestamps.

Indexes will support private dashboard queries and due-reminder scans: `(userId, status, scheduledFor)` and `(status, scheduledFor)`. A user/listing uniqueness rule will prevent a buyer from silently accumulating duplicate active reminders for the same listing. Reminder creation and changes will never accept `userId` from the client.

### 2. Extend `reviews` Minimally

Add an optional bounded `title` field to the existing `reviews` table so buyers can supply a short review heading. Do not create a replacement review table. Keep `orderId`, `listingId`, `storeId`, `buyerUserId`, the existing unique order/listing constraint, published/removed moderation state, seller response, and timestamps unchanged.

Review reports already reuse the existing `reports` table with `targetType = REVIEW`; no separate review-report table is needed. Administrator review moderation and audit logging already exist and will remain the authority for hiding/restoring reviews.

## Server-Side Contracts

### Product Reminder Procedures

The protected reminder router will provide the following server-authoritative actions.

| Procedure | Rule set |
|---|---|
| `reminders.create` | Uses `ctx.user.id`, confirms the listing exists, records the selected reminder type and valid future custom time, and prevents duplicate active reminders. In the no-delivery option, it records only the reminder. In automatic-delivery mode, it also schedules the durable delivery path. |
| `reminders.listMine` | Returns only the signed-in buyer’s reminders with current listing/store/image/availability context; historical inactive listings are rendered as unavailable, not deleted from the buyer’s history. |
| `reminders.update` | Finds the row by reminder ID **and authenticated owner**, updates permitted schedule/type fields, and never permits client ownership changes. |
| `reminders.cancel` | Marks the caller’s own active reminder cancelled and, where relevant, cancels the durable delivery job. It does not erase audit-relevant history. |
| `reminders.reactivate` | Allows a buyer to set a new future reminder after a prior trigger/cancel/unavailable state, subject to current listing policy. |
| `reminders.reviewDiscoveryAction` | A thin reuse point for review cards that delegates to the same owner-safe create/update logic; it does not create anonymous reminders. |

The server will set `UNAVAILABLE` only from current listing/store/availability state, and `TRIGGERED` only after a real in-app notification is successfully inserted. It will never fabricate a completed reminder or claim external delivery.

### Verified Review and Discovery Procedures

The existing review eligibility rules will remain intact and be enhanced, not weakened. The server will continue to verify the authenticated buyer owns the order, the completed order contains the listing, and no review already exists for that order/listing. It will accept an optional bounded title, rating, and bounded text. The buyer identity, order owner, and verification state will remain entirely server-derived.

Public product/store review projections will return only a display-safe buyer name and a safe reviewed-product reference. When the referenced listing is active and its store is active, return title, slug, price, primary image, availability, and category information sufficient for navigation. When it is archived, suspended, missing, out of stock, or its store is closed, return an explicit unavailable state and safe store/search alternatives. Never return buyer email, phone, address, internal ID, order ID, payment data, pickup code, messages, reviewer role, storage key, or signed URL.

### Buy Again and Review Prompt Procedures

Add a buyer-owned `repurchaseCandidates` projection that joins the buyer’s completed order items to the **current** listings and stores. A candidate is purchasable only if the listing is active, its store is active, and server-calculated inventory is available. “Buy again” will call the existing protected cart-add procedure; it will not reuse a stale historical order item as a purchasable record or bypass current stock/price validation.

Add a `reviewPrompts` projection based on the existing completed purchase review eligibility query. A prompt is non-intrusive: it is shown once after completion and can be dismissed locally or recorded in a small buyer-owned prompt-state record if durable suppression is required. When automatic reminders are approved, the completion transition can create one real in-app “How was your purchase?” notification only when the item is genuinely eligible and has not already been reviewed or notified.

## User Experience Plan

### Product Detail Page

Add a visible **Remind me** action beside the existing Save, Add to cart, and Buy now controls. It will offer Later, Tomorrow, This weekend, Next week, and Custom date/time. Its state will be server-backed: **Remind me**, **Reminder set**, **View product**, or **Product unavailable**. Save remains the existing Favorites action; it does not reserve inventory and is not silently transformed into a timed reminder.

For a buyer who previously completed purchase of the same current listing, show **Buy again** only when the server says the listing is active and available. Otherwise, show unavailable, View store, See similar products, and Set reminder actions without a broken purchase control.

### Store and Product Review Cards

Continue displaying the existing public-safe reviewer name as **Reviewed by [display name]** and preserve the **Verified Purchase** label. Enhance public shop review cards with a compact Purchased product panel. Active listings show the product image/fallback, live price, live availability, View product, and Save as reminder. Unavailable historical listings show the real product title and an honest unavailable state, then offer Set reminder, View store, and See similar products. The similar-products action will reuse the current catalogue search/category route; it will not create duplicate listings or claim semantic product matching that does not exist.

The product page already displays reviews for that same listing. It will retain reviewer name and verified-purchase status, add the optional review title, and may expose a reminder/save action without linking buyers to a redundant copy of the current page.

### Buyer Workspace

Add a **Your product reminders** dashboard card and full account page. It will clearly separate upcoming, triggered, unavailable, and cancelled reminders; include View product, Edit, Remove, View store, See similar products, and current availability; and avoid calling a reminder complete unless it actually triggered. Add a **Purchases ready for review** section based on real completed, unreviewed order items, with Write review and View your review actions. Add a **Buy again** section for server-approved repurchase candidates.

### Seller and Administrator Views

Preserve the existing seller review page, rating information, seller response capability, review reporting, administrator moderation, restoration, and audit records. Seller projections remain limited to display-safe buyer names. No seller receives buyer email, phone, payment, address, or private order records. The implementation will add seller rating/distribution metrics only if the current analytics audit confirms they are absent and the real review dataset can support them without fabrication.

## Security and Integrity Requirements

| Threat or integrity risk | Required protection |
|---|---|
| Reminder IDOR or user-ID spoofing | Derive user identity from the authenticated server context; every read/update/cancel includes owner scope. |
| Fake or duplicate purchase review | Reuse completed-order, order-item, and existing unique order/listing checks in a transaction. |
| Historical/unavailable purchase actions | Resolve current listing, active store, and server-owned inventory before displaying Buy again or invoking cart-add. |
| Private buyer/order leakage | Use narrow, explicit public projections and regression tests that reject email, IDs, order/payment/pickup details, and storage fields. |
| Seller suppression of negative reviews | Preserve seller response/report rights only; moderator/administrator authority remains server-gated. |
| Reminder delivery duplication | Make scheduled handling idempotent, transition only from active due rows, and insert the real notification and trigger state atomically. |
| XSS or injection | Keep bounded server validation, React escaping, and Drizzle parameterized query patterns; no unsafe HTML rendering. |

## Delivery Architecture and Background-Job Safeguards

If automatic delivery is approved, reminders will use a durable scheduled HTTP callback rather than a browser timer, `setInterval`, or process-local scheduler. The callback will authenticate as a scheduled caller, find only due active reminder rows, atomically insert the recipient’s real in-app notification, and then mark the reminder triggered. It will be idempotent so retries do not generate duplicate notifications. The endpoint will be registered before static fall-through, use structured JSON errors, and be introduced only after a checkpoint and a user-approved publish step, because scheduled callbacks require the deployed site.

The initial delivery resolution should be stated in the UI (for example, “usually within 15 minutes”) if a periodic delivery interval is selected. Exact-to-the-minute claims will not be made unless the exact per-reminder schedule approach is explicitly approved and configured.

## Implementation Sequence

1. **Baseline audit and no-regression map.** Confirm current completed-order states, active listing/store policy, review moderation, favorites ownership, notification route handling, and dashboard navigation. Publish the audit summary in the implementation handoff.
2. **Migration and low-level policies.** Add `productReminders` and the optional review title, generate/read/apply one additive migration, and add index/unique constraints. No product/media storage change is required.
3. **Protected reminder contracts.** Build private create/list/update/cancel/reactivate procedures with ownership checks, schedule validation, current availability projection, and audit/notification rules selected in the delivery decision.
4. **Review and repurchase contracts.** Extend public store/product review projections with safe purchased-product context; add optional review title/update policy; add buyer review prompts and buy-again candidates using current listing/store/stock state.
5. **Buyer and storefront interfaces.** Build product reminder controls, shop review purchased-product cards, active/unavailable fallbacks, dashboard/account reminder management, review prompts, and buy-again actions using existing cart/favorites components where appropriate.
6. **Seller/admin follow-through.** Verify seller review metrics/response/report views and administrator moderation/audit workflows remain secure; add only truly missing real-data metrics or context.
7. **Background delivery, if approved.** Save a checkpoint, ask the user to publish, then register and configure the durable scheduled callback. Do not enable automatic delivery before this step.
8. **Validation and handoff.** Run TypeScript, all Vitest suites, relevant browser/e2e paths, responsive desktop/mobile checks, security/IDOR/duplicate tests, checklist reconciliation, and a checkpoint.

## Test Matrix

| Area | Required automated checks |
|---|---|
| Reminders | Create/list/update/cancel/reactivate own reminder; reject other-user access, client user IDs, duplicate active rows, invalid past/custom times, and unauthenticated persistence. |
| Delivery | Due reminder triggers exactly one notification; retry is idempotent; no notification on failed delivery; cancelled/unavailable reminders do not trigger. |
| Reviews | Completed owner can review; unpurchased, incomplete, cross-user, spoofed, and duplicate review attempts fail; title/text bounds are enforced. |
| Public discovery | Reviewer display name is returned; email/order/payment/private IDs are not; active reviewed product links correctly; inactive/missing/store-closed conditions render safe fallbacks. |
| Buy again | Only current active available listings can enter cart; old, archived, unavailable, or closed-store listings cannot bypass cart policy. |
| Moderation | Seller cannot delete public reviews; moderator/administrator hide/restore actions retain audit behavior. |
| UI | Product, store, reminders, dashboard, review prompt, and repurchase states expose loading/error/empty/success feedback and work at desktop and 375px mobile. |

## Acceptance Criteria

The feature is complete only when a buyer can create, view, edit, cancel, and safely navigate their own product reminders; reviews remain strictly connected to real completed purchases; public reviews show only a display-safe buyer name; buyers can visit or buy the same product only when the current listing/store/inventory rules allow it; unavailable products receive truthful reminder/store/similar alternatives; and Buy again reuses current server-side cart validation. All notification records must be real, all scheduled delivery must be durable and idempotent if enabled, and no private buyer/order data may enter public review responses.
