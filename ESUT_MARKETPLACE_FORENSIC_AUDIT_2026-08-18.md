# ESUT Marketplace Forensic System and Codebase Audit

**Prepared by:** Manus AI  
**Audit date:** 18 August 2026  
**Scope:** Public storefront, buyer, seller, moderator, administrator, database, storage, authentication, notifications, tests, operational workflows, and deployed data state.  
**Change policy:** This audit did **not** alter marketplace feature behavior, activate the reminder scheduler, seed data, publish the site, or change production records.

> **Executive conclusion.** ESUT Marketplace is a substantial full-stack campus-commerce application rather than a static prototype. Its core moderated listing, inventory reservation, cash-on-pickup, seller verification, protected media, buyer/seller dual-role, and administrator audit foundations are present and largely server-enforced. The most important pre-release work is not a rebuild: it is dependency remediation, operational automation for expiring inventory reservations, notification-delivery truthfulness, audit completeness for sensitive actions, and broader end-to-end coverage using real role-specific accounts.

## 1. Audit Method and Evidence Standard

The assessment used static contract tracing, schema review, route mapping, live preview review, read-only database inspection, unauthenticated boundary checks, and the project’s automated test suite. A feature is marked **Implemented** only where both interface and server contract were located. A feature is **Partial** when policy or data wiring exists but a material lifecycle, operational, or user-experience element remains incomplete. A feature is **Not demonstrable with current data** when source code exists but the production database contains no records necessary to exercise it.

| Evidence source | Result | Interpretation |
|---|---:|---|
| TypeScript validation | Passed | The current project compiled without TypeScript errors during this audit. |
| Automated suite | 32 files, 100 tests passed | High-value coverage exists for authorization, order lifecycle, pickup codes, checkout policies, listing moderation, reminders, reviews, recovery, and API fallbacks. |
| Unauthenticated admin check | `403` | Representative administrator procedure rejected a request without a session. |
| Unauthenticated buyer-order check | `401` | Representative buyer-order procedure rejected a request without a session. |
| Public marketplace check | `200` | Representative public marketplace procedure remained accessible without a session. |
| Production dependency audit | 1 critical, 21 high, 49 moderate, 10 low findings | Release-risk finding requiring a controlled dependency upgrade programme. |

The primary implementation evidence is the router contract in `server/routers.ts`, schema in `drizzle/schema.ts`, route registry in `client/src/App.tsx`, authorization middleware in `server/_core/trpc.ts`, session handling in `server/_core/sdk.ts`, protected storage proxy in `server/_core/storageProxy.ts`, and the current Vitest suite under `server/` and `client/src/`.

## 2. Current Platform Snapshot

The database is intentionally small but structurally representative. It contains 11 users, 6 active stores, 11 listings, 8 listing images, 1 pending evidence video, 11 inventory rows, 5 orders, 6 order lines, 19 notifications, and 39 audit-log records. It has no offers, conversations, messages, reviews, product reminders, reports, or disputes. Therefore, those latter features are supported by code but cannot be truthfully demonstrated in the current live data without creating legitimate records.

| Domain | Current data state | Audit implication |
|---|---|---|
| Accounts | 5 customers, 5 sellers, 1 super administrator | Role model exists and administrator access is limited in current data. |
| Stores | 6 active stores | Public shop discovery and seller-store ownership can be inspected. |
| Listings | 6 active, 4 draft, 1 pending review | The complete seller-to-admin moderation lifecycle is represented. |
| Evidence video | 1 pending | The administrator review queue has a real pending item. |
| Orders | 2 pending, 3 cancelled; all unpaid | Campus pickup / cash-on-pickup policy is reflected, but completed pickup and review issuance are not live-data demonstrable. |
| Engagement | No offers, messages, reviews, reminders, reports, or disputes | Treat UI empty states as expected data conditions, not evidence that the corresponding feature is absent. |

## 3. Architecture Assessment

The application is a React 19 and Tailwind client over Express/tRPC and Drizzle/MySQL-compatible persistence. Public procedures use `publicProcedure`; signed-in actions use `protectedProcedure`; seller, moderator, and administrator paths add role middleware. The core business rules are not delegated to the client: cart stock checks, checkout reservations, order transitions, pickup-code checks, seller ownership, media moderation, and listing activation occur in server procedures.

