# ESUT Marketplace — Full Current-State Audit and Core-Purpose Gap Report

**Prepared by:** Manus AI  
**Audit scope:** Current codebase, database model, server procedures, client routes, automated validation, and connected-browser walkthroughs  
**Audit date:** 17 August 2026  
**Project:** `esut-marketplace`

## Executive conclusion

ESUT Marketplace has progressed beyond a visual prototype. It is now a database-backed, multi-vendor university marketplace with real public discovery, buyer accounts, seller onboarding and verification, store and listing management, campus-pickup checkout, cash-on-pickup payment policy, order lifecycle controls, buyer-seller messaging, offers, reviews, disputes, administrator moderation, analytics, notifications, audit records, and a two-party pickup confirmation code.

The strongest parts of the current foundation are **ownership-safe server procedures**, **real-data dashboards**, **concurrency-aware inventory reservation**, **cash-on-pickup clarity**, **seller verification gates**, **protected order transitions**, and **automated regression coverage**. The product’s central promise is visible in the live preview: a buyer can discover an active ESUT listing, identify a verified seller, use a protected account and checkout flow, arrange campus pickup, and complete a seller handoff with a buyer-controlled confirmation code.

The project is not yet a complete production commerce operation in every business dimension. The most important remaining work is not the optional QR or escrow concepts discussed in the deferred notes. The core priorities are operational readiness: make every important buyer and seller journey fully exercisable with realistic data, strengthen administrator workflows and investigation evidence, improve communication and notification reliability, establish production data and content governance, add robust observability and recovery procedures, and complete the business policies needed for disputes, refunds, seller payouts, and account support.

> **Overall assessment:** The core marketplace foundation is substantial and coherent, but the next phase should focus on operational completeness and launch discipline rather than adding advanced convenience features.

## 1. Audit method and evidence boundaries

This audit used four evidence groups. First, the source code was inspected across the Drizzle schema, tRPC router, lifecycle helpers, frontend route registration, page components, tests, migration history, and project reports. Second, the live preview was opened in the connected browser as a buyer, seller, and administrator. Third, the project validation commands were rerun. Fourth, the current project history and prior validation reports were compared with observed behavior.

The connected-browser walkthrough was authenticated and role-aware, but it was performed with the available account and current database state. That account exposed an approved seller relationship and an administrator workspace, while the seller workspace contained honest zero-state operational data. There was no active buyer order ready for pickup during the session, so a real end-to-end physical pickup transaction, seller transition, cash collection, and pickup-code submission could not be executed against a live order. Those paths were assessed through the implementation and automated procedure tests rather than claimed as live transaction evidence.

| Evidence area | Observed or inspected evidence | Audit implication |
| --- | --- | --- |
| Public storefront | Live homepage, category navigation, search entry, active listings, verified stores, campus-pickup messaging | Public buyer discovery is operational and data-backed |
| Buyer workspace | Live `/account` dashboard with real counts, notifications, saved listing, protected navigation | Buyer account foundation is operational; no active order was available for a complete pickup walkthrough |
| Seller workspace | Live `/seller` cockpit with role-aware navigation and honest zero states | Seller workspace is operational and scoped; transaction behavior was verified in code/tests, not live against an active order |
| Administrator workspace | Live `/admin` dashboard with live metrics, seller verification/application records, oversight sections, and logout | Admin governance is substantial and data-backed |
| Codebase | `drizzle/schema.ts`, `server/routers.ts`, lifecycle helpers, frontend routes/pages | Core data and authorization contracts are present |
| Automated validation | `pnpm check`, 27 Vitest files / 76 tests, and 19 Chromium scenarios | Current regression baseline is green |
| Deferred roadmap | QR, unrestricted override, escrow, and settlement-window proposals | Retained as future ideas, not treated as current functionality or current priority |

## 2. Product purpose and operating model

The core purpose of ESUT Marketplace is to enable trusted commerce within the ESUT community. The operating model has four actors:

