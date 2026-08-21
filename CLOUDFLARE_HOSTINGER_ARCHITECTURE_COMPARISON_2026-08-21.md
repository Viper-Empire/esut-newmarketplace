# ESUT Marketplace — Cloudflare and Hostinger Architecture Comparison

**Assessment date:** 21 August 2026  
**Scope:** Provider fit against the current ESUT Marketplace architecture.  
**Change status:** No hosting, database, DNS, object-storage, Redis, email, source-code, or deployment configuration was changed for this assessment.

## Executive Conclusion

Both providers can contribute useful parts of a future ESUT Marketplace deployment, but **neither should be treated as a complete, turnkey marketplace platform**.

Cloudflare is the stronger choice for the **public edge**: React static delivery, CDN caching, DNS/TLS, WAF controls, scheduled edge work, and S3-compatible R2 object storage. It does **not** replace the marketplace’s MySQL/TiDB-compatible database or Redis service. Cloudflare Workers can technically connect to MySQL through Hyperdrive, but moving the current Express-based backend to Workers requires a meaningful runtime adaptation and should be treated as a dedicated staging project—not a quick deployment setting.[1] [2] [3]

Hostinger is the closer fit for the **current Node/Express runtime**. Its managed Node.js offering supports Express and current Node.js versions, while VPS hosting gives full control for Dockerized Node services and workers. However, a VPS makes the marketplace team responsible for operating-system hardening, patching, database/Redis configuration, backups, monitoring, recovery, and a single-server failure domain. It should not become the first home for all marketplace data and private evidence simply because it is convenient.[4] [5] [6]

> **Recommendation for the present controlled-launch stage:** Retain the current managed full-stack runtime and authoritative MySQL/TiDB-compatible database. If an external infrastructure experiment is authorized later, begin with **Cloudflare Pages/CDN and R2 only in a non-production environment**, while keeping a Node-compatible API runtime and external MySQL/Redis. Do not migrate the Express/tRPC backend to Cloudflare Workers or place MySQL, Redis, private evidence, and the API on one self-managed VPS without passing a separate staging, recovery, security, and concurrency-validation program.

## Current Architecture Being Evaluated

| Layer | Current ESUT Marketplace responsibility | Non-negotiable boundary |
|---|---|---|
| Experience | React 19, TypeScript, Vite, Tailwind CSS, responsive buyer/seller/admin interfaces. | Frontend is CDN-suitable but must not hold service credentials or make authorization decisions. |
| Application/API | Express 4, tRPC 11, Drizzle ORM, server-side validation and business rules. | API must remain the only layer that can access data services and issue protected file access. |
| Identity and authorization | First-party password flows, server-tracked sessions, roles, account lockouts, reauthentication, audit history. | Authentication, roles, sessions, and security decisions cannot depend on delayed analytics or browser state. |
| Commerce | Transactional checkout, idempotent order batches, inventory reservations, order/pickup transitions, review eligibility. | Orders and stock must remain together in one authoritative relational transaction model. |
| Primary data | Managed MySQL/TiDB-compatible database, with 42 application tables and live relational constraints. | MySQL remains the source of truth for all current marketplace facts. |
| Temporary security state | Redis-backed short-lived lockouts, rate limits, and bounded controls. | Redis is private, ephemeral, and never the source of truth. |
| Files | Managed S3-compatible storage through a server-side proxy. | Media bytes remain outside the relational database; private evidence requires backend authorization. |
| Operations | Resend adapter, controlled scheduled endpoints, privacy-minimized telemetry, administrator health views. | Email, scheduling, logs, recovery, and monitoring must remain server-side and auditable. |

## Provider Capability Matrix