| Layer | Implemented architecture | Assessment |
|---|---|---|
| Client | Wouter route registry with public, account, seller, moderator, and administrator routes | **Implemented.** A single route registry provides clear reachability, although some large page files are becoming difficult to maintain. |
| API | tRPC router with Zod validation and SuperJSON | **Implemented.** Server contracts consistently enforce input shapes and role checks. |
| Authorization | Protected, seller, moderator, and admin middleware | **Implemented.** Authentication is checked centrally and inactive accounts are rejected before protected procedures run. |
| Persistence | Drizzle schema with orders, reservation rows, media evidence, audit logs, notifications, review history, and reversible actions | **Implemented.** The schema is strong for marketplace lifecycle integrity. |
| Object storage | Forge-backed proxy with route-level private-media rules | **Implemented.** Unapproved listing evidence is restricted to its seller or administrators; verification evidence is administrator-only. |
| Scheduling | Authenticated reminder callback and a production-only administrator schedule-setup procedure | **Partial by design.** Code is present; activation is deferred until publication, per the explicit current instruction. |
| Email | Resend delivery function plus setting/template storage | **Partial.** Only Resend is functional; UI/provider settings imply more capability than the adapter layer actually provides. |

## 4. Public Marketplace Assessment

The public marketplace provides home, explore/category, search suggestions, store, product, cart, checkout, authentication, password recovery, and account-entry routes. Public listing queries filter for active listings and active stores, and buyer-facing availability derives from inventory minus reserved quantity rather than client state. This is the correct foundation for truthful stock messaging.

| Capability | Status | Evidence and finding |
|---|---|---|
| Browse, home, category, search | **Implemented** | Public market procedures and routes are present; public procedure check returned `200`. |
| Product availability | **Implemented** | Server derives `IN_STOCK`, `LOW_STOCK`, `AWAITING_STOCK`, and unavailable presentation from inventory and listing/store state. |
| Cart entry | **Implemented** | Cart add and quantity updates validate active listing/store and available inventory server-side. |
| Guest cart | **Implemented** | Client-side guest-cart utilities are covered by tests and migrate into the authenticated flow. |
| Shop reviews | **Implemented, data-empty** | Public review projections use privacy-safe reviewer labels and support most-recent/highest-rated sorting. There are currently no review rows to render. |
| Reviews as discovery/repurchase context | **Implemented, data-empty** | Reviewed-product context, availability, reminder, similar-product, and active-listing buy-again paths exist. |
| Public trust claims | **Needs governance** | Store verification and moderated listing evidence exist, but launch copy must avoid implying institution-wide guarantees, payment protection, or real-time availability beyond current server state. |

### Public-flow strengths

The public presentation correctly prevents buyer purchase actions for zero-available inventory. It does not expose drafts, pending listings, or unapproved evidence. Public review identity is reduced to a display-safe first name plus initial, rather than raw buyer email or full internal profile data.

### Public-flow gaps

Search and listing pages rely on current active data and are not yet accompanied by a measured relevance, indexing, or search-abuse strategy. There is no demonstrated seller-message, review, or offer dataset, so public empty states are honest but launch readiness for engagement features remains unproven.

## 5. Buyer and Checkout Assessment

The buyer flow is the most mature transactional area. Cart writes validate current stock. Checkout groups cart lines by store, creates idempotent order batches, increments `reservedQuantity` using guarded database updates, writes order/reservation/history rows in a transaction, and notifies each seller. The buyer receives a pickup code only at the appropriate lifecycle stage; the seller completes the handoff only with the matching code.