| Actor | Core responsibility | Current product support |
| --- | --- | --- |
| Buyer | Discover products, evaluate sellers, save listings, communicate, place a campus-pickup order, pay cash on collection, and track completion | Strong foundation across public discovery, account dashboard, favorites, offers, messaging, checkout, order detail, disputes, reviews, and pickup code display |
| Seller | Apply, complete verification, create and manage listings, maintain inventory, respond to offers/messages, process orders, and complete pickup handoffs | Strong foundation with verification gates, seller store, product and inventory controls, order filters, bulk transitions, analytics, and pickup-code verification |
| Administrator | Verify sellers, approve stores, moderate listings/stores/users, handle safety reports/disputes/reviews, inspect orders, configure communications, and audit actions | Broad control surface with live metrics and many protected procedures; several investigation and policy workflows still need deeper operational detail |
| Marketplace system | Preserve authorization, prevent overselling, record lifecycle history, deliver notifications, and expose reliable operational state | Strong server-side base with inventory reservations, idempotent checkout batches, order histories, audits, notifications, and regression tests |

The current fulfillment and payment policy is intentionally narrow: **campus pickup** and **cash on pickup**. That is a useful launch constraint because it avoids pretending that card payment, escrow, delivery tracking, seller payouts, and automated refunds already exist. It also places more importance on clear pickup coordination, dispute policy, seller accountability, and administrator support.

## 3. What has been built

### 3.1 Public marketplace and discovery

The homepage is branded around ESUT’s red, green, and gold identity, with deep navy used for workspace navigation. The live page exposes search, categories, active product cards, seller/store discovery, verified-seller signals, campus-pickup messaging, and seller onboarding entry points. Current categories include Electronics, Fashion, Phones & Accessories, Books, Hostel & Lodge, Food & Groceries, Services, and Computing.

The public server procedures provide homepage projections, active category retrieval, marketplace search with category, price, condition, verification, sorting, and pagination inputs, search suggestions, product detail, and store detail. Product detail includes real product data, related listings, seller information, reviews, offers, messaging, reporting, and buyer guidance. The homepage’s “campus services” area correctly displays an empty state when no approved service listings exist rather than fabricating service inventory.

### 3.2 Authentication and account security

The marketplace supports direct local registration and login rather than relying only on a generic external portal. Registration captures name, email, phone, account type, and a password of at least ten characters. The interface includes password visibility controls and password confirmation. Login includes failure counting and temporary lockout after repeated failures. Logout is available through the shared account and administrator surfaces.

The server includes password hashing, password reset token issuance and consumption, email verification token support, password change while authenticated, session creation, inactive-account checks, and authentication throttling. Email verification and ordinary-recipient recovery delivery remain bounded by the current email provider configuration; the product makes the delivery state explicit rather than claiming successful normal-recipient delivery when the sender is restricted.

The account model distinguishes customer, seller, moderator, administrator, and super-administrator roles. Seller account type distinguishes individual and business applicants. Profiles retain verification status and seller metadata. This is an appropriate foundation for a university marketplace where access to sensitive seller operations must depend on both role and verification state.

### 3.3 Buyer operations

The buyer workspace is a real purchase-management cockpit rather than a static profile page. It displays order-to-collect count, active orders, saved listings, unread updates, recent activity, pickup progress, quick actions, notifications, account security, and seller onboarding access. The live account preview showed zero active purchases, one saved listing, and one unread update, demonstrating that the displayed values are real projections rather than invented dashboard figures.

Buyer capabilities include favorites, buyer offers, buyer-seller conversations, notifications, profile editing, password change, orders list, protected order detail, pending-order cancellation, support/dispute access, reviews, and seller application. The buyer order detail now displays the six-digit pickup confirmation code only when the order is ready for pickup and the code has not been consumed. A legacy recovery mutation exists for ready orders that do not yet have a code.

The buyer flow is conceptually coherent: discovery leads to cart, checkout establishes an order batch, order state is visible in the account, the seller progresses the order, the buyer receives a ready notification, the buyer shows the code at pickup, and the buyer can review or raise a supported dispute afterward.

### 3.4 Cart, checkout, inventory, and order lifecycle

The marketplace supports a multi-seller cart. Checkout groups cart lines by store and creates one order per store under an order batch. The checkout accepts a UUID idempotency key, which prevents duplicate order creation when a buyer retries the submission. The order records campus pickup, cash on pickup, subtotal, fees, total, reservation expiry, buyer, seller store, and order batch ownership.

