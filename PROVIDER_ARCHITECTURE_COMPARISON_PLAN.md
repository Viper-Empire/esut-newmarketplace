# ESUT Marketplace — Cloudflare and Hostinger Architecture Comparison Plan

## Goal

Produce a factual, provider-neutral comparison of the Cloudflare and Hostinger AI-agent assessments against the current ESUT Marketplace architecture. The comparison will identify which services each provider can safely host, which dependencies must remain external, the operational/security trade-offs, and the most suitable low-cost controlled-launch architecture for a student-built marketplace.

No code, database, deployment, DNS, provider account, storage, authentication, or production configuration change will be made as part of this assessment.

## Current Architecture Baseline

| Domain | Current implementation and required boundary |
|---|---|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS, route-level code splitting. It can be delivered from a CDN/static host. |
| API and commerce logic | Express 4, tRPC 11, Drizzle ORM, server-side authorization, first-party authentication, server-tracked sessions, and transactional marketplace workflows. |
| Primary database | Managed MySQL/TiDB-compatible database. It remains the authoritative source for marketplace facts. |
| Redis | Short-lived login lockouts, rate limits, and bounded temporary operational controls only. |
| Object storage | S3-compatible server-side storage for media and private evidence; no file bytes belong in the relational database. |
| Email | Resend adapter. Ordinary-recipient production delivery remains deferred until an ESUT-controlled sender domain is verified. |
| Proposed PostgreSQL role | Optional future non-authoritative analytics, telemetry, and rebuildable search projections only; it must not own checkout, inventory, identity, authorization, orders, pickup, or private-case access. |
| Current constraints | Existing controlled launch remains live; no technical modifications occur until explicit owner authorization. |

## Inputs to Analyze

1. The Cloudflare AI-agent assessment in `pasted_content_10.txt`, including Workers, Pages/static assets, R2, Hyperdrive, secrets, cron/queues, external database/Redis dependencies, runtime constraints, and stated cost/limit assumptions.
2. The Hostinger AI-agent assessment in `pasted_content_11.txt`, including managed Node hosting, VPS options, Docker/self-management, database/Redis/storage boundaries, backup expectations, security operations, and stated cost/limit assumptions.
3. The current ESUT Marketplace schema, tRPC/Express runtime, transactional order/inventory behavior, security controls, storage policy, testing baseline, and controlled-launch constraints.

## Analysis Method

### 1. Normalize Provider Claims

Separate each provider claim into one of the following categories:

| Category | Meaning |
|---|---|
| Directly supported | The provider supplies the required managed capability within the proposed architecture. |
| Supported with adaptation | The provider can support the requirement, but ESUT Marketplace needs runtime, code, or operations changes. |
| External dependency required | The provider does not supply the capability; a separate managed provider remains necessary. |
| Self-managed responsibility | The capability is possible only through VPS/Docker/application operations owned by the marketplace team. |
| Not suitable | The option would weaken transactional integrity, security, availability, private-evidence handling, or operational recovery. |

### 2. Compare Against the Eight-Layer Architecture

Evaluate Cloudflare and Hostinger against each layer:

| Layer | Assessment questions |
|---|---|
| Experience/CDN | Can it securely serve React/Vite static assets, custom domains, TLS, caching, SPA routes, and staged previews? |
| API/application runtime | Can it run the current Express/tRPC system without unsupported Node APIs, lifecycle issues, or unsafe changes? |
| Identity/authorization | Can secure cookies, server-tracked sessions, password hashing, lockout behavior, and protected procedures operate correctly? |
| Commerce domain | Can checkout, idempotency, inventory reservation, pickup state, and order transitions retain atomic transactional behavior? |
| Primary data | Does it support secure, backed-up, TLS-enabled MySQL/TiDB-compatible relational storage? |
| Media/files | Can it support public/private/quarantine storage zones, signed access, lifecycle controls, and a scanning workflow? |
| Security/resilience | Can it support Redis, secrets, WAF/edge controls, monitoring, audits, rate limits, backups, and recovery operations? |
| Operations/integrations | Can it support Resend, scheduler/cron, queues, observability, alerts, rollback, and accountable ownership? |

### 3. Identify Architecture-Specific Risks

Analyze provider fit for the marketplace’s non-negotiable requirements:

