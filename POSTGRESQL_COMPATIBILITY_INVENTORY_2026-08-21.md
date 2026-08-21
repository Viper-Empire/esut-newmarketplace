# ESUT Marketplace — PostgreSQL Compatibility Inventory

**Status:** Phase 1 read-only assessment complete.  
**Assessment date:** 21 August 2026.  
**Live system posture:** The MySQL/TiDB-compatible database remains the only authoritative data source. No schema, source code, provider configuration, credentials, deployment configuration, or marketplace data was changed during this assessment.

## Purpose and Scope

This inventory records the current relational model and PostgreSQL compatibility work required before any database-engine migration begins. It is based on the current Drizzle schema, the live database metadata/row-count audit, and the database-access modules that implement authentication, commerce, seller operations, safety, notifications, and operational workflows.[1] [2]

> **Key conclusion:** ESUT Marketplace is suitable for a staged migration to PostgreSQL, but it is not a connection-string change. The schema, Drizzle dialect, insert-return handling, upsert syntax, timestamp update behavior, transaction result interpretation, migrations, tests, source data, and restoration process must be adapted and rehearsed in a separate non-production environment.

## Live Relational Baseline

The live database reports **43 tables**, consisting of the Drizzle migration ledger plus **42 marketplace application tables**. All reported application tables use InnoDB. The live database also contains **43 primary keys**, **27 unique constraints**, and **44 foreign keys**. The foreign-key model must be preserved in PostgreSQL; it is an active integrity control rather than an optional application convention.[1]

| Domain | Tables | Current rows at assessment | PostgreSQL migration significance |
|---|---:|---:|---|
| Identity and security | 7 | 49 | Contains accounts, password/email tokens, sessions, lockout state, and security events. Password hashes and session hashes must remain opaque and unchanged. |
| Profile and seller trust | 7 | 34 | Contains user profile, seller application/attempt, store, and verification history. Review/approval actor references must remain valid. |
| Catalogue and inventory | 6 | 59 | Contains categories, listings, images, video evidence metadata, stock, and reservations. Inventory integrity is migration-critical. |
| Buyer cart and reminders | 5 | 37 | Contains carts, cart lines, favorites, reminders, and order batch idempotency records. |
| Orders and pickup | 5 | 82 | Contains orders, items, history, pickup coordination, and reservation links. Public order IDs must not change. |
| Offers, messages, notifications, events | 6 | 128 | Contains buyer/seller interactions and event refresh records; timestamps and ownership references must remain intact. |
| Reviews, cases, safety, and audit | 8 | 128 | Contains reviews, reports, disputes, private evidence metadata, immutable activity, audits, and reversible actions. |
| Marketplace configuration and telemetry | 2 | 14 | Contains settings and privacy-minimized operational events. |
| **Total application records** | **42 tables** | **531** | Exact source counts captured for later staging/import reconciliation. |

The total above excludes `__drizzle_migrations`, which is a framework migration ledger and must be handled separately when the PostgreSQL migration history is designed. It is not customer or marketplace business data.

## Exact Source Row-Count Manifest

The following exact counts are an initial source manifest. The same counts must be captured again at the final export/cutover point, because the controlled-launch database can continue receiving authorized writes until a maintenance window starts. Row counts alone do not prove content equality; the rehearsal must also validate keys, relationships, order totals, quantities, state distributions, and selected non-sensitive checksums.

| Table | Source count | Table | Source count |
|---|---:|---|---:|
| `users` | 15 | `profiles` | 12 |
| `authTokens` | 1 | `authRateLimits` | 16 |
| `authSessions` | 1 | `accountSecurityEvents` | 2 |
| `sellerApplications` | 4 | `sellerApplicationAttempts` | 2 |
| `verificationRequests` | 4 | `sellerVerificationAttempts` | 1 |
| `stores` | 7 | `categories` | 8 |
| `listings` | 13 | `listingImages` | 11 |
| `listingVideoEvidence` | 1 | `inventory` | 13 |
| `inventoryReservations` | 13 | `orderBatches` | 10 |
| `carts` | 12 | `cartItems` | 2 |
| `favorites` | 6 | `productReminders` | 4 |
| `orders` | 12 | `orderItems` | 13 |
| `orderStatusHistory` | 39 | `pickupCoordinations` | 5 |
| `offers` | 2 | `conversations` | 5 |
| `conversationParticipants` | 10 | `messages` | 20 |
| `notifications` | 91 | `marketplaceEvents` | 0 |
| `operationalEvents` | 11 | `reviews` | 2 |
| `reviewMedia` | 0 | `reports` | 1 |
| `disputes` | 0 | `caseEvidence` | 0 |
| `caseActivity` | 0 | `auditLogs` | 114 |
| `adminReversibleActions` | 0 | `marketplaceSettings` | 3 |

