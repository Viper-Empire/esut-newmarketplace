# ESUT Marketplace — Infrastructure Action Plan

**Status:** Drafted for owner approval.  
**Current baseline:** Validated managed full-stack controlled launch.  
**Implementation rule:** Every phase below requires a separate explicit owner **`READY`** authorization. Approval of this plan does not authorize provider configuration, source-code changes, schema changes, DNS changes, storage migration, or traffic cutover by itself.

## Objective

Evolve ESUT Marketplace safely from its current managed full-stack baseline into a layered production architecture:

```text
Cloudflare Pages + CDN + WAF
        ↓
Cloudflare same-origin API routing (after staging validation)
        ↓
Node.js / Express / tRPC backend
        ↓
MySQL — authoritative marketplace truth
Redis — temporary security state
Object storage — public / private / quarantine media
Resend — verified transactional email
Monitoring + backups + incident operations
```

The plan avoids a “move everything at once” deployment. The current managed application remains the rollback baseline until each new layer passes acceptance testing.

## Non-Negotiable Architecture Principles

| Principle | Required outcome |
|---|---|
| **MySQL remains authoritative** | User identity, roles, seller trust, listings, stock, checkout, orders, pickup, reviews, reports, disputes, notification facts, and audits remain in one transactional database. |
| **Frontend holds no secrets** | Cloudflare Pages receives only browser-safe configuration; database, Redis, R2, signing, email, and cache-purge credentials remain server-side. |
| **One change domain at a time** | Frontend, API routing, backend host, media storage, and DNS cutover are not migrated together. |
| **Private evidence is private by default** | Verification and dispute/report evidence never use public media delivery or permanent browser-visible URLs. |
| **Cache never authorizes commerce** | Cached content can improve public discovery; checkout, stock, roles, sessions, and private access always validate against the backend/MySQL. |
| **Backups are automatic; production restores are authorized** | An incident operator validates a recovery set in isolation before replacing production data. |
| **Every phase has rollback** | A failed stage returns traffic/configuration to the existing verified baseline without data loss. |

## Phase Summary

| Phase | Deliverable | Implementation changes? | Owner authorization needed |
|---:|---|---:|---:|
| 1 | Governance, ownership, budget, RPO/RTO decision record | No | Decision approval only |
| 2 | Domain/DNS and Cloudflare account governance | Yes, when started | `READY — Phase 2` |
| 3 | Protected Cloudflare Pages frontend staging | Yes, when started | `READY — Phase 3` |
| 4 | Secure frontend-to-existing-Node API staging connection | Yes, when started | `READY — Phase 4` |
| 5 | Future Node backend host readiness and staging parity | Yes, when started | `READY — Phase 5` |
| 6 | Safe public caching and public-media delivery | Yes, when started | `READY — Phase 6` |
| 7 | Public/private/quarantine storage zones and scanning | Yes, when started | `READY — Phase 7` |
| 8 | Backup, restore, monitoring, and incident operations | Yes, when started | `READY — Phase 8` |
| 9 | Controlled domain/API/media production cutover | Yes, when started | `READY — Phase 9` |

---

## Phase 1 — Governance, Ownership, and Recovery Targets

### Purpose

Confirm who owns the services and who may change, approve, monitor, back up, and restore the marketplace. Technical work should not start before service ownership is clear.

### Owner Decisions Required

| Decision | Required owner answer |
|---|---|
| Cloudflare owner | ESUT Marketplace organization account owner and at least one recovery administrator. |
| Domain owner | Organization-controlled registrant, payment owner, DNS owner, and recovery contact. The domain must not depend on one developer’s personal account. |
| Backend-host owner | Who pays for and administers the future Node-compatible host/VPS. |
| Database owner | Who controls the managed MySQL account, backup/export access, billing, and restore approval. |
| Storage owner | Who controls current/future object storage and may access private evidence. |
| Email owner | Who controls Resend, the ESUT sender domain, and email-related DNS records. |
| Security/operations owners | Named people for alerts, seller moderation, incident response, and restoration authorization. |
| Recovery objectives | Approved maximum data-loss window (**RPO**) and recovery time (**RTO**) for the launch stage. |
| Budget ceiling | Monthly limits for domain, host, database, storage, scanning, email, monitoring, and backups. |

### Minimum Deliverables

1. Service ownership register with recovery contacts.
2. Credential-access policy: least privilege, multi-factor authentication, recovery codes, and no shared personal passwords.
3. Data classification and retention policy for public media, private evidence, failed uploads, backups, and audit records.
4. Initial RPO/RTO target. A practical starting point can be a daily verified recovery point and a four-hour recovery target, subject to provider capability and owner approval.