| Architecture need | Cloudflare fit | Hostinger fit | Assessment for ESUT Marketplace |
|---|---|---|---|
| React/Vite frontend, CDN, TLS, SPA routing | **Strong.** Pages/Workers static assets and Cloudflare edge services fit this layer well. | **Supported.** Hostinger can host static and Node web applications. | Cloudflare is the stronger edge/CDN option; Hostinger is acceptable but not the differentiator. |
| Current Express/tRPC API | **Conditional.** Workers has a subset of Node APIs and can use MySQL drivers via Hyperdrive, but Workers is not a standard persistent Node process. | **Strong.** Managed Node supports Express and Node 18/20/22/24; VPS provides full process/runtime control. | Hostinger is closer to the current runtime. Cloudflare Workers needs a compatibility spike and code adaptation. |
| MySQL/TiDB-compatible source of truth | **External dependency.** Hyperdrive accelerates external MySQL/PostgreSQL connections; Cloudflare is not the database provider. | **Available, but model-dependent.** MySQL is available across plans; VPS enables full administration. | Retain the present managed MySQL/TiDB source of truth until an independently validated move is justified. |
| PostgreSQL analytics/telemetry support | **External dependency.** Hyperdrive can connect to external PostgreSQL. | **VPS responsibility.** Hostinger says PostgreSQL is supported on VPS, requiring self-management. | PostgreSQL should remain optional, derived, and non-authoritative if used later. |
| Redis for lockouts/rate limiting | **External dependency.** Workers KV is not a drop-in Redis replacement for security-critical atomic controls. | **VPS responsibility.** Hostinger states Redis requires self-managed VPS configuration. | Retain an external managed Redis service rather than adopting eventually consistent KV or self-hosting prematurely. |
| Public/private/quarantine object storage | **Strong.** R2 is object storage with bucket-scoped tokens, public bucket controls, CORS, and location hints. | **Possible but operationally heavy.** VPS MinIO-like storage must be secured, backed up, and operated by the team. | Cloudflare R2 is the better future candidate for the three-zone media model. |
| Malware/content scanning | **External/application responsibility.** R2 does not itself provide a marketplace upload-safety workflow. | **External/application responsibility.** VPS can run a scanner but makes operations the team’s responsibility. | Neither provider removes the need for a deliberate quarantine, scan, and promotion pipeline. |
| Scheduler and queued work | **Strong.** Workers supports cron triggers and queues, but current scheduler authentication/entry points need adaptation. | **Strong on VPS.** Cron/systemd/container-worker patterns are possible; managed Node scheduling behavior needs plan-specific confirmation. | Both can support it; do not rely on browser timers. |
| WAF, DDoS, edge protection | **Strong.** Cloudflare is the clear advantage at the public edge. | **Partial.** VPS firewall and TLS are possible but the team configures and maintains them. | Cloudflare is preferable at the public edge regardless of API host. |
| Logs, metrics, alerts | **Partial.** Worker observability covers Workers; database/Redis/backup monitoring remains external. | **Partial.** Managed dashboards/logs exist, but production alerting and recovery monitoring need extra setup. | Use provider signals plus independent uptime/error/backup alerts. |
| Backup and disaster recovery | **External/shared responsibility.** R2 durability is not a complete backup/restore strategy; database recovery remains the database provider’s responsibility. | **Self-managed on VPS.** VPS backups do not replace verified database/object-storage recovery. | Keep provider-independent exports, tested restore steps, and off-server backups. |

## What the Provider Reports Got Right

### Cloudflare Assessment

The Cloudflare agent correctly identified that Cloudflare should not be considered a managed MySQL, PostgreSQL, or Redis provider for this architecture. Cloudflare’s D1 database uses SQLite SQL semantics, so it is not a compatible replacement for the current MySQL/TiDB commerce system.[7]

The report is also directionally correct about R2. R2 is a strong fit for the proposed storage-zone model: a public-media bucket, a private-evidence bucket without public delivery, and a quarantine/processing bucket. However, bucket separation alone is not sufficient; backend ownership checks, signed access, retention, and a scanning/promotion policy remain required.[8]

Hyperdrive is a genuine option for connecting Workers to external MySQL or PostgreSQL. Official documentation confirms that it supports MySQL/PostgreSQL, works with existing drivers/ORMs, and maintains database connection pools. Cloudflare’s MySQL example requires `mysql2` compatibility configuration and a new connection per Worker request, with Hyperdrive owning the underlying pool.[2] [3]

### Hostinger Assessment

The Hostinger agent correctly classified the current app as a full-stack Node application rather than a Website Builder, WordPress, or basic shared-hosting project. Official guidance confirms current support for Express and Node.js 18, 20, 22, and 24 on supported Node.js web-app plans.[4]

The assessment is also correct that Hostinger VPS is the path for maximum runtime and Docker control. Hostinger’s Docker manager can deploy Compose workloads and configure restart policies, but this moves operational responsibility to the marketplace team.[6]

Hostinger’s official database guidance confirms that Redis and PostgreSQL require VPS hosting and self-managed installation/configuration; MySQL is supported across plans but must be assessed for the required connection, backup, privilege, and operations model.[5]

## Important Corrections and Caveats