## Current Referential-Integrity Model

The live database has 44 foreign-key constraints. These must be recreated in PostgreSQL with the same business meaning and a deliberate decision on delete/update rules. No cascade behavior should be introduced casually, especially for orders, evidence, audits, reviews, security records, or seller decisions.

| Relationship group | Live foreign-key relationships confirmed | Migration requirement |
|---|---|---|
| Account ownership | `profiles.userId`, `carts.userId`, `stores.ownerUserId`, seller-application user/reviewer fields, verification user/reviewer fields, notifications, audit actor, reports, disputes, reviews, and messages all reference `users.id`. | Preserve nullable actor/reviewer semantics; do not cascade-delete marketplace history when an account becomes inactive. |
| Catalogue and inventory | `listings.storeId → stores`, `listings.categoryId → categories`, `listingImages.listingId → listings`, `inventory.listingId → listings`, `cartItems.listingId → listings`, `favorites.listingId → listings`, and offer/order-item listing references. | Import categories and stores before listings, then dependent media/inventory/cart/order records. |
| Orders and pickup | `orders.buyerUserId → users`, `orders.storeId → stores`, `orderItems.orderId → orders`, `orderStatusHistory.orderId → orders`, and associated actor references. | Treat these as transactional core records; validate order totals, status history, reservation relationships, and pickup data before cutover. |
| Conversations and offers | Conversations reference optional listing/order/offer records; participants reference conversations/users; messages reference conversations/users. | Preserve nullable subject links and participant ownership constraints. |
| Trust and safety | Reviews reference orders/listings/stores/buyers; reports/disputes reference users and orders; seller applications/verification records reference users. | Do not weaken review legitimacy or private-case authorization by dropping integrity links. |
| Hierarchy and configuration | `categories.parentId → categories`; settings `updatedBy → users`. | Import parent categories in a self-referencing-safe order, then validate hierarchy integrity. |

## Schema Type Mapping

The current schema is defined with `drizzle-orm/mysql-core`. The PostgreSQL target must be authored as an independent schema using the PostgreSQL Drizzle dialect; MySQL migration SQL must not be reused.[1]

| Current MySQL/TiDB type or behavior | PostgreSQL target approach | Compatibility action |
|---|---|---|
| `mysqlTable(...)` | `pgTable(...)` | Recreate all 42 application tables with preserved names only where the application contract requires it. |
| `int(...).autoincrement().primaryKey()` | PostgreSQL integer identity primary key | Preserve existing numeric IDs on import; reset each PostgreSQL identity sequence above the imported maximum. |
| `bigint(..., { mode: "number" })` | PostgreSQL `bigint` with an explicit safe JavaScript representation decision | Preserve IDs exactly. Confirm current and future bounds remain safe if the application continues to use JavaScript numbers. |
| `varchar(length)` | PostgreSQL `varchar(length)` | Preserve explicit limits for email, tokens, identifiers, slugs, storage keys, routes, and user-entered short fields. |
| `text` | PostgreSQL `text` | Preserve nullability and application validation rules. |
| `boolean` | PostgreSQL `boolean` | Verify defaults and nullability. |
| `timestamp` | Prefer timezone-aware PostgreSQL timestamps for UTC-instants, subject to final API compatibility validation | Keep UTC semantics. Existing values must be normalized and tested for equivalent browser/API display. |
| MySQL `onUpdateNow()` columns | Explicit application-side update timestamps or an audited PostgreSQL trigger strategy | `updatedAt` behavior requires deliberate replacement; it is not automatically equivalent across engines. |
| `json` | PostgreSQL `jsonb` | Preserve serialized values. Add JSONB indexes only after query-plan evidence shows a real need. |
| `mysqlEnum(...)` | Domain-specific `pgEnum(...)` or constrained text with check constraints | Preserve every accepted value exactly. Semantically different statuses should remain separate domains even where labels overlap. |
| MySQL unique/index declarations | PostgreSQL unique/index declarations | Recreate unique rules and access-path indexes before functional acceptance tests. |

