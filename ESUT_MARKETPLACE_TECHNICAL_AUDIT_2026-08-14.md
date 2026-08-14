# ESUT Marketplace Technical and Product Audit

**Audit date:** 14 August 2026  
**Prepared by:** Manus AI  
**Assessment basis:** Current source code, schema, test suite, live development preview, and read-only database activity snapshot.

> **Executive conclusion:** ESUT Marketplace has progressed beyond a visual concept into a credible full-stack marketplace foundation. It now has a branded first-party account flow, role enforcement, a substantial domain schema, searchable catalogue data, authenticated cart and checkout logic, seller verification gates, controlled evidence storage, and administrator trust-review tools. It is **not yet production-ready as a complete marketplace**. The greatest gaps are operational rather than cosmetic: order fulfilment, listing management, messaging, moderation, true general-recipient email delivery, end-to-end test coverage, and race-safe inventory handling remain incomplete.

## 1. Scope and Method

This audit assesses what is demonstrably implemented in the active ESUT Marketplace project. It distinguishes between the **data model** (what the system can represent), the **implemented runtime behavior** (what a user can currently do), and the **planned backlog** (what is still represented only by schema or TODO items). No customer, seller, application, order, verification, or account record was modified for this audit.

The review used the current application routes, server procedures, database schema, local security utilities, notification layer, automated tests, a live preview walkthrough, and a read-only production-database count query.

## 2. Overall Maturity Assessment

| Dimension | Current assessment | Reasoned status |
| --- | --- | --- |
| Product foundation | **Established** | Marketplace navigation, seeded catalogue, product view, cart, checkout, seller application, verification, and administrator review surfaces are present. |
| Core architecture | **Established** | React/Vite frontend, Express/tRPC backend, Drizzle schema, MySQL/TiDB database, managed file storage, and transactional email abstraction are in place. |
| Authentication and roles | **Partially production-ready** | First-party credentials, sessions, lockout, role guards, and seller verification gates exist; email delivery and full authentication journey testing do not. |
| Buyer commerce flow | **Partially implemented** | Catalogue, authenticated cart, inventory checks, grouping by store, and cash-on-pickup order creation are implemented; post-purchase order management is not. |
| Seller operations | **Early operational stage** | Verification and store application approval are implemented; listing, inventory, fulfilment, analytics, and settings tooling are incomplete. |
| Administration and moderation | **Early operational stage** | Seller verification and store-application review work; general marketplace moderation, disputes, reports, users, and order oversight are not exposed as working operations. |
| Communications | **Foundation only** | In-app notification records and a Resend adapter exist. General-recipient email delivery is constrained by sender-domain verification, and SendGrid/SMTP are stubs. |
| Quality assurance | **Foundation only** | Twelve focused automated tests and successful type checking exist; critical end-to-end and transaction/concurrency tests are missing. |
| Release readiness | **Not ready for public launch** | High-priority operational and security-completion work is outstanding. |

## 3. What Has Been Built

### 3.1 Application architecture

The application is a React 19 and Tailwind 4 client paired with an Express/tRPC server. The server uses Drizzle ORM against the configured MySQL/TiDB database. Authentication, API contracts, and database access are co-located in the full-stack project rather than split into a separate public API service. This is a suitable architecture for the current marketplace stage because typed procedures flow from the backend to the client and reduce contract drift.

The route surface currently includes public home, catalogue, product, cart, checkout, login, registration, password recovery, account, seller onboarding, seller dashboard, administrator review, and administrator notification settings routes. The current public preview contains a branded ESUT home page with catalogue navigation, product cards, search, category links, cart entry, account entry, and the **Sell on ESUT** conversion path.

### 3.2 Domain data model

The database schema contains **27 domain tables** spanning identity, security, marketplace, trust, communication, and settings concerns. The tables include user accounts, authentication tokens, rate limits, profiles, seller applications, stores, seller verification requests, categories, listings, listing images, inventory, carts, orders, offers, conversations, notifications, reviews, reports, disputes, audit logs, and marketplace settings.