| Buyer function | Status | Integrity assessment |
|---|---|---|
| Registration, login, logout, password reset/change | **Implemented** | Dedicated route and server coverage are present. Email verification is currently intentionally disabled by prior product decision. |
| Cart and saved-for-later | **Implemented** | Ownership is tied to the current cart; restore checks available stock. |
| Checkout | **Implemented** | Per-store orders, idempotency key, guarded inventory reservation, snapshots, audit record, and seller notifications are all present. |
| Payment | **Intentional policy constraint** | Only cash on pickup is supported. This is not a missing card-payment integration. |
| Buyer order history/detail | **Implemented** | Buyer ownership is enforced and pickup code is redacted except through the appropriate buyer path. |
| Pickup coordination | **Implemented** | Seller sets location/instructions; buyer acknowledges; buyer or seller can escalate an exception. |
| Secure handoff | **Implemented** | Seller code confirmation requires a ready order, exact six-digit code, five-attempt lockout, encrypted stored code, and a one-time completion transition. |
| Favorites, reminders, notifications | **Implemented, reminder delivery paused** | Buyer-owned reminder management exists. Automatic reminder delivery is not enabled until the site is published, as explicitly requested. |
| Offers, messages, verified reviews, support | **Implemented, data-empty** | Ownership and purchase-eligibility contracts exist, but no live records currently exercise the workflows. |

### Buyer risks and constraints

The main integrity gap is **reservation expiry automation**. `checkout.expireReservations` exists as an administrator mutation, but no active scheduled process currently invokes it. Pending orders therefore rely on administrator action rather than a durable automatic expiration loop. This can retain reserved inventory beyond the intended two-hour reservation window.

Email verification is deliberately disabled, which improves frictionless onboarding but weakens account-ownership assurance. This is a current product policy choice, not an accidental code defect; before broader public release it should be reassessed with a staged verification strategy.

## 6. Seller Assessment

Seller onboarding is deliberately separated into identity/business verification, administrator review, store application, store activation, and verified-seller tools. The seller path also preserves the requested dual-role design: a seller can continue to behave as a buyer under the same account.

| Seller function | Status | Assessment |
|---|---|---|
| Individual/business verification | **Implemented** | Input requirements vary by seller type; evidence is stored privately; attempt history and administrator notes are retained. |
| Store application | **Implemented** | Requires the corresponding approved verification type and creates a reviewable history. |
| Store activation | **Implemented** | Administrator approval creates/activates store and changes account role to `SELLER`. |
| Product drafts and inventory | **Implemented** | Only active verified stores create products; stock cannot be reduced below reserved quantity. |
| Images | **Implemented** | Seller ownership, six-image cap, ordering, primary image and storage write path are enforced. |
| Evidence video and moderation | **Implemented** | Seller uploads bounded supported media; must provide image, positive stock, and pending evidence to submit for review. |
| Listing publication | **Implemented** | Seller cannot self-publish. Administrator approval of pending evidence changes listing to active; rejection returns it to draft. |
| Orders and pickup | **Implemented** | Seller ownership controls filter lists, detail, transitions, instructions, and pickup-code confirmation. |
| Seller analytics | **Implemented** | Dashboard aggregates actual seller order, listing, stock, offer, and view counts. |

### Seller workflow observations

The seller evidence route now uses a dedicated formal submission page. It displays upload state, requirement checks, submission handoff, pending-review status, administrator note, and published state. This directly addresses the earlier missing-submit-action problem.

The server validates video MIME type and encoded size before storage use, but it does **not** currently inspect actual media duration. The product copy says “short” evidence video; the system enforces a 10 MB upload cap rather than a duration limit. That is an honest but incomplete technical implementation of the product policy.

## 7. Administrator and Moderator Assessment

Administrative functionality is broad: dashboard metrics, users, stores, listings, categories, orders, disputes, reports, reviews, notifications, audit logs, email templates, notification settings, analytics, and reversible moderation actions. Moderator functionality covers reports, listings, and reviews with a narrower role boundary.

