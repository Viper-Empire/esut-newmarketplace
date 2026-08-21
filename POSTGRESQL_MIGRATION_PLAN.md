# ESUT Marketplace — Staged PostgreSQL Migration Plan

## Goal

Migrate ESUT Marketplace from the existing **MySQL/TiDB-compatible relational database** to an organization-owned, managed **PostgreSQL** production database without loss, corruption, unauthorized exposure, or duplicate processing of marketplace data. The migration must preserve the current buyer/seller dual-role model, server-enforced authorization, transactional inventory and order flows, private evidence access model, auditability, and controlled-launch readiness.

This is a **plan only**. No source code, schema, data, deployment, provider setting, DNS setting, or live service will change until the owner explicitly approves execution and says `READY`.

## Current Baseline

| Area | Current state to preserve |
|---|---|
| Application | React 19, TypeScript, Express 4, tRPC 11, Drizzle ORM. |
| Current database | Managed MySQL/TiDB-compatible database. It remains the authoritative source throughout preparation and validation. |
| Schema scope | 42 relational tables across identity, seller trust, catalogue, commerce, safety, notifications/events, observability, and audit domains. |
| Security | First-party password authentication, server-tracked JWT sessions, Redis-backed login protection, role/ownership enforcement, immutable audit trails, and private evidence authorization. |
| Storage | S3-compatible object storage; database holds metadata/references rather than file bytes. |
| Validation baseline | 45 test files, 137 passing tests, 1 intentionally skipped Redis-mutation test. |
| Deployment status | Controlled-launch baseline is live. Sender-domain verification and external-host migration remain owner-deferred. |

## Target Architecture

The target deployment keeps the database private behind the backend/API layer. Cloudflare Pages, if selected, would host only the static React frontend and would never connect directly to PostgreSQL.

```text
Cloudflare Pages frontend (optional future Layer 1)
        ↓ HTTPS only
Node-compatible API / tRPC backend
        ↓ private server-side connection
Managed PostgreSQL database
        ↕
Private Redis + S3-compatible object storage + Resend + monitoring/scheduler
```

### Target Database Requirements

The chosen PostgreSQL service must provide:

1. PostgreSQL version supported by the selected Drizzle ORM PostgreSQL driver and the target Node runtime.
2. TLS-encrypted connections and server-side secrets management.
3. Separate production and non-production databases/projects.
4. Automated backups, retention controls, and preferably point-in-time recovery.
5. Restricted network access or provider-native connection controls; no broad public credentials in frontend code.
6. Query/connection observability, capacity monitoring, and an accountable organization-owned billing/administration account.
7. A documented data-export and service-exit path.

## Migration Principles and Non-Negotiable Controls

| Principle | Required control |
|---|---|
| No data loss | The current database remains untouched and authoritative until imported data and reconciliation checks pass. |
| No in-place engine conversion | PostgreSQL is provisioned as a separate target; source data is exported, transformed, imported, and verified. |
| No untested cutover | A full rehearsal is completed against a non-production PostgreSQL environment before production cutover. |
| No direct public database access | Only the backend runtime receives database credentials; frontend traffic uses tRPC/API only. |
| No weakened security | Existing session, authorization, ownership, case-evidence, audit, and order-integrity controls must retain equivalent or stronger behavior. |
| Reversible release | Cutover includes a predefined rollback point and owner-approved communication/maintenance plan. |
| File separation remains intact | Object-storage file bytes are not migrated into PostgreSQL. Database media keys and metadata are reconciled against existing object storage. |

## Phase 0 — Owner Decisions and Production Readiness Gate

Before technical work begins, confirm the following decisions.

| Decision | Required choice |
|---|---|
| Database provider | Select an organization-owned managed PostgreSQL provider based on location, backup capability, cost, connection model, and support needs. |
| API hosting runtime | Select the Node-compatible backend host that will connect privately to PostgreSQL. This may remain the current runtime initially or become Vercel/Railway/Render/Fly.io after separate validation. |
| Maintenance window | Decide whether controlled launch may be read-only/offline during final synchronization, or whether a more complex low-downtime method is required. |
| Production ownership | Name the organization account owner and at least one restricted operational administrator for database, backups, alerts, and restoration. |
| Recovery objectives | Define acceptable recovery-point objective (maximum tolerated lost data) and recovery-time objective (maximum restoration time). |
| Data residency/retention | Approve provider region and retention periods for accounts, orders, security/audit records, seller evidence, case evidence, and operational logs. |