### Exit Gate

Proceed only when owner accounts, budget, responsibility, and recovery objectives are written down. No user traffic or customer data migration occurs in this phase.

---

## Phase 2 — Domain, DNS, and Cloudflare Governance

### Purpose

Create the organization-controlled public identity and security edge without redirecting the existing managed live domain.

### Work Scope After `READY — Phase 2`

| Action | Required control |
|---|---|
| Purchase/register domain | Use an ESUT Marketplace-owned registrar account with MFA and at least two recovery contacts. |
| Add Cloudflare zone | Transfer authoritative DNS management to the organization-owned Cloudflare account. |
| Establish DNS records | Start with staging-only records; do not route the public marketplace domain until later cutover. |
| Establish Cloudflare roles | Separate billing, DNS, deployment, and security-admin roles; no shared credentials. |
| Enable edge baseline | TLS, DNSSEC where supported/appropriate, WAF baseline, DDoS protection, rate-limit policy, and audit logging. |
| Preserve current site | Keep `esutshop-59wzg8bs.manus.space` unchanged and reachable as fallback. |

### Validation

1. DNS ownership and recovery roles are confirmed.
2. Staging subdomain resolves correctly without affecting the live managed domain.
3. Cloudflare audit log and security alerts have named recipients.
4. No public production traffic is redirected.

### Rollback

Remove the staging DNS record or pause the staging route. The current managed live domain remains untouched.

---

## Phase 3 — Protected Cloudflare Pages Frontend Staging

### Purpose

Prove that the React/Vite frontend builds and serves correctly from Cloudflare Pages before it is connected to real marketplace traffic.

### Work Scope After `READY — Phase 3`

| Configuration | Project-specific requirement |
|---|---|
| Git source | Connect the private marketplace repository to the organization-owned Cloudflare account. |
| Production branch | `main`, but keep the Pages production URL as a non-public technical target initially. |
| Staging branch | Dedicated staging branch/preview workflow, protected with Cloudflare Access. |
| Build command | `pnpm exec vite build` for the static frontend only. |
| Build output | `dist/public`, matching the current Vite configuration. |
| Environment variables | Only public `VITE_*` values reviewed as browser-visible. No database, JWT, Redis, storage, email, cache-purge, or scanning credentials. |
| Preview protection | Cloudflare Access; use synthetic/test accounts and prevent search indexing. |

### Validation

1. TypeScript, Vitest suite, and static Vite build succeed before Pages release.
2. Public routes load directly and client-side Wouter routes behave correctly.
3. The Pages preview does not expose server secrets in generated JavaScript or build logs.
4. The preview is protected from public browsing until release policy says otherwise.

### Rollback

Disable the preview deployment or deploy the prior Pages build. No DNS/public traffic change is required.

---

## Phase 4 — Secure Frontend-to-Existing-Node API Connection

### Purpose

Connect the Cloudflare-hosted staging frontend to the **existing managed Node.js/Express/tRPC backend** while preserving current MySQL, Redis, storage, and authentication controls.

### Architecture Choice

The preferred future shape is **same-origin API routing**:

```text
https://staging.<domain>
  ├── Cloudflare Pages static frontend
  └── /api/* → controlled Cloudflare edge routing → existing Node API origin
```

This preserves the current frontend’s relative `/api/trpc` contract and avoids a premature cross-origin cookie/CORS design. It requires a carefully reviewed edge routing component; Cloudflare Pages alone should not be assumed to proxy `/api/*` automatically.

### Work Scope After `READY — Phase 4`

| Action | Required control |
|---|---|
| Add controlled edge/API route | Forward only intended `/api/*` paths to the managed Node backend. |
| Restrict cache | Explicitly bypass cache for every API route until selective public caching is separately approved. |
| Preserve headers/cookies | Forward only required headers, preserve secure session semantics, and reject untrusted forwarding headers. |
| Configure origin access | Protect the Node origin from bypass where feasible; maintain a narrow staging allowlist. |
| Test roles | Buyer, seller, moderator/admin, and super-admin access must be tested separately. |

### Validation

1. Registration, login, logout, lockout countdown, password change, and session revocation work on the staging Pages origin.
2. Buyer, seller, and admin workspace queries/mutations reach the Node API correctly.
3. No authenticated API response is cached at the edge.
4. Storage upload/evidence routes retain existing authorization behavior.
5. Node API outage presents a safe error and does not result in stale private data.

### Rollback

Disable or revert only the staging edge route. The managed frontend/backend deployment remains the working baseline.

---

## Phase 5 — Future Node Backend Host Readiness