| Administrator function | Status | Assessment |
|---|---|---|
| Listing evidence queue | **Implemented** | Defaults to `PENDING_REVIEW`; exposes protected evidence URL, approve/publish, return-to-draft, status controls, and seller decision notification. |
| Seller verification and applications | **Implemented** | Evidence URL is protected; review records, reviewer attribution, notes, and history exist. |
| Store/listing/user moderation | **Implemented** | Owner notification and reversible-action ledger exist for selected statuses. |
| Order and dispute operations | **Implemented** | Administrator can inspect/transition orders and resolve disputes. |
| Audit logs and recovery | **Implemented** | Filtered audit log and bounded undo/redo exist; recovery preserves a separate audit chain. |
| Analytics | **Implemented** | Seven-day trend, order lifecycle, pickup ageing, seller performance, low-stock, trust/safety metrics are server-derived. |
| Reminder health | **Implemented, inactive operation** | Health shows active/overdue/triggered/unavailable counts and configured state; scheduler is not configured until publication. |
| Admin route fidelity | **Partial** | `/admin/verifications` points to the general admin overview rather than a dedicated verification queue route. It is not an access-control break, but route intent and navigation are inconsistent. |

### Administrator audit-completeness gap

`reviewVerification` updates verification request, profile, and applicant notification, but unlike most sensitive administrator operations does not insert an `auditLogs` record. Seller-application approval does write audit events. Verification approval/rejection should receive the same immutable administrator-action record before launch.

## 8. Security, Privacy, and Authorization Assessment

The codebase has several strong controls. The session SDK rejects inactive users. Middleware separates public, signed-in, seller, moderator, and administrator capability levels. Representative live no-cookie requests produced `403` for administrator data and `401` for buyer order data. Private storage paths apply role and ownership checks before a signed redirect is issued. Pickup codes are encrypted, only surfaced to the buyer in the correct lifecycle state, and invalid-entry attempts are capped.

| Control | Status | Finding |
|---|---|---|
| Role enforcement | **Strong** | `protectedProcedure`, `sellerProcedure`, `moderatorProcedure`, and `adminProcedure` enforce server-side roles. |
| Inactive-account enforcement | **Strong** | Session resolution rejects inactive users before context creation. |
| Ownership / IDOR | **Strong in reviewed paths** | Cart, buyer order, seller order, seller product, evidence upload, pickup exception, and user-scoped notification paths use current-user ownership predicates. |
| Private verification files | **Strong** | Proxy permits only active `ADMIN`/`SUPER_ADMIN`. |
| Pending listing evidence | **Strong** | Proxy permits the owning seller or administrator before approval; approved evidence becomes buyer-accessible only as part of public listing context. |
| Error disclosure | **Improved** | tRPC formatter removes stack trace from error payload. |
| Pickup-code security | **Strong** | Encrypted-at-rest code, life-cycle gate, one-time use, and failed-attempt ceiling are implemented. |
| Dependency hygiene | **Release blocker** | Production dependency audit reports 1 critical, 21 high, 49 moderate, and 10 low advisories. |

### Dependency findings requiring action

The critical finding is `fast-xml-parser` affected from version 5.0.0 through 5.3.4; the audit recommends 5.3.5 or newer and reports CVSS 9.3 for CVE-2026-25896. Direct `axios@1.12.2` also has multiple high findings with patched versions at 1.16.0 or later. The dependency tree includes vulnerable `dompurify` and `mermaid` through `streamdown`. These issues are separate from application correctness: **the application tests pass, but this dependency posture is not suitable for a public production release until remediated and regression-tested.**

### Privacy and trust gaps

Public review display is privacy-safe. However, seller-facing and administrator-facing review lists retain fuller buyer identity as a business operations choice. This should be documented in the privacy notice and retained only where necessary for order/service handling.

There is no demonstrated data-retention, account-deletion, or storage-cleanup workflow. Listing image replacement and evidence replacement can leave old object keys behind unless the underlying storage service applies retention controls. This is a medium-priority privacy/operational concern, not an observed data leak.

## 9. Notifications and Email Assessment

In-app notifications are materially implemented: seller verification/application updates, new orders, pickup instructions, listing moderation, review moderation, disputes, reminders, and related links are persisted in the `notifications` table. Buyer notifications provide read/unread filtering and mark-read controls. Listing-evidence decisions create seller-owned notifications with listing context and without protected media metadata.

External delivery is less mature. `sendTransactionalEmail` actually sends through Resend when configured. `SENDGRID` and `SMTP` selections only log a warning and return `delivered: false`. The saved notification-channel booleans (`orderUpdates`, `sellerApplications`, `offerUpdates`, and `reviews`) are not consulted by the send function. Therefore, the settings panel should be treated as **configuration scaffolding**, not proof that every selected event or provider will deliver email.