| Domain | Implemented data structures | Assessment |
| --- | --- | --- |
| Identity and access | `users`, `profiles`, `authTokens`, `authRateLimits` | Strong foundation for credentials, account classification, reset tokens, verification tokens, account lockout, and roles. |
| Seller trust | `sellerApplications`, `verificationRequests`, `stores` | Well aligned with individual versus business seller onboarding and approval before selling. |
| Catalogue | `categories`, `listings`, `listingImages`, `inventory` | Supports a rich catalogue with listing state, condition, price, media ordering, stock, and store ownership. |
| Commerce | `carts`, `cartItems`, `orders`, `orderItems`, `orderStatusHistory` | Supports account carts, per-store orders, price snapshots, campus pickup, and future order state changes. |
| Trust and communications | `offers`, `conversations`, `messages`, `notifications`, `reviews`, `reports`, `disputes`, `auditLogs` | The foundation is present, but most matching runtime procedures and screens are not yet built. |
| Operations | `marketplaceSettings` | Supports administrator-controlled email templates and notification-provider preferences. |

The schema uses indexes and unique constraints in several important places, including unique emails, unique cart lines, unique favorites, unique account profiles, listing slugs, store slugs, order public IDs, and order review eligibility. The data model is therefore ahead of the currently exposed product operations.

### 3.3 Current database activity

The read-only database snapshot shows a development-stage marketplace: **5 users**, **2 profiles**, **5 stores**, **8 categories**, **6 listings**, and **6 inventory records**. There are **0 orders**, **2 seller applications**, **1 verification request**, **5 in-app notifications**, and **1 authentication token**. These values confirm catalogue and trust-flow setup but do not demonstrate completed buyer purchasing or seller fulfilment activity.

## 4. Functional Status by User Journey

### 4.1 Visitor and buyer journey

Visitors can browse the ESUT-branded homepage, explore seeded active listings, use keyword and basic price/condition sorting filters, open a product page, and navigate to account creation or login. Signed-out visitors see prominent **Create Account** and **Log In** actions; signed-in visitors see account navigation and logout instead.

Registered users can add active listings to a database-backed cart, adjust line quantity within stock limits, remove cart lines, and enter the checkout flow. Checkout uses only the required **Campus Pickup** and **Cash on Pickup** methods. The server groups cart lines by store, creates one order per seller, stores price/item snapshots, reduces inventory, and clears the cart only within a database transaction.

The buyer journey remains incomplete after checkout. There is no complete buyer order history, order-detail page, cancellation flow, receipt, pickup confirmation view, favorites screen, messaging workspace, offer workspace, review flow, notification inbox, or dispute workflow available to customers today.

### 4.2 Authentication and account journey

The external sign-in redirect was replaced with branded ESUT Marketplace `/login` and `/register` screens. Registration includes first name, last name, email, phone number, account type, password, password confirmation, and independent password-visibility controls. Login includes password visibility and password recovery entry.

Passwords are processed through a first-party scrypt implementation with a random 16-byte salt and constant-time comparison. The application normalizes email addresses before lookup, creates opaque 32-byte verification/reset tokens, stores only SHA-256 token hashes, and expires tokens after one hour. Login applies a per-account five-failure lockout for fifteen minutes. The API additionally records per-IP-per-endpoint authentication attempts in the database and blocks high-frequency access.

Email verification is deliberately **paused** because the configured Resend sender is currently limited to the account owner. As a temporary product decision, arbitrary email addresses may register and log in immediately. This removes a real onboarding blocker but weakens account-assurance until a verified ESUT sending domain is configured. Password-reset requests remain privacy-preserving in their response, but a reset email cannot be relied upon for ordinary recipients until the sender-domain limitation is resolved.