**Recommended default:** Use a short, announced controlled maintenance window for the first public migration. This is safer and simpler than bidirectional synchronization for a campus marketplace at this launch stage.

## Phase 1 — Database Discovery and Compatibility Inventory

Perform a read-only audit of the current database implementation and running schema. Document every table, column, relation, index, unique rule, check/business constraint, enum, default, generated identifier, timestamp, query pattern, and transaction boundary.

### Deliverables

1. A MySQL/TiDB-to-PostgreSQL schema mapping document.
2. A table-by-table row-count and checksum/reconciliation manifest.
3. An inventory of all database access locations, including Drizzle helpers and tRPC commerce flows.
4. A catalogue of MySQL/TiDB-specific operations requiring PostgreSQL equivalents.
5. A written identification of sensitive flows requiring enhanced test coverage.

### Particular Review Areas

| Area | PostgreSQL migration review |
|---|---|
| Identifier columns | Map auto-increment behavior to PostgreSQL identity columns/sequences without changing external order identifiers. |
| Enums | Decide whether each current enum becomes a PostgreSQL enum, constrained text, or a lookup table; preserve values exactly. |
| Timestamps | Preserve UTC semantics and review `on update` behavior, which needs an explicit PostgreSQL-compatible application/trigger strategy. |
| Boolean/integers | Verify type compatibility, defaults, nullability, and index behavior. |
| JSON fields | Map to `jsonb` where the schema requires flexible structured data, with indexes only where actual query plans justify them. |
| Text/index rules | Revisit column length assumptions, uniqueness, case sensitivity, collation, and search needs. |
| Upserts | Map MySQL `ON DUPLICATE KEY UPDATE` patterns to PostgreSQL `ON CONFLICT` behavior. |
| Transactions and locks | Re-test inventory, checkout, seller publication, pickup transition, and moderation workflows under PostgreSQL isolation/locking semantics. |
| SQL reports | Convert any raw MySQL syntax and validate administrator analytics results against source totals. |

## Phase 2 — Provision a Non-Production PostgreSQL Target

Provision a separate staging PostgreSQL project/database owned by the marketplace organization. Configure it with TLS, restricted credentials, backup controls, non-production alerts, and access limited to the approved technical operators.

### Required Setup

1. Create separate database roles for schema migration, application runtime, and read-only diagnostic access; apply least privilege.
2. Store connection secrets only in the target backend host’s secret manager/environment configuration.
3. Enable provider backups and capture its documented restoration process.
4. Configure monitoring for connection errors, capacity, storage, slow queries, and failed backups.
5. Verify a fresh blank database cannot be reached from browser-side code or unauthorized networks.

No production traffic should be pointed to this environment during this phase.

## Phase 3 — Adapt Database Schema and Application Data Access

Create a dedicated PostgreSQL migration branch/environment. Preserve the current MySQL/TiDB implementation until the PostgreSQL environment passes all validation.

### Planned Technical Changes

| Component | Planned adaptation |
|---|---|
| Drizzle schema | Convert `mysqlTable`, MySQL column types, and MySQL-specific enum definitions to PostgreSQL equivalents while preserving table names and application-level contracts where practical. |
| Database adapter | Replace the MySQL driver/Drizzle dialect with the supported PostgreSQL driver/dialect selected for the backend runtime. |
| Migrations | Generate a clean PostgreSQL baseline schema plus additive forward migrations; never reuse MySQL migration SQL blindly. |
| Query helpers | Replace engine-specific inserts/upserts/aggregations and verify return shapes remain compatible with tRPC procedures. |
| Constraints/indexes | Recreate foreign keys, unique indexes, performance indexes, and database-level guardrails; add only evidence-based PostgreSQL indexes. |
| Time handling | Retain UTC timestamps consistently and test serialized API responses with SuperJSON/Drizzle. |
| Error handling | Normalize PostgreSQL constraint/serialization errors into the existing safe application error model without leaking internals. |

### Explicitly Out of Scope

The migration must not casually redesign buyer/seller roles, reorder commerce workflows, rewrite public UI, change storage providers, or relax authorization. Those are separate decisions and should not be coupled to the database engine change.

## Phase 4 — Controlled Data Export, Transformation, and Import Rehearsal