1. MySQL remains the only authoritative owner of inventory, orders, pickup, user roles, seller verification, reviews, reports, disputes, private evidence metadata, and audit logs.
2. PostgreSQL, if introduced, remains optional and non-authoritative for analytics/telemetry/search projections.
3. Redis remains private and ephemeral; it is not replaced by eventually consistent key-value storage for security-critical lockouts without a separately approved design.
4. Object storage uses a public/private/quarantine zone model; private evidence cannot be publicly addressable.
5. The frontend never receives database, Redis, storage-write, or email secrets.
6. The current Node/Express runtime and media-upload behavior must be assessed for Worker memory/runtime compatibility before any Cloudflare Worker proposal is considered.
7. A single VPS is explicitly evaluated as a single-failure-domain operational model, not as high availability.

### 4. Validate Material Claims

Before presenting recommendations, verify time-sensitive provider claims against official documentation where material to the conclusion, including current plan limits, runtime compatibility, backup responsibility, object-storage behavior, and data-service availability. Clearly distinguish provider statements from independently validated facts.

### 5. Produce Decision Options

Provide a comparison of at least these deployment patterns:

| Option | Intent |
|---|---|
| Cloudflare Pages/R2 edge + existing Node/MySQL/Redis services | Lowest runtime-change Cloudflare adoption path. |
| Cloudflare Workers migration + external MySQL/Redis/PostgreSQL | Edge-first path, conditioned on Express/tRPC compatibility validation. |
| Hostinger VPS + externally managed data/storage/security services | Traditional Node-runtime path with VPS operations responsibility. |
| Hostinger managed Node + external managed dependencies | Simpler deployment option, conditioned on no idle-suspension impact and adequate job execution. |
| Remain on current managed controlled-launch stack | Baseline/no-migration option until required operational ownership and external launch gates are ready. |

## Deliverable

The final comparison report will include:

1. An executive conclusion identifying the safest low-cost architecture for the current controlled-launch stage.
2. A provider capability matrix mapped to ESUT Marketplace’s eight layers.
3. Confirmed strengths, limitations, external dependencies, and unsupported assumptions for both providers.
4. A recommendation on whether Cloudflare should be used for frontend/CDN/R2 only or for a full Worker runtime.
5. A recommendation on whether Hostinger should be used for traditional Node compute, whether a VPS is justified, and which responsibilities should remain external.
6. A cost/operations comparison that distinguishes provider-only costs from required external database, Redis, storage, email, monitoring, and backup costs.
7. A no-change architecture recommendation for the current stage and a staged adoption path only after explicit authorization.
8. A risk register covering data consistency, security, runtime compatibility, single-failure-domain exposure, backup/recovery, media safety, and vendor lock-in.

## Test and Validation Plan

The report will define—not execute—the validation required before any platform move:

| Test area | Required validation |
|---|---|
| Runtime | Build/deploy a non-production copy; verify Node/Express/tRPC compatibility, routes, cookies, and secure environment access. |
| Data | Retain MySQL as the source of truth; test TLS, backup/restore, transactions, connection pooling, and no public database access. |
| Commerce | Test idempotent checkout, concurrent inventory reservation, pickup transition, seller bulk updates, and recovery after failed operations. |
| Security | Test cross-role authorization, session revocation, Redis lockout/rate-limit behavior, private-evidence authorization, secret non-exposure, and upload controls. |
| Storage | Test public/private/quarantine boundaries, signed access, scanning/promotion workflow, lifecycle/retention, and failure handling. |
| Operations | Test logging, alerting, scheduled tasks, deployment rollback, database restoration, and a temporary-domain cutover before changing production DNS. |

## Assumptions and Open Risks

1. The provider-agent reports may contain time-sensitive pricing, plan, feature, or compatibility claims and must not be treated as binding quotations.
2. Cloudflare does not remove the need for an external relational database and Redis service in the proposed architecture.
3. Hostinger VPS operation would assign the marketplace team responsibility for operating-system patching, process management, service hardening, database/Redis backups, monitoring, and restoration unless those dependencies stay external.
4. The current marketplace implementation is Node/Express-oriented; moving it to Cloudflare Workers needs a separate compatibility spike before it can be recommended.
5. No provider migration will begin without an organization-owned account model, verified backup/restore procedure, staging environment, security validation, owner-approved rollback runbook, and explicit `READY` authorization.