## Enum and State-Domain Inventory

The schema defines the following domain states. PostgreSQL must preserve them without spelling changes because tRPC validation, UI behavior, authorization decisions, and workflow transitions depend on these values.[1]

| Domain | Current values or purpose |
|---|---|
| Marketplace role | `CUSTOMER`, `SELLER`, `SUPPORT`, `MODERATOR`, `ADMIN`, `SUPER_ADMIN`. |
| Store status | `PENDING`, `ACTIVE`, `SUSPENDED`, `CLOSED`. |
| Listing status/condition | Publication/moderation/stock states and product condition taxonomy. |
| Order and pickup coordination | Checkout, fulfilment, pickup, exception, and close states. |
| Offer, review, reminder, reservation, and reversible-action states | User and administrator workflow state machines. |
| Session and security-event states | Server-tracked device/session and security-audit controls. |
| Evidence/media MIME and visibility classes | Enforces permitted seller, review, avatar, video, and private case evidence classifications. |

## Confirmed MySQL/TiDB-Specific Application Patterns

The PostgreSQL adaptation must address the following confirmed engine-specific patterns. They are contained in active database modules, not only test mocks.[2] [3] [4] [5]

| Pattern | Current use | PostgreSQL adaptation requirement |
|---|---|---|
| `onDuplicateKeyUpdate` | Account/profile upserts, pickup-coordination initialization, reservation-expiry health settings, and other idempotent updates. | Replace with PostgreSQL `ON CONFLICT ... DO UPDATE` via the PostgreSQL Drizzle API. Revalidate conflict targets and result behavior. |
| MySQL `insertId` result handling | Registration, reminder, checkout-related creation, and other procedures derive new numeric IDs from MySQL result arrays. | Use PostgreSQL `returning({ id: ... })` semantics and update code/tests so IDs are read safely. |
| MySQL-shaped affected-row results | Atomic inventory reservation/release/commit and reminder claims inspect `affectedRows`. | Replace with PostgreSQL-compatible row-count/`returning` validation. Preserve the rule that zero affected rows is a concurrency conflict or no-op, never silent success. |
| Drizzle MySQL driver | `drizzle-orm/mysql2` is used by the shared database adapter. | Select a PostgreSQL-compatible driver/pool for the final Node runtime and replace the dialect in an isolated migration branch. |
| Timestamp auto-update | Current schema uses MySQL `onUpdateNow()` behavior for many `updatedAt` columns. | Implement equivalent, tested update semantics rather than assuming PostgreSQL will update timestamps automatically. |
| Inline SQL expressions | Catalogue and inventory logic uses Drizzle SQL expressions, including arithmetic and `IS NOT NULL`/inequality expressions. | Recompile and test under the PostgreSQL Drizzle dialect; verify type coercion and query plans. |

## Migration-Critical Transaction Boundaries

The following workflows require dedicated PostgreSQL regression and concurrency testing. A successful schema import alone is not sufficient.

| Workflow | Current integrity control | PostgreSQL validation expectation |
|---|---|---|
| Buyer checkout | Transactional order batch creation, idempotency key, cart-to-order processing, atomic stock reservation, reservation record creation, notifications/audits. | Duplicate idempotency keys must return the original accepted outcome; concurrent buyers must not oversell stock. |
| Reservation expiry | Transactional candidate selection, state check, order cancellation, stock release, and health-record update. | Expiry jobs must not double-release stock or race a valid seller/buyer order transition. |
| Order completion | Active reservations are committed while quantity and reserved quantity are decremented conditionally; order history, audit, notifications, and pickup handling are written. | Verify all effects commit together or none do; protect pickup-code and status-transition invariants. |
| Password reset and password change | User password state and reset-token consumption update in a transaction. | A token cannot be reused, and a partial password-state update cannot occur. |
| Seller bulk order actions | Full prevalidation followed by one transactional set of valid state transitions. | No partial batch updates or cross-seller order changes are permitted. |
| Reminder scheduling | A conditional state update claims a due reminder before notification creation. | Duplicate scheduler execution cannot deliver the same active reminder twice. |
| Admin moderation undo/redo | Reversible action state, target update, audit history, and ownership/role checks. | Ensure state ordering, optimistic/revision semantics, and audit trail behavior remain intact. |