| Notification channel | Actual status | Required remediation |
|---|---|---|
| In-app notifications | Implemented | Add delivery telemetry and optional notification preferences as usage grows. |
| Resend | Implemented for explicit call sites | Add event routing, delivery logging, retry/observability, and verify sender-domain policy before broad external use. |
| SendGrid / SMTP | Not implemented | Do not present as active selectable providers until real adapters and tests exist. |
| Reminder scheduler | Implemented but inactive | Activation is intentionally deferred until a user explicitly requests publication. |

## 10. Data Integrity and Concurrency Assessment

The order workflow is well designed for a campus pickup marketplace. Checkout creates idempotent order batches and reserves stock with guarded updates in a transaction. Inventory cannot be lowered below reserved quantity. Completion occurs only via valid pickup confirmation, and order-status history and audit records are written around transitions.

| Topic | Assessment | Recommendation |
|---|---|---|
| Checkout idempotency | Strong | Retain UUID key requirement and add client retry telemetry. |
| Stock reservation | Strong | Preserve guarded SQL reservation updates. |
| Reservation release | Partial | Schedule automatic expiration rather than relying on administrator mutation. |
| Order state machine | Strong | Maintain individual pickup-code completion; do not reintroduce bulk completion. |
| Listing moderation | Strong | Preserve evidence-before-activation rule. |
| Review eligibility | Strong | Reviews require completed purchase/order context and duplicate protection. |
| Background work | Partial | Activate scheduler only after publication, then add health alerting for delayed jobs. |
| Reporting | Partial | Reports/disputes exist but zero current records prevent practical load-path validation. |

## 11. Synchronization and UX Assessment

The client generally invalidates relevant tRPC caches after seller, buyer, and administrator mutations. The administrator refresh helper is used after moderation actions, and seller inventory has row-specific loading/success feedback. Responsive verification was performed for public, buyer, seller, and administrator pages during the preceding quality pass.

The remaining UX gaps are primarily operational clarity rather than broken rendering: a dedicated verification queue route is needed; provider settings must not promise unavailable providers; automated reservation expiry must stop being an invisible manual job; and actual data is required to evaluate messages, offers, reviews, reports, disputes, reminder delivery, and seller review-response feedback under normal user load.

## 12. Prioritized Remediation Roadmap

### Priority 0 — Resolve before public release

| Item | Why it matters | Completion condition |
|---|---|---|
| Upgrade and lock vulnerable production dependencies | The dependency scan contains 1 critical and 21 high advisories, including critical `fast-xml-parser` and high `axios` findings. | Update compatible direct/transitive versions, run full tests, run dependency audit again, and document any accepted residual advisories. |
| Make notification settings truthful | Selecting SMTP/SendGrid currently does not send mail; event-toggle booleans are unused. | Hide unsupported providers or implement adapters; enforce event toggles at dispatch; record delivery result safely. |
| Automate reservation expiration | Pending checkout reservations can remain until an administrator triggers expiry. | Add an authenticated scheduled job with idempotent release, monitoring, and failure alerting. |
| Complete sensitive-action auditing | Verification reviews are not represented in audit logs. | Write immutable audit entries for approval/rejection, actor, target, and reason; test it. |

### Priority 1 — Complete before wider campus rollout

| Item | Why it matters | Completion condition |
|---|---|---|
| Publish only when intentionally ready, then activate reminder scheduler | Reminder code is implemented but safely inactive because publication is paused. | User publishes, administrator configures scheduler, first real due reminder is verified once, and health metrics stay clean. |
| Add a dedicated verification queue route | `/admin/verifications` currently returns the overview instead of a purpose-built filtered workspace. | Dedicated page displays pending verification records, evidence, notes, and review actions. |
| Enforce evidence-video duration | “Short video” is a product rule, but only MIME/size are checked. | Server-side metadata inspection or trusted upload validation enforces a documented maximum duration. |
| Expand real-role browser testing | Current data does not exercise several engagement workflows. | Create controlled test accounts/records outside production or use a staging environment for buyer/seller/admin journeys. |
| Make seller response and dispute updates bilateral | Some resolved actions notify only the opening party or omit seller/buyer follow-up. | Define recipient policy per transition, persist in-app notice, and add tests. |