Inventory is stored as quantity plus reserved quantity. Checkout increases reserved quantity only when sufficient available stock remains. Inventory reservations are recorded per order and listing. Expiry and cancellation release reservations. Completion commits reserved inventory. These mechanisms are materially stronger than a naive decrement-after-purchase implementation and directly address overselling and retry risks.

The order lifecycle includes `PENDING`, `CONFIRMED`, `PROCESSING`, `READY_FOR_PICKUP`, `COMPLETED`, `CANCELLED`, and `DISPUTED`. The shared transition helper validates allowed transitions, records order status history, writes audit logs, updates inventory reservations, updates payment status when appropriate, and sends participant notifications. Seller order controls include status filters, public-ID search, date filters, pagination, selection, bulk status updates, ownership checks, full batch prevalidation, and transaction wrapping.

The two-party pickup code is a significant safety improvement. A six-digit code is generated and encrypted, not stored as plaintext. The buyer sees it only on the buyer-owned ready-for-pickup detail. The seller never receives the code through seller list or detail projections. The seller must enter the code after the physical handoff. Incorrect attempts are counted and bounded. A successful code match is consumed atomically with completion, payment status, inventory commitment, history, audit, and notifications. Direct completion without code verification is rejected.

### 3.5 Seller operations

The seller workspace has a persistent navy sidebar and role-aware navigation for overview, products, orders, inventory, offers, messages, reviews, analytics, and store settings. The seller cockpit shows completed sales, orders requiring action, active listings, stock attention, seven-day activity, completion rate, buyer interest, recent orders, quick actions, and store health. The live seller preview showed honest zero values and explanatory empty states.

Seller onboarding requires verification before sensitive operations. Individual and business seller types follow different verification data requirements. Evidence is stored through managed storage references. A seller application follows verification approval and administrator review. On approval, the system activates the store, marks it verified, changes the user role to seller, notifies the applicant, and can render a managed approval email template.

Verified sellers can create, edit, archive, and manage products; maintain inventory; view store-scoped analytics; respond to offers; manage messages and reviews; update store details; view filtered orders; apply safe bulk transitions; and complete pickup using the buyer confirmation code. Seller procedures consistently scope order, listing, store, offer, review, and analytics queries to the authenticated seller’s ownership boundary.

### 3.6 Administrator governance

The administrator dashboard provides live launch monitoring from real records. The observed preview showed pending verifications, pending store applications, open safety reports, active disputes, active listings, seven-day orders, seven-day completed sales, new members, active sellers, low-stock listings, and a seven-day activity chart. It also exposed seller verification review, store application review, evidence links, safety reports, disputes, audit trail, and logout.

The administrator suite contains protected pages for users, user details, sellers, stores, listings, categories, orders, order details, offers, reports, disputes, reviews, notifications, audit logs, settings, and analytics. The administrator analytics drill-down covers lifecycle totals, pickup aging, seller performance, listing state, and trust/safety breakdowns using date-filtered real records. The settings surface includes notification channels and editable email templates.

Administrator moderation supports user activation, store status changes, listing status changes, category creation, application approval or rejection, report investigation and resolution, dispute handling, review moderation, and notification management. The design correctly keeps administrator access behind server-side role checks and records important administrative actions in audit logs.

### 3.7 Communication, offers, reviews, and trust features

The system includes buyer and seller offers, counteroffers, offer expiry, participant notifications, buyer-seller conversations, participant-only message detail, seller response, public reviews, seller responses, review reporting, safety reports, disputes, and administrator resolution surfaces. Product and store detail pages expose trust signals and related listing discovery.

The notification model supports in-app notification records with read/unread state, target routes, and role-specific events such as new order, order status, seller application, offers, messages, reviews, disputes, and reports. Transactional email support exists through the configured provider, with templates and channel settings in administrator controls. The current normal-recipient delivery limitation remains documented and should be treated as a launch-readiness item rather than hidden.

## 4. Security and data-integrity assessment

The project demonstrates a security posture appropriate for continued development. Public and protected procedures are separated. Administrator, moderator, seller, and verified-seller procedure layers are explicit. Buyer order queries require buyer ownership. Seller order and listing queries require store ownership. Conversation details require participant membership. Buyer notifications require notification ownership. Admin and moderator pages use both frontend gates and protected server procedures.