## Data and Security Preservation Requirements

| Data class | Preservation requirement during rehearsal and cutover |
|---|---|
| Password hashes, token hashes, session hashes, and pickup-code ciphertext | Copy as opaque values. Never log, print, rehash, decrypt, or place them in the migration report. |
| User roles and active state | Preserve exactly. The migration must never elevate a user or reactivate a suspended account. |
| Public order IDs and batch IDs | Preserve exactly; external/campus-facing references cannot be regenerated. |
| Storage metadata | Preserve only database metadata and storage keys/URLs. Object bytes remain in object storage and are verified through authorized backend paths. |
| Private evidence metadata | Preserve visibility class, originating report/dispute linkage, submitter relationship, and authorization model. |
| Audit, event, and status history | Preserve sequence/timestamp/actor/target context. Do not collapse historical records into current state. |
| Email and phone data | Handle through encrypted transport and restricted migration access. Do not include raw personal data in manifests or logs. |

## Required Reconciliation Controls

The row-count manifest is only the first evidence. Before a PostgreSQL target can be accepted, the rehearsal must produce a reconciliation report containing the following checks.

| Check | Acceptance rule |
|---|---|
| Row counts | All application table counts match the source snapshot, unless an owner-approved and documented archival exclusion exists. |
| Primary/unique identifiers | No collisions or missing values for account, store, listing, order, order-batch, token, session, slug, and other unique keys. |
| Foreign keys | The 44 confirmed relationships validate without orphan records after import. |
| Sequence alignment | Every PostgreSQL identity sequence advances beyond the highest imported identifier. |
| Commerce aggregates | Orders, order items, quantities, subtotal/fee/total sums, inventory/reservation totals, and state distributions match source controls. |
| Identity/security aggregates | Role counts, active/inactive account counts, session/security-event counts, and token states match source controls without displaying protected values. |
| Trust/safety aggregates | Seller applications, verification attempts, reviews, reports, disputes, evidence metadata, audit events, and moderation actions match source controls. |
| Storage references | Every imported media key is structurally valid and remains enforceable by existing server-side access policy. |

## Phase 1 Findings and Gate Status

The read-only inventory has established the migration scope and confirmed that the current system has a manageable controlled-launch data volume, active referential integrity, and several MySQL-specific code paths. It has **not** authorized a migration, provisioned a PostgreSQL provider, created a PostgreSQL schema, changed a connection string, exported data, or moved any live traffic.

| Gate | Current status | Reason |
|---|---|---|
| G0 — Strategic approval | **Partially prepared** | PostgreSQL is the proposed target, but provider, organization ownership, hosting runtime, recovery objectives, retention, and maintenance-window decisions remain unresolved. |
| G1 — Infrastructure ready | **Blocked** | No approved organization-owned non-production PostgreSQL environment has been provisioned. |
| G2 — Compatibility ready | **In progress** | The source inventory and engine-specific risk catalogue are complete; the PostgreSQL schema/adaptation design must wait for G0 and a dedicated staging environment. |
| G3–G6 | **Not started** | Require an approved staging target, rehearsal, cutover runbook, and owner authorization. |

## Immediate Next Decision Gate

The next action is not code conversion. The owner must choose or authorize evaluation of a managed PostgreSQL provider and confirm the infrastructure ownership model, backend runtime, recovery objectives, retention policy, and whether a short controlled maintenance window is acceptable. Until those decisions and an explicit `READY` authorization are received, the documented plan forbids source-code, database-schema, data, hosting, DNS, and production-configuration changes.

## References

[1]: [Current Drizzle relational schema](drizzle/schema.ts)

[2]: [Shared MySQL database adapter](server/db.ts)

[3]: [Marketplace tRPC procedures](server/routers.ts)

[4]: [Order transition and inventory logic](server/orderTransitions.ts)

[5]: [Reminder and reservation-expiry transaction logic](server/productReminders.ts)