Existing pre-password accounts can claim a marketplace password using the same email address. The server updates the existing account rather than creating a new account, so role, store ownership, orders, and other relationships remain tied to the same user ID. Automated proof of that preservation scenario is still outstanding.

### 4.3 Individual and business seller journey

The seller path has been deliberately made more restrictive than ordinary account registration. An account holder chooses either **Individual** or **Business / Vendor** at registration and is then shown a seller onboarding checklist at `/sell`.

| Seller classification | Required verification input | Before seller tools unlock |
| --- | --- | --- |
| Individual | ESUT email, registration number, and identity evidence | Administrator must approve identity verification, then approve the store application. |
| Business / Vendor | Business name, business registration number, and business registration evidence | Administrator must approve business verification, then approve the store application. |

Evidence handling accepts PDF, JPEG, and PNG uploads up to 5 MB. It validates file type, validates the supplied data URL, sanitizes filenames, stores the evidence in managed storage, and allows only an administrator procedure to obtain a signed access URL for review. The validation bug that previously sent empty business fields for individual sellers has been replaced by a discriminated request schema; individual and business submissions now send and validate only their relevant fields.

An administrator can approve or reject a verification request. Approval updates the profile verification status and writes an in-app notification. Only an approved verification of the matching type permits store-application submission. A subsequent administrator approval activates and verifies the store, upgrades the account to `SELLER`, and creates a seller-application notification.

The current seller dashboard exposes seller-owned order data and high-level counts, but it does not yet provide listing creation, editing, image management, inventory management, sales fulfilment actions, offer handling, analytics, payouts, or store settings. Most seller tools are therefore not available despite the presence of supporting schema tables.

### 4.4 Administrator and moderator journey

The current administrative panel supports seller verification review, evidence opening through a signed URL, seller-application review, store activation, and selected notification-provider/template settings. Administrator role checks are enforced in the server middleware, not only through client-side visibility.

The system defines a `MODERATOR` role, but no material moderator-only workflow is currently exposed. Administrator functionality is still substantially narrower than the intended platform scope: no working customer/vendor account monitoring, listing moderation, user suspension tools, report queue, dispute queue, order management, review moderation, audit-log viewer, or database-backed marketplace KPI dashboard is present.

## 5. Security and Operational Assessment

### 5.1 Strengths

| Control | Current implementation | Audit assessment |
| --- | --- | --- |
| Role-based access control | Server-side `protected`, seller, moderator, and administrator procedure guards | Correct architectural direction; direct client-route access does not replace server authorization. |
| Password storage | Salted scrypt hash and timing-safe verification | Sound baseline for password handling. |
| Session handling | Server issues and clears HTTP-only session cookies through the project session SDK | Appropriate foundation; session expiry and revocation policy should be explicitly reviewed before launch. |
| Login abuse controls | Account lockout plus database-backed procedure rate limiting | Useful defense in depth for a first-party authentication flow. |
| Reset/verification tokens | Opaque tokens, stored as hashes, single-use, one-hour expiration | Good token lifecycle pattern. |
| Seller verification gate | Seller application requires matching approved verification; selected sensitive seller procedure checks profile approval | Strong anti-fraud business rule foundation. |
| Evidence privacy | Managed storage plus administrator-only signed evidence retrieval | Better than exposing verification documents through public listing storage. |
| Checkout calculations | Server-side totals, active-listing check, stock check, item snapshots, transaction wrapper | Correct separation from untrusted client prices. |

### 5.2 Risks requiring attention