The order system has several important integrity controls: idempotency keys for checkout batches, reservation-based inventory, transaction-wrapped lifecycle updates, status-transition validation, scoped seller batch updates, audit logs, order history, rate-limited authentication, password hashing, session cookies, password-reset token hashing, and pickup-code encryption with replay protection. The existing IDOR and hostile-route browser tests are valuable evidence that the team has tested more than visual rendering.

The main security areas that still require deeper production assurance are listed below.

| Area | Current position | Required hardening |
| --- | --- | --- |
| Authorization | Strong procedure layering and ownership predicates | Add systematic authorization tests for every admin mutation and all new/rare paths, not only representative procedures |
| Sensitive evidence | Managed storage references and admin evidence links | Confirm object-level authorization, expiry behavior, retention, deletion, and audit access for every evidence type |
| Pickup code | Encrypted, buyer-only display, seller verification, bounded attempts, atomic consumption | Add explicit concurrency tests for two sellers or repeated requests racing to complete the same order; document operational recovery after lockout |
| Admin mutations | Protected and often audited | Standardize mandatory reasons, before/after metadata, actor identity, and idempotency for every destructive action |
| User privacy | Participant-scoped messaging and order access | Review data minimization for administrator views, exported data, notification bodies, and account deletion/retention policy |
| Abuse protection | Login throttling and several ownership checks | Add marketplace-wide throttles for messaging, offers, reports, reviews, seller applications, and suspicious pickup attempts |
| Runtime error behavior | Controlled HTML-response and route-safety coverage | Convert stale log noise into actionable monitoring and ensure production error correlation is retained without exposing sensitive payloads |

## 5. Validation status

The current validation baseline is green. The project passed TypeScript checking, 76 Vitest tests across 27 test files, and 19 Chromium browser scenarios. The browser suite covers public discovery, catalogue controls, mobile storefront navigation, branded auth forms, protected buyer/seller/admin boundaries, hostile IDs, upload/inventory boundary access, guest checkout behavior, controlled HTML-response regressions, product-detail hierarchy, and accessible button names.

The validation suite is strong for contracts and protected boundaries, but it is not a substitute for a complete live commerce rehearsal. The current database state did not provide an active order ready for pickup during the connected-browser walkthrough. Therefore, the following remain implementation-tested rather than live-transaction-tested in this audit: multi-seller checkout completion, seller status progression, actual cash-on-pickup handoff, pickup-code submission against a real order, dispute resolution on a live order, and administrator resolution of a live operational exception.

## 6. Core-purpose gaps and what is necessary to add

### Priority 0 — Must be closed before a broad public launch

**Operational data and scenario readiness.** The most immediate gap is not necessarily code; it is the ability to perform a repeatable, authorized, end-to-end launch rehearsal with approved buyer, seller, and administrator accounts, real-but-controlled listings, and a complete order lifecycle. A launch runbook should cover registration, login, seller verification, store approval, listing publication, buyer checkout, seller processing, ready-for-pickup notification, pickup-code handoff, completion, review, dispute, and administrator audit review. If production policy forbids test data, use a separate staging dataset with the same schema and workflows.

**Email and notification delivery.** Registration, password recovery, seller approval, order status, pickup readiness, offer, message, review, and dispute notifications are central to marketplace trust. The current sender restriction means normal-recipient email behavior is not fully launch-ready. The required addition is an authorized sending domain or a clearly documented launch policy that treats in-app notifications as primary until email delivery is operationally verified. Delivery failures, retries, suppression, and template versioning should be visible to administrators.

**Dispute and cancellation policy.** The product has dispute and cancellation surfaces, but the business policy needs to be explicit: what qualifies as non-delivery before pickup, what qualifies as hidden defect after a confirmed handoff, how long a buyer may report a problem, how sellers respond, what evidence is required, what an administrator may decide, and what “refund” means under cash on pickup. The system must not imply automated refund or escrow behavior that does not exist.

**Administrator operational runbooks.** Admin pages exist, but launch requires documented operating procedures for seller verification, store suspension, listing moderation, safety reports, disputes, review removal, user deactivation, pickup-code lockout, and incident response. Each procedure should state the required evidence, allowed decision, audit requirement, and customer communication.