Execute a full data migration rehearsal from a consistent, read-only snapshot/copy of the current database into staging PostgreSQL.

### Data Handling Process

1. Produce an encrypted source snapshot/export using a controlled account.
2. Capture a source manifest: table counts, primary-key ranges, key aggregates, foreign-key relationships, and selected cryptographic checksums where safe and practical.
3. Transform data deterministically for PostgreSQL compatibility, including encoding, null semantics, numeric/date fields, JSON, enum values, and sequence values.
4. Import parent/reference tables before dependent tables, with constraints managed safely during bulk load and validated before test use.
5. Set PostgreSQL sequences to values beyond the largest imported identifiers.
6. Reconcile imported target totals and relationships against the source manifest.
7. Verify storage metadata references still resolve only through the existing controlled backend policy; do not bulk-copy object files unless a separate storage migration is approved.

### Data Reconciliation Exit Criteria

| Check | Required result |
|---|---|
| Row counts | Every retained table count matches the source manifest exactly, except for formally documented archival exclusions approved in advance. |
| Key uniqueness | No duplicate primary keys, unique identifiers, order references, emails, or security/session identifiers. |
| Referential integrity | All expected parent/child relationships are valid; no orphan orders, inventory records, media records, events, cases, or audit entries. |
| Financial/order integrity | Order totals, item quantities, order state histories, and stock figures match source controls. |
| Account/security integrity | Password hashes remain opaque but valid, sessions follow intended policy, roles are preserved, and no account is silently elevated. |
| Media integrity | Object-storage metadata keys and access classifications match their related database records. |
| Audit integrity | Audit/event timelines retain timestamps, actors, targets, and immutable references. |

## Phase 5 — Full Functional, Security, and Performance Validation

Run the entire automated test suite against the PostgreSQL staging environment, then expand testing where engine behavior changes could matter.

### Required Test Coverage

| Test category | Required cases |
|---|---|
| Regression | Existing 45-file, 137-passing-test baseline must pass, excluding only the existing intentional Redis-mutation skip. |
| Authentication | Registration, login, invalid credentials, lockout/countdown, session enforcement, revocation, password change/reset boundaries, and device visibility. |
| Authorization | Buyer, seller, support, moderator, admin, and super-admin cross-role/ownership checks; direct-object-reference denial attempts. |
| Commerce | Concurrent purchase attempts, stock decrement/reservation, order ID integrity, state transition validity, seller actions, and pickup confirmation. |
| Safety | Seller verification, listing moderation, reports/disputes, private evidence authorization, signed URL expiry, review legitimacy, and audit-note enforcement. |
| Data correctness | PostgreSQL upsert behavior, timestamps, reporting/analytics totals, notifications, marketplace event polling, and telemetry aggregation. |
| Browser acceptance | Buyer, seller, and administrator journeys on desktop and mobile using the staging API/database. |
| Performance | Representative catalogue queries, dashboard queries, checkout transaction latency, connection-pool behavior, and slow-query inspection. |
| Security | TLS enforcement, absent frontend secrets, protected database network access, error redaction, SQL injection regression checks, and backup/restore verification. |

### Restoration Drill

Before production approval, restore a staging database backup into an isolated recovery environment. Record the time taken, verify the recovered schema/data, and document any corrective action. A backup that has never been restored is not an accepted recovery plan.

## Phase 6 — Production Cutover Preparation

After staging validation passes, prepare the owner-approved production runbook.

### Cutover Runbook Contents

1. Named operators, responsibilities, escalation contacts, and an owner approval checkpoint.
2. Exact maintenance-window communication to affected controlled-launch users if writes will pause.
3. Final source-database backup and immutable/recoverable copy confirmation.
4. Final source snapshot/export and target import procedure.
5. Final reconciliation report and explicit go/no-go criteria.
6. Secure deployment configuration switch performed only through approved server-side secrets/configuration.
7. Automated and manual smoke-test checklist.
8. Real-time monitoring dashboard and alert recipients.
9. A time-limited rollback procedure, including the conditions that trigger it.

### Rollback Principle

The prior MySQL/TiDB environment remains available and read-only/recoverable for the agreed rollback window. If critical errors, reconciliation mismatches, transaction failures, session failures, authorization errors, or unacceptable performance appear after cutover, traffic is returned to the prior application/database configuration according to the runbook. The target PostgreSQL database must not be treated as final until the stabilization window concludes.