| Priority | Risk | Why it matters | Recommended remediation |
| --- | --- | --- | --- |
| **P0** | General-recipient email delivery is not operational | Password recovery and future verification emails cannot be trusted for ordinary users while the Resend sender is restricted. | Verify an ESUT Marketplace sending domain, set a verified sender identity, test register/verify/reset delivery with disposable normal-recipient accounts, then safely re-enable verification. |
| **P0** | No race-safe stock reservation or conditional inventory decrement | Two buyers can pass the initial stock check before either inventory update commits, risking overselling under concurrent checkout. | Use conditional inventory updates or row locking, reserve inventory during checkout, reject failed decrements, and test concurrent checkout. |
| **P0** | Complete order lifecycle is absent | Orders can be created but buyers, sellers, and administrators cannot reliably manage confirmation, pickup, completion, cancellation, or disputes. | Implement a server-side state transition policy, seller fulfilment actions, buyer history/detail screens, order-status history writes, and admin oversight. |
| **P1** | Verification evidence is transported as Base64 in a tRPC payload | Base64 increases request size and keeps document bytes in server memory before storage. | Replace with direct, authenticated pre-signed uploads or a dedicated constrained upload endpoint; retain server-side metadata validation. |
| **P1** | Authorization and IDOR test coverage is narrow | Procedures are protected in code, but critical ownership paths have not been tested against malicious object IDs. | Add ownership/IDOR tests for cart lines, orders, evidence, store/listing actions, messages, offers, reviews, reports, and disputes. |
| **P1** | Administrator and moderator operations are incomplete | Trust and fraud workflows cannot be operated at marketplace scale. | Build user/store/listing moderation, report and dispute queues, audit-log viewing, order monitoring, and moderator-specific actions. |
| **P1** | Email provider settings can select unimplemented providers | SendGrid and SMTP settings currently return no delivery because they are stubs. | Keep unavailable providers disabled in production UI or implement real adapters with provider-specific credentials, delivery testing, and observability. |
| **P2** | Email address conflict response can disclose registration status | Registration says that an account already exists for the email. | Consider a generic response or a secure claim/recovery path to reduce account enumeration. |
| **P2** | Password policy is minimal | Current validation is primarily a 10-character length threshold. | Add breached-password screening or password-strength policy, optional MFA roadmap, device/session management, and recovery abuse monitoring. |
| **P2** | Schema depth exceeds implemented use cases | Many tables exist without procedures or interfaces, increasing the chance of assuming features are live when they are not. | Manage the roadmap by complete vertical slices: schema + procedure + UI + authorization + tests. |

## 6. Notification and Email Audit

The notification service is correctly separated behind a provider-oriented function. It reads an administrator-controlled provider setting from `marketplaceSettings`; it has a working Resend request path and explicit stubs for SendGrid and SMTP. Seller-application approval can render an administrator-controlled template and attempt delivery.

The current notification design should be regarded as **partially live**. A Resend live test was accepted for the permitted account-owner recipient, but delivery to arbitrary users remains constrained by sender-domain verification. In-app notification records are created for verification and seller-application decisions, but the full notification inbox and all requested event delivery channels are not yet implemented.

## 7. Quality Assurance and Validation Status

The last verified non-network test run passed **12 tests across 6 files**, and TypeScript type checking passed. Current coverage includes logout behavior, role guard behavior, password/token primitives, paused email-verification feature-flag behavior, public account-action visibility rules, and individual/business verification schema behavior.

This is useful regression protection, but it is not enough for a public marketplace launch. The following high-value tests are still absent:

| Test area | Required coverage |
| --- | --- |
| Authentication | Register, existing-account password claim, login lockout, reset-token issuance/expiration/consumption, and verification token flows against a real test database. |
| Checkout | Price calculation, multi-store order splitting, stock decrement, empty cart rejection, failed transaction rollback, and concurrent purchase prevention. |
| Authorization | IDOR attempts and mass-assignment attempts across cart, seller application, verification evidence, orders, listings, messages, offers, reports, disputes, and admin procedures. |
| Seller trust | Evidence submission, admin signed evidence access, approval/rejection, matching verification type enforcement, and store activation after approval. |
| User experience | Desktop/mobile visual regression, keyboard navigation, focus order, accessible labels/errors, loading/error/empty states, and real signed-out/signed-in navigation. |
| Email | Verified-domain delivery test, verification delivery, password recovery delivery, template rendering, and provider failure behavior. |