### Priority 1 — Important for a reliable core marketplace

**Seller listing quality and moderation workflow.** The listing system supports drafts, active states, categories, prices, conditions, inventory, images, and moderation. The next core improvement should be a clear listing-quality gate: required primary image, accurate location, condition disclosure, product category, quantity, fulfillment information, prohibited-item checks, and visible moderation reason. This directly affects buyer trust and reduces administrator workload.

**Buyer order communication and pickup coordination.** The buyer and seller can message, but the core pickup operation would benefit from a structured order conversation or pickup coordination record: agreed campus location, pickup availability note, contact expectations, and visible “ready” instructions. This should remain participant-scoped and should not collect GPS or personal data without a clear privacy policy.

**Order operations and exception handling.** Seller order filters and bulk updates are useful, but sellers and administrators need clearer exception states for stock discrepancy, buyer no-show, seller no-show, pickup-code lockout, cancelled reservation, and disputed handoff. These should be represented by explicit policy and audit outcomes rather than free-form status changes.

**Inventory and listing consistency.** Inventory reservation is strong. The next step is operational reconciliation: expose reserved versus available stock clearly to sellers, warn on expired reservations, prevent contradictory listing states, and give administrators a safe reconciliation report for listings, inventory, reservations, and completed orders.

**Content and identity quality.** The live data includes several seller names, descriptions, phone numbers, and locations entered with inconsistent spelling or low-quality text. A production marketplace needs seller-facing validation, administrator correction tools, duplicate-store review, consistent campus location vocabulary, and content guidance. Trust is affected as much by accurate seller presentation as by cryptographic controls.

**Accessibility and responsive depth.** The current shell and mobile states are thoughtfully designed, and the browser suite checks accessible names. A full core audit should still add keyboard and screen-reader review for dialogs, forms, select controls, file inputs, error summaries, seller verification, admin moderation, order filters, and pickup-code entry. Mobile audit should cover long order history, checkout errors, evidence upload, and dense admin tables rather than only top-of-page states.

### Priority 2 — Valuable after the core operation is stable

**Search quality and marketplace growth.** Search currently supports text, category, price, condition, verification, sorting, suggestions, and pagination. Future work could improve relevance, synonym handling, zero-result recovery, seller ranking fairness, saved searches, and category landing pages. These improve discovery but should follow operational trust work.

**Seller performance coaching.** Analytics already provide seller-scoped performance. Add trend comparison, actionable recommendations, fulfillment SLA visibility, stock turnover, and buyer-interest conversion only when the underlying data definitions are agreed and documented.

**Administrator analytics history.** Current analytics are live projections. Historical snapshots, cohort trends, cancellation rates, pickup completion rates, dispute rates, and seller activation funnels would improve strategic decision-making. They are useful after the event definitions are stable.

**Support operations.** A structured support case model, internal admin notes, participant-visible case status, response deadlines, and escalation history would reduce dependence on informal messages and make disputes auditable.

**Seller payout and escrow.** This is intentionally not a current gap in the narrow cash-on-pickup launch model. It becomes a major future workstream only if the business adds online payment, seller balances, settlement timing, refunds, chargeback handling, reconciliation, and compliance controls. The deferred QR and settlement concepts should remain in the roadmap, not be represented as current capabilities.

## 7. Items intentionally deferred from current core work

The following ideas from the supplied roadmap notes are valuable but should remain deferred until the core operation is stable and the business policy is approved:

| Deferred idea | Why it is useful later | Why it is not current priority |
| --- | --- | --- |
| Buyer/seller QR pickup option | Speeds up handoff while preserving the existing code verification contract | Numeric code handoff is already implemented; QR adds convenience, expiry/token design, camera UX, and more test surface |
| Administrator pickup-code exception review | Helps recover from dead phones, lost codes, or exceptional handoff evidence | It introduces high-risk force-completion authority and must be backed by strict policy, evidence, and audit rules |
| Post-completion dispute window | Makes hidden-defect and fraud handling more predictable | The current cash-on-pickup model has no automated escrow or seller payout ledger, so a settlement state would be misleading without payment infrastructure |
| Automated settlement and refunds | Enables professional marketplace financial operations | Requires a real payment/escrow provider, payout ledger, reconciliation, compliance, and background job reliability |
| GPS or transfer-photo evidence | Could help difficult disputes | Requires privacy, consent, storage retention, access control, and evidence standards; it should not be collected casually |