### Purpose

Prepare a future Node-compatible runtime, such as a Hostinger VPS, without moving production traffic or databases prematurely.

### Work Scope After `READY — Phase 5`

| Layer | Required hardening and validation |
|---|---|
| Operating system | Supported Linux release, non-root operator account, SSH key-only access, host firewall, automatic security updates, restricted administrator access. |
| Runtime | Pinned Node.js version, pnpm lockfile install, read-only/reproducible build/release process, health endpoint, structured logs, process supervisor. |
| Reverse proxy | TLS termination, request body limits, trusted proxy configuration, request-id logging, rate limits, and no public exposure of internal ports. |
| Secrets | Provider/server secret manager or protected environment files; file permissions; no `.env` committed to Git; rotation procedure. |
| Database | TLS connection, least-privilege database user, connection limits/pooling, no public database exposure. |
| Redis/storage/email | TLS/credentials server-side only; connection health checks; no frontend exposure. |
| Scheduler | External or provider-supported authenticated scheduler; never `setInterval` or in-process cron as the sole reliability mechanism. |

### Validation

1. Deploy the same commit to a non-production Node host.
2. Use staging database/storage credentials or synthetic data—not production customer data without explicit approval.
3. Run full authentication, checkout, inventory concurrency, buyer/seller/admin authorization, upload, reminder, and error-handling tests.
4. Perform a host restart and confirm clean process recovery, logs, health checks, and secret protection.

### Rollback

Stop staging traffic to the future host. The existing managed backend continues unchanged.

---

## Phase 6 — Safe Public Caching and Public Media Delivery

### Purpose

Reduce repeated public-read and media delivery workload without caching personal/transactional data or changing MySQL’s authority.

### Work Scope After `READY — Phase 6`

| Component | Approved scope |
|---|---|
| Static assets | Use Cloudflare Pages defaults first; apply immutable asset policy only for hashed/versioned assets after validation. |
| Public data endpoints | Create explicitly anonymous, cache-safe public read paths; do not cache the shared `/api/trpc` transport wholesale. |
| Cache invalidation | Commit MySQL write first, then narrowly purge affected public listing/store/category/review projections. |
| Availability | Keep checkout authoritative; use no/very short cache for availability displays or a separate dynamic availability endpoint. |
| Media | Begin only with approved public media under versioned immutable paths. |

### Validation

1. Public cache hit/miss behavior reduces measured origin/database read pressure.
2. All authenticated, checkout, admin, seller, session, cart, and evidence responses use `private, no-store` or equivalent cache bypass.
3. Seller listing/status/media changes invalidate the correct public views.
4. Cache failure/miss does not prevent checkout or create incorrect inventory decisions.

### Rollback

Disable the narrow rule/route and purge only affected public paths if needed. Never start with a global “purge everything” response.

---

## Phase 7 — Storage Zones, Malware Scanning, and File Governance

### Purpose

Implement the three-zone storage model and prevent unsafe files from becoming publicly or privately available without validation and scan approval.

### Work Scope After `READY — Phase 7`

| Zone | Content | Access policy |
|---|---|---|
| Public | Approved listing photos, public avatars, storefront media, approved public review media. | CDN delivery after backend marks visibility public. |
| Private | Verification documents, case/report/dispute evidence, sensitive moderation media. | Backend authorization and short-lived signed retrieval only. |
| Quarantine | Newly uploaded files awaiting validation and scanning. | No public domain; scanner/backend only. |

### Implementation Work

1. Create a central metadata catalogue and scan/promotion audit model.
2. Preserve current server-side ownership, MIME, signature, file-size, and filename controls.
3. Add purpose-bound, short-lived upload intents; never issue provider-wide credentials to browsers.
4. Run scanning in an isolated worker or approved managed scanning service, not inside the main Node request process.
5. Promote only `CLEAN` objects into final public/private zones; do not treat upload completion as publication/approval.
6. Apply lifecycle policies for abandoned quarantine uploads, rejected-file retention, and unreferenced final media.

### Validation

1. Mismatched MIME/signature, oversized files, malformed images/videos, interrupted uploads, expired upload URLs, and scanner failures cannot promote.
2. Unrelated authenticated users cannot retrieve private evidence.
3. Public listing media is fast and cacheable while original/quarantine/private objects remain inaccessible.
4. An isolated non-production malware test verifies expected rejection without retaining malicious material in production public storage.

### Rollback

Stop promotion and direct uploads, retain existing managed storage paths, and leave MySQL references unchanged until remediation passes.

---

## Phase 8 — Backup, Restore, Monitoring, and Incident Operations