| Provider claim or implication | Correct interpretation for this marketplace |
|---|---|
| “Express can run on Workers.” | **Technically possible, not drop-in.** The current entry point creates an HTTP server, checks local ports with `net`, calls `app.listen`, uses Express middleware, and embeds current scheduler routes. Workers requires a request-handler architecture and cannot simply run the current `startServer()` implementation. |
| “Node compatibility means every Node dependency works.” | Workers supports a subset of Node APIs; some modules may be partially supported or only importable as non-functional stubs. Compatibility must be proven with the real bundle and dependencies, not assumed.[1] |
| “Workers can accept the current upload implementation.” | **High risk without redesign.** Workers isolates have a 128 MB memory limit. The current Express entry allows large request bodies and includes buffered/base64 media handling. A future Worker path should use streaming or direct signed upload to quarantine storage, then server-side validation/promotion.[2] [9] |
| “Cloudflare pricing is about $5–$6/month.” | Treat this only as a provider-agent estimate. The total cost still includes external MySQL, Redis, Resend, monitoring, backup storage, domains, and scanning. Current plan terms must be confirmed in the owner’s account before any purchase decision. |
| “Hostinger managed Node process sleeps after inactivity.” | This point was asserted by the agent but was **not confirmed in the official sources reviewed**. Treat it as an open question for Hostinger support. It matters because scheduled commerce work must be reliable. |
| “VPS can host everything.” | It can, but doing so creates a single failure domain and makes the owner responsible for operating-system updates, secrets, databases, Redis, file storage, monitoring, backup, incident response, and restore testing. |
| “Cloudflare R2 provides upload safety.” | R2 provides object storage; it does not replace MIME validation, malware/content scanning, or a quarantine-promotion workflow. |

## Current-Code Implications

The present API runtime is a traditional Node/Express server. Its entry point imports `dotenv`, Express, Node HTTP, Node `net`, Express tRPC middleware, static-file/Vite helpers, and scheduler route registration; it creates an HTTP server and calls `listen()`.[10]

This has different implications for each provider:

| Target | Consequence |
|---|---|
| Cloudflare Pages only | The frontend can be moved, but frontend/API origins, tRPC endpoint configuration, CORS, credentialed cookie behavior, and static asset handling would need staging validation. |
| Cloudflare Workers API | The Express entry point must be replaced/adapted to a Workers fetch handler; the tRPC adapter, context/cookie plumbing, storage proxy, schedules, environment access, uploads, and database driver setup must be validated. |
| Hostinger managed Node | The existing build/start model is much closer to the current application. The remaining questions are long-running-process behavior, external service network access, deployment rollback, and scheduler reliability. |
| Hostinger VPS | The Node app can run with its existing runtime model, but the team takes responsibility for hardening and operating all chosen services. |

## Recommended Service Responsibilities

The following assignment protects the free-tier MySQL database from analytics/telemetry load without creating a dangerous multi-primary architecture.

| Service | Recommended responsibility | Must not own |
|---|---|---|
| MySQL/TiDB-compatible database | Authoritative users, roles, sellers, listings, inventory, carts, orders, pickup, reviews, cases, audits, and operational settings. | File bytes, redundant analytics copies used for transactional decisions, temporary lockouts. |
| PostgreSQL, if later activated | Rebuildable telemetry, daily analytics rollups, historical charts, and potentially a safe public-search projection. | Live stock, checkout, roles, sessions, orders, pickup, private evidence authorization, or any required real-time commerce decision. |
| Redis | Expiring lockouts, rate limits, short-lived counters, and other private temporary security state. | Permanent marketplace records or unbounded event history. |
| Object storage | Public media, private evidence, and quarantine uploads as distinct zones. | Access-control decisions by URL alone or relational business facts. |
| Cloudflare, if adopted | Public edge, CDN/WAF, static frontend delivery, and potentially R2. | Native replacement for MySQL/TiDB or Redis. |
| Node-compatible API host | Server-side tRPC rules, authorization, transactions, signed private-media access, service orchestration, and schedule endpoints. | Browser-delivered secrets or database access directly from client code. |

## Deployment Options and Recommendation

| Option | Benefits | Material risks | Recommendation |
|---|---|---|---|
| **A. Keep current managed controlled-launch stack** | No migration risk; current features, security tests, MySQL, Redis, storage proxy, and operational telemetry are already validated. | Does not yet deliver the desired external hosting ownership model. | **Recommended now.** |
| **B. Cloudflare Pages/CDN first; retain current Node API and MySQL/Redis** | Lowers public-edge load and tests Cloudflare for static delivery. | Requires frontend/API origin, cookie/CORS, deployment, and rollback validation. | **Best first external experiment** after a domain/staging decision. |
| **C. Cloudflare R2 storage-zone project; retain current API/runtime** | Strong fit for public/private/quarantine media zones and future CDN efficiency. | Requires backend storage adapter work, data migration, access-policy review, media scan design, and storage metadata reconciliation. | **Strong future infrastructure project**, separate from frontend move. |
| **D. Cloudflare Workers full API migration + Hyperdrive** | Global edge execution, pooled external database access, integrated cron/queues/security edge. | Requires runtime rewrite/adaptation, dependency spike, upload redesign, per-request DB model, worker-specific test suite, and no production assumption. | **Do not select as the first external move.** Explore only after an isolated compatibility spike. |
| **E. Hostinger managed Node with external MySQL/Redis/object storage** | Closest path to the existing Express runtime; lower code adaptation than Workers. | Need verified support answers for persistent/background job behavior, secure external service connections, staging/deployment rollback, and operational monitoring. | **Viable staging candidate**, subject to support confirmation. |
| **F. Hostinger VPS running API plus self-hosted MySQL/Redis/storage** | Full control and traditional deployment model. | High student-operator burden; single failure domain; patching, backup, monitoring, recovery, storage durability, and security become owner responsibilities. | **Not recommended for the current controlled-launch stage.** |