## 8. Recommended next sequence

The recommended next sequence is operational rather than feature-heavy. First, freeze the current core behavior and create a staging launch rehearsal with an approved seller, buyer, and administrator. Second, complete the email/notification delivery decision and verify all critical message events. Third, finalize written marketplace policies for seller verification, prohibited items, pickup, cancellations, disputes, and cash handling. Fourth, run a full transaction rehearsal and fix every observed gap in loading, empty, error, retry, authorization, and audit states. Fifth, add seller listing-quality controls and structured pickup exception states. Sixth, strengthen support, reconciliation, and monitoring. Only after those steps should QR, administrator override, or online settlement be reconsidered.

| Sequence | Deliverable | Success measure |
| --- | --- | --- |
| 1 | Staging launch rehearsal and role-specific runbook | A buyer, seller, and admin can complete and document one full order lifecycle |
| 2 | Verified notification delivery policy | Critical in-app and email events have known delivery status and recovery behavior |
| 3 | Explicit marketplace policies | Buyers, sellers, and admins see consistent pickup, cancellation, dispute, and evidence rules |
| 4 | Listing-quality and inventory reconciliation controls | Buyers see clearer listings and sellers/admins can explain every stock state |
| 5 | Support and exception operations | No critical order issue depends on an undocumented manual workaround |
| 6 | Advanced roadmap review | QR and settlement are evaluated against measured launch needs, not added speculatively |

## 9. Final status statement

ESUT Marketplace currently has a credible core foundation for a university community marketplace. Its strongest evidence is not the number of screens; it is the combination of real database records, role-scoped server procedures, concurrency-aware order handling, seller verification, buyer/seller workflows, administrator governance, audit records, and a tested two-party pickup completion mechanism.

The project is best described as **feature-rich and structurally prepared for controlled launch, but still requiring operational hardening and policy completion before claiming full production maturity at scale**. The next objective should be to make the existing core flows repeatable, observable, supportable, and policy-complete. Optional QR, administrator override, and settlement ideas should remain preserved in the roadmap vault and should not displace those foundational launch tasks.

## References and evidence sources

[1]: `/home/ubuntu/esut-marketplace/drizzle/schema.ts` — Current Drizzle database schema.

[2]: `/home/ubuntu/esut-marketplace/server/routers.ts` — Current tRPC authentication, marketplace, buyer, seller, order, moderator, administrator, messaging, offer, notification, and analytics procedures.

[3]: `/home/ubuntu/esut-marketplace/server/orderLifecycle.ts` — Shared order transition policy.

[4]: `/home/ubuntu/esut-marketplace/server/pickupCode.ts` — Pickup-code encryption, generation, decryption, and comparison helpers.

[5]: `/home/ubuntu/esut-marketplace/client/src/App.tsx` — Registered application routes.

[6]: `/home/ubuntu/esut-marketplace/client/src/pages/OrderPages.tsx` — Buyer, seller, and administrator order pages.

[7]: `/home/ubuntu/esut-marketplace/client/src/pages/AdminSuitePages.tsx` — Administrator governance and drill-down pages.

[8]: `/home/ubuntu/esut-marketplace/e2e/smoke.spec.ts` — Chromium browser regression suite.

[9]: `/home/ubuntu/esut-marketplace/AUDIT_EVIDENCE_NOTES.md` — Connected-browser audit observations for public, buyer, seller, and administrator previews.

[10]: `/home/ubuntu/esut-marketplace/BUYER_SELLER_CHECKOUT_PICKUP_FLOW_REPORT.md` — Buyer-to-seller operational flow report.

[11]: `/home/ubuntu/esut-marketplace/SELLER_ADMIN_CHECKOUT_PICKUP_FLOW_REPORT.md` — Seller-to-administrator oversight flow report.

[12]: `/home/ubuntu/esut-marketplace/PLAN_PASTED_CONTENT_3_MARKETPLACE_SAFETY.md` — Deferred QR, exception-review, and settlement roadmap plan; not implemented as part of this audit.