## 8. Product and User Experience Assessment

The visible storefront has a clear ESUT-branded presentation: a red/green identity, campus-category discovery, search, catalogue cards, price/discount labels, seller/store context, cart entry, and seller recruitment. It is a good early public-facing direction and is materially more convincing than a generic administrative dashboard.

The account and seller onboarding pages now communicate the important trust distinction between ordinary marketplace membership and verified selling. Password visibility controls, confirmation, account classification, seller onboarding progress, and explicit logout improve usability.

The main experience weakness is **continuity**. A buyer can discover and start an order, but cannot yet manage the resulting order. A seller can become verified and approved, but cannot yet manage listings or fulfil orders. An administrator can approve seller trust signals, but cannot manage the wider marketplace safety system. Completing these sequences should take priority over adding more standalone screens.

## 9. Recommended Delivery Roadmap

### Release Gate 1 — Core transaction safety

First make the current flows safe and operable. Verify the Resend sending domain, restore email verification only after end-to-end email tests pass, harden inventory decrements against concurrent checkout, implement buyer order history and seller order fulfilment/status transitions, and add administrator order visibility. No public launch should occur before these items are complete.

### Release Gate 2 — Seller operations and trust completion

Build verified-seller listing creation, editing, image upload, inventory management, listing review, and seller analytics. Replace Base64 evidence submission with direct authenticated uploads. Add report, dispute, review, and moderation workflows with immutable audit events for sensitive actions.

### Release Gate 3 — Communication and account maturity

Complete in-app notification inboxes, buyer/seller messaging, offers, notification preferences, verified email delivery, password recovery verification, real SendGrid/SMTP adapters only if needed, and an account/session security review. Add administrator views for activity, user safety, store performance, and moderation queues.

### Release Gate 4 — Quality and operational readiness

Add end-to-end and concurrency test coverage, mobile/accessibility validation, error/empty/loading state review, monitoring and alerting, backup/retention policy, security review, deployment checklist, and a pre-launch moderation playbook.

## 10. Immediate Recommended Next Five Tasks

| Order | Task | Business value |
| --- | --- | --- |
| 1 | Verify an ESUT Marketplace Resend domain and test ordinary-recipient verification/recovery email delivery | Restores credible account recovery and verification. |
| 2 | Build order history, seller fulfilment actions, and an explicit state-transition policy | Turns checkout from a record-creation flow into usable commerce. |
| 3 | Add concurrency-safe inventory reservation/decrement plus checkout tests | Prevents overselling and monetary reconciliation problems. |
| 4 | Build verified-seller listing and image management | Lets approved sellers actually operate a store. |
| 5 | Expand authorization, IDOR, and end-to-end test coverage | Reduces the likelihood of privacy, role, and transaction defects as the product grows. |

## 11. Final Assessment

ESUT Marketplace has a credible, security-aware foundation and a useful start on its central trust proposition: **a campus marketplace where sellers are verified before sensitive selling functions unlock**. The project also has a strong conceptual schema and a coherent technical stack.

The next work should focus on **closing the operational loops already started**, rather than expanding the schema or adding disconnected dashboard modules. Priority should be given to transaction safety, end-to-end order handling, actual seller inventory/listing operations, general-recipient email reliability, moderation, and robust automated verification. With those completed and tested, the platform can progress from a capable development preview to a genuinely launchable Nigerian university marketplace.

---

## Audit Evidence

| Evidence item | Reviewed source |
| --- | --- |
| Marketplace data model | `drizzle/schema.ts` |
| Runtime API, checkout, roles, seller verification, admin flows | `server/routers.ts` |
| Password and token primitives | `server/localAuth.ts` |
| Role middleware | `server/_core/trpc.ts` |
| Email/provider layer | `server/notifications.ts` |
| Application routes | `client/src/App.tsx` |
| Delivery and test backlog | `todo.md` |
| Runtime sample data snapshot | Read-only aggregate database query executed 14 August 2026 |