## Phase 7 — Production Cutover and Stabilization

During the approved window:

1. Place write-dependent marketplace actions into controlled maintenance/read-only mode if required by the selected cutover method.
2. Confirm no in-flight checkout or stock-changing process remains unresolved.
3. Perform final backup, export, transform, import, and reconciliation.
4. Apply the approved server-side production database configuration.
5. Run critical smoke tests: public discovery, registration/login, seller access, product reading, cart/checkout in safe test conditions, order lifecycle, private evidence denial/authorized retrieval, administrator audit visibility, and logout/session validation.
6. Resume writes only after the go/no-go checklist passes.
7. Monitor transactions, database errors, slow queries, login failures, Redis behavior, email errors, and operational telemetry closely through the stabilization period.

## Phase 8 — Post-Migration Operations

After the approved stabilization window:

1. Retain the previous source database backup and read-only recovery access for the agreed retention period.
2. Document the new database schema ownership, credentials process, restore procedure, connection settings, monitoring, and on-call ownership.
3. Set periodic backup-restore drills and database-access reviews.
4. Review performance metrics and add only measured, justified indexes.
5. Retire or reduce the old environment only after owner sign-off and confirmation that data-retention obligations are satisfied.

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Incompatible SQL or ORM behavior | Inventory all queries; rehearse against staging; add engine-specific regression tests. |
| Data mismatch after import | Use manifests, counts, checksums/aggregates, referential validation, and explicit go/no-go thresholds. |
| Lost writes during final sync | Use a controlled maintenance window or a separately designed, tested change-data-capture approach. Do not improvise live replication. |
| Broken password/session behavior | Preserve hashes and user identifiers exactly where supported; test all authentication/session flows before cutover. |
| Checkout or inventory races | Stress-test concurrent transactions and validate PostgreSQL isolation/locking behavior under production-like load. |
| Private evidence exposure | Preserve file metadata/access classifications and verify authorization checks from backend to signed URL issuance. |
| Provider lock-in or lack of ownership | Use an ESUT Marketplace organization account, exportable backups, documented roles, and service-exit procedures. |
| Credential leakage | Use secret managers/server variables only; rotate secrets after migration; never place database URLs in Cloudflare Pages or client bundles. |
| Premature destruction of source environment | Retain source backups/read-only recovery path until reconciliation and stabilization are complete. |

## Approval Gates

No phase may advance without its gate being met.

| Gate | Approval condition |
|---|---|
| G0 — Strategic approval | Owner approves PostgreSQL as the target and chooses/authorizes provider evaluation. |
| G1 — Infrastructure ready | Organization-owned PostgreSQL staging environment, backups, access controls, and monitoring are verified. |
| G2 — Compatibility ready | Schema/query inventory and PostgreSQL adaptation design are reviewed. |
| G3 — Rehearsal passes | Full staging import/reconciliation, automated tests, security tests, performance review, and restore drill pass. |
| G4 — Cutover approval | Owner approves the detailed cutover/rollback runbook and maintenance communications. |
| G5 — Production acceptance | Post-cutover smoke tests, monitoring, and stabilization criteria pass. |
| G6 — Source retirement | Owner approves retention/retirement only after the recovery period and compliance requirements are met. |

## Assumptions and Open Decisions

1. The existing MySQL/TiDB-compatible database remains healthy and is available for export during the migration project.
2. A short controlled maintenance window is acceptable for the initial public migration; otherwise the plan must be extended with a tested change-data-capture/dual-write design.
3. The final PostgreSQL provider and API hosting provider have not yet been selected and will be decided before Phase 2.
4. Cloudflare Pages remains a proposed frontend/CDN layer only; it will never store database credentials or directly reach PostgreSQL.
5. Object storage remains external to PostgreSQL. The proposed public/private/quarantine storage-zone implementation is a separate, coordinated infrastructure project and should not be silently combined with this database migration.
6. Email sender-domain verification and any Vercel migration remain separately deferred unless the owner explicitly authorizes them.

## Success Definition

The PostgreSQL migration is complete only when ESUT Marketplace operates against the managed PostgreSQL target with all validated buyer, seller, administrator, commerce, security, storage-metadata, audit, and observability workflows functioning; production data has reconciled; backups have been restore-tested; monitoring is active; rollback risk has passed; and the owner has approved final acceptance.