### Priority 2 — Hardening and maintainability

| Item | Why it matters | Completion condition |
|---|---|---|
| Split oversized router and account-feature modules | `server/routers.ts` and `AccountFeaturePages.tsx` concentrate many domains, increasing regression risk. | Extract feature routers/pages while retaining typed contracts and tests. |
| Add retention and storage cleanup policy | Media replacement can leave old storage objects. | Define retention period, delete or archive unreferenced objects, and maintain audit-safe metadata. |
| Add account privacy/lifecycle controls | Public launch should define deletion, deactivation, retention, and export handling. | Approved policy and server-enforced account lifecycle implementation. |
| Add audit logging for settings mutations | Email templates and notification settings are sensitive administrative configuration. | Immutable audit entries with actor and redacted metadata. |
| Add rate-limit / abuse controls | Login, public search, uploads, offers, messages, and reporting will see more traffic at rollout. | Route-level rate limits, upload throttles, abuse metrics, and response policies. |

## 13. Recommended Delivery Sequence

The safest next sequence is: first remediate and test dependencies; second correct notification-provider semantics and sensitive-action audit gaps; third introduce automatic reservation expiry; fourth create a staging or controlled test dataset for complete buyer/seller/admin flows; fifth complete video-duration and queue-route improvements; and only then intentionally publish. After publication, the administrator should enable the reminder scheduler, confirm the callback has the correct authenticated task identity, and verify that one due reminder produces exactly one owner-scoped notification.

No payment gateway is recommended in this immediate sequence because the stated marketplace policy is **campus pickup with cash on pickup**. Likewise, no fabricated reviews, ratings, messages, or seller performance metrics should be added merely to populate interfaces.

## 14. Audit Limitations

This was a forensic implementation audit, not a penetration test, legal privacy assessment, load test, payment-certification review, or accessibility conformance audit. The browser session available during review was administrator-oriented; ordinary buyer and seller accounts were not impersonated or created because the instruction prohibited changes. Engagement features with zero live rows were verified through contracts and automated tests rather than by inventing marketplace activity.

## 15. Final Assessment

ESUT Marketplace has a credible foundation for a moderated university marketplace. The core buying, seller onboarding, moderated publication, inventory reservation, pickup handoff, and administrative control planes are already integrated. The correct next step is focused production hardening, not a wholesale redesign. The dependency audit and background-operation gaps should be treated as launch gates; the empty engagement datasets and reminder scheduler are deployment/readiness conditions, not evidence that their feature contracts do not exist.

### Internal Evidence References

1. `drizzle/schema.ts` — marketplace entities, lifecycle enums, inventory, orders, reservations, reviews, notifications, reminders, audit records, and reversible-action schema.
2. `server/routers.ts` — public, buyer, cart, checkout, seller, moderator, and administrator contracts; validation, ownership, transactions, moderation, notifications, and analytics.
3. `server/_core/trpc.ts` and `server/_core/sdk.ts` — role middleware, session verification, inactive-account enforcement, and scheduler identity handling.
4. `server/_core/storageProxy.ts` — verification and listing-video evidence access control.
5. `server/productReminders.ts` and `server/notifications.ts` — reminder worker, notification persistence, email-provider behavior, and template support.
6. `client/src/App.tsx`, `client/src/pages/AccountFeaturePages.tsx`, `client/src/pages/SellerEvidenceSubmissionPage.tsx`, `client/src/pages/AdminSuitePages.tsx` — route reachability and interface-to-contract wiring.
7. `server/*.test.ts` and `client/src/**/*.test.ts(x)` — 32 passing test files and 100 passing tests at audit time.
8. Read-only database inspection and no-cookie route checks performed on 18 August 2026.
9. `pnpm audit --prod` output from 18 August 2026 — dependency counts and package advisory evidence, including `fast-xml-parser` CVE-2026-25896 recommendation.