## Low-Cost Architecture Path

The most conservative future evolution is not a single-provider move. It is a deliberately separated service architecture:

```text
Cloudflare Pages / CDN / WAF
          ↓
Node-compatible API runtime
          ├── Managed MySQL/TiDB-compatible database (authoritative)
          ├── Managed Redis (temporary security state)
          ├── Managed object storage
          │     ├── public media
          │     ├── private protected evidence
          │     └── quarantine processing
          ├── Resend (transactional email)
          ├── External malware/content scanning
          └── Independent monitoring and off-service backups

Optional later:
          └── PostgreSQL (derived telemetry/analytics/search projections)
```

This lets individual services scale only when they need to scale. It avoids making the free MySQL service carry unbounded telemetry, but it does not split checkout or inventory across databases.

## Required Validation Before Any Provider Move

| Validation area | Minimum acceptance criterion |
|---|---|
| API runtime | The real app builds and serves public and protected tRPC routes in staging without Node/runtime errors. |
| Authentication | Secure cookies, session tracking, logout/revocation, lockout countdown, and role protections work on the proposed frontend/API origin model. |
| Commerce | Duplicate checkout, concurrent stock reservation, cancellation, pickup code, seller transitions, and buyer/seller/admin scopes preserve existing behavior. |
| Database | TLS connection, least-privilege access, backups, restore drill, connection limits, migration discipline, and no public direct access are proven. |
| Redis | TLS, secret storage, TTL behavior, outage fallback, and per-provider connection behavior pass security regression tests. |
| Storage | Public/private/quarantine boundaries, signed access, retention, scan/promotion, media migration, and denied private access are proven. |
| Scheduler | Reservation expiry, reminders, telemetry tasks, job authentication, retries, and failures are observable and safe. |
| Operations | Health checks, logs, alerts, rollback, temporary-domain validation, and a defined owner/escalation path exist before DNS cutover. |

## Decision Gates

No infrastructure move is recommended until the owner makes these decisions:

1. Confirm whether the next goal is only a **Cloudflare frontend/CDN trial**, an **R2 storage-zone project**, a **Hostinger Node staging trial**, or no external move yet.
2. Confirm which organization account owns domain/DNS, MySQL, Redis, storage, email, monitoring, backups, and provider billing.
3. Confirm that the sender-domain, backup/restore, and operational alert ownership prerequisites are resolved before broader public launch.
4. Authorize a non-production environment and a temporary domain only; do not cut over production DNS until the validation matrix passes.
5. Give explicit `READY` authorization before source, storage, database, DNS, hosting, or deployment changes begin.

## References

[1]: [Cloudflare Workers Node.js compatibility](https://developers.cloudflare.com/workers/runtime-apis/nodejs/)

[2]: [Cloudflare Workers platform limits](https://developers.cloudflare.com/workers/platform/limits/)

[3]: [Cloudflare Hyperdrive overview and MySQL support](https://developers.cloudflare.com/hyperdrive/)

[4]: [Hostinger: deploy a Node.js web app](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/)

[5]: [Hostinger: supported databases and data tools](https://www.hostinger.com/support/which-databases-and-data-tools-are-supported-at-hostinger/)

[6]: [Hostinger: VPS Docker Manager deployment](https://www.hostinger.com/support/12040815-how-to-deploy-your-first-container-with-hostinger-docker-manager/)

[7]: [Cloudflare D1 overview](https://developers.cloudflare.com/d1/)

[8]: [Cloudflare R2 overview](https://developers.cloudflare.com/r2/)

[9]: [Cloudflare Hyperdrive MySQL driver example](https://developers.cloudflare.com/hyperdrive/examples/connect-to-mysql/mysql-drivers-and-libraries/mysql2/)

[10]: [Current ESUT Marketplace Node/Express entry point](server/_core/index.ts)

## Source Material Evaluated

The assessment also reviewed the provider-agent reports supplied by the owner: `pasted_content_10.txt` (Cloudflare) and `pasted_content_11.txt` (Hostinger). Provider-reported pricing, limits, and product entitlements are treated as preliminary and should be confirmed in the applicable owner account before any purchase or migration decision.