### Purpose

Ensure that the marketplace can recover from data deletion, storage loss, deployment failure, provider outage, or security incident.

### Work Scope After `READY — Phase 8`

| Area | Required action |
|---|---|
| MySQL | Confirm provider snapshot/PITR facts; create independent encrypted logical backups where supported; record hashes, schema revision, counts, and recovery-set ID. |
| Object storage | Back up final public/private media and reconciliation manifest to an independent backup-only location; do not treat CDN cache as backup. |
| Redis | Treat as disposable temporary state; reinitialize safely after recovery. |
| Scheduler | Use authenticated external/provider scheduler for backup verification, manifest validation, cleanup, and scanner-health checks. |
| Monitoring | Alert named operators on failed backups, scanner-definition staleness, queue buildup, missing media, API errors, storage failures, and abnormal auth/lockout activity. |
| Restore drills | Restore a complete recovery set to isolated non-production resources quarterly and after any provider/migration change. |
| Incident runbook | Require named operator approval, evidence preservation, isolated validation, controlled cutover, session/secret review, and post-incident record. |

### Validation

1. Restore a known recovery set into a new isolated database/storage target.
2. Verify schema version, row counts, foreign keys, sampled media hashes, account/role behavior, checkout integrity, and private-evidence access.
3. Confirm browser/CDN cache can be purged/rebuilt after media restore.
4. Record RPO/RTO measured during the drill and update the plan if targets are not met.

### Rollback

No production overwrite occurs until isolated restore validation passes. If it fails, maintain current service and investigate the backup set.

---

## Phase 9 — Controlled Production Cutover and Stabilization

### Purpose

Move public traffic gradually after all staging layers pass. Production cutover is an operational event, not a routine frontend deployment.

### Cutover Sequence

| Step | Action | Go/no-go condition |
|---:|---|---|
| 1 | Freeze the release candidate and record versions/configuration. | All staging acceptance tests pass. |
| 2 | Capture final verified database/media recovery set. | Backup manifest and recovery record are valid. |
| 3 | Route a limited technical/staff cohort through the new domain/path. | No security, session, API, media, or checkout regression. |
| 4 | Observe error, latency, auth, upload, cache, and order metrics. | Defined observation period stays within thresholds. |
| 5 | Enable public frontend route while retaining the current managed site as rollback. | Owner approves measured results. |
| 6 | Migrate remaining media/backend traffic only if separately approved. | No unresolved mismatch or operational alert. |

### Immediate Rollback Triggers

1. Login/session errors or cross-user data exposure.
2. Checkout/inventory/order inconsistency.
3. Private evidence/public-media boundary failure.
4. Significant API error-rate/latency regression.
5. Cache serving incorrect account, moderation, or availability data.
6. Missing/incorrect media that cannot be repaired quickly.
7. Backup/recovery evidence not available during the cutover.

### Stabilization

Maintain daily operational review during the first launch period. Do not decommission the original managed baseline until repeated restore drills, service health, and production behavior meet the owner-approved exit criteria.

---

## Immediate Next Step

The next actionable phase is **Phase 1: Governance, Ownership, and Recovery Targets**. It does not require code, provider changes, or deployment work.

Before `READY — Phase 1`, the owner should be ready to answer:

1. Who owns and recovers each service account?
2. What monthly budget is acceptable for the launch stage?
3. What is the initial maximum acceptable data loss and recovery time?
4. Which future domain name(s) should be considered?
5. Who receives outage/security/backup alerts?
6. Is the chosen public architecture Cloudflare Pages + same-origin API routing + current Node backend first, with Hostinger/VPS only as a later independently tested backend stage?

## Related Decision Documents

| Document | Role |
|---|---|
| `CLOUDFLARE_HOSTINGER_ARCHITECTURE_COMPARISON_2026-08-21.md` | Provider fit and operational trade-offs. |
| `CLOUDFLARE_PAGES_PIPELINE_ENVIRONMENT_GUIDE_2026-08-21.md` | Pages build, preview, variable, API-origin, and rollback guidance. |
| `CLOUDFLARE_CACHE_R2_INTEGRATION_BLUEPRINT_2026-08-21.md` | Public cache and R2 media-zone design. |
| `MALWARE_SCANNING_AND_RECOVERY_BLUEPRINT_2026-08-21.md` | Quarantine/scanning and backup/restore architecture. |
| `POSTGRESQL_COMPATIBILITY_INVENTORY_2026-08-21.md` | Read-only MySQL/TiDB-to-PostgreSQL compatibility assessment; PostgreSQL remains optional and non-authoritative in the current hybrid plan. |
