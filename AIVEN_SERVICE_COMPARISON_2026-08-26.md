# Aiven Service Options Compared with ESUT Marketplace

**Prepared by Manus AI · 26 August 2026**

## Executive conclusion

The five services in `pasted_content_4.txt` are not five interchangeable databases. They cover different architectural responsibilities: PostgreSQL is a transactional relational database, Apache Kafka is an event-streaming backbone, OpenSearch is a search and log-analytics engine, ClickHouse is an analytical warehouse, and Valkey is an in-memory cache/session/queue service.

For the current ESUT Marketplace, **do not adopt all five**. The existing application already has a MySQL/TiDB-compatible primary database, Redis-style short-lived security state, Cloudinary for public media, private object storage for evidence, and a managed application host. The most useful future Aiven service is **Valkey as a Redis-compatible replacement or secondary cache**, but only if the current Redis service becomes inadequate. PostgreSQL is useful for a future deliberate database migration, not as a second primary database. OpenSearch becomes useful when the catalogue, logs, or search relevance outgrow database-backed search. Kafka and ClickHouse are later-stage systems and would add substantial operational complexity today.

## What each service does

| Service | Core responsibility | Best fit in ESUT Marketplace | Current recommendation |
|---|---|---|---|
| **PostgreSQL** | Structured relational transactions, constraints, joins, JSONB, extensions such as PostGIS. Aiven describes it as a managed relational database for organised tabular data and advanced extensions [1]. | A future replacement for the current MySQL/TiDB primary database, or a separate analytics/reporting store only after a clear data-ownership design. | **Do not add as a second primary database now.** |
| **Apache Kafka** | Durable event streaming, asynchronous integration, and high-throughput data pipelines. Aiven positions it for event-driven applications, data pipelines, and stream processing [2]. | Publishing events such as `order.created`, `listing.approved`, and `message.sent` to independent consumers. | **Not needed at current scale.** Use an outbox/queue pattern first. |
| **OpenSearch** | Distributed full-text search, JSON document indexing, aggregations, logs, and dashboards. Aiven describes it as a search and analytics suite with a Lucene-based search engine and REST API [3]. | Faster catalogue search, typo tolerance, relevance ranking, filter facets, and centralized log search. | **Potential medium-term addition**, after measuring database-search limits. |
| **ClickHouse** | Distributed columnar OLAP database/data warehouse for complex analytical queries over large datasets. Aiven explicitly distinguishes it from relational systems and positions it for real-time analytical reports [4]. | Historical sales, marketplace funnel, seller performance, traffic, and operational analytics without burdening MySQL. | **Later-stage analytics option**, not a transactional store. |
| **Valkey** | In-memory key/value and data-structure store compatible with Redis OSS 7.2.4, suited to transient data, caching, sessions, and distributed coordination [5]. | Session state, rate limits, lockouts, short-lived cache entries, idempotency windows, and possibly queue-like transient work. | **Most immediately relevant**, but only as a controlled replacement/extension of the existing Redis role. |

## Fit with the current ESUT architecture

The current architecture should continue to have one authoritative transactional database. Users, roles, stores, listings, inventory, carts, orders, disputes, reviews, notifications, and audit records must not be split casually across multiple database engines. A second primary database would introduce dual-write failure modes, reconciliation work, migration complexity, and unclear ownership of business truth.

Aiven PostgreSQL could be valuable if ESUT later chooses a planned migration from MySQL/TiDB. That would require schema translation, migration rehearsal, query compatibility testing, transaction and locking comparisons, backup/restore validation, cutover and rollback planning, and a period of read-only or shadow verification. It is **not** a low-risk way to reduce load on the current MySQL service by copying arbitrary tables into PostgreSQL.

Valkey is the closest match to an existing responsibility because the project already uses Redis-style state for login lockouts, temporary rate limits, and protected telemetry limits. Aiven documents Valkey as suitable for transient data, caching, session management, and distributed caching, while also warning that it is not inherently a persistent storage solution [5]. If adopted, it should contain rebuildable or short-lived state, not orders, inventory, evidence metadata, or audit history.

OpenSearch would be useful if the marketplace needs relevance-ranked search over a large catalogue or if operational logs become difficult to investigate. It must remain a derived index: MySQL/TiDB remains the source of truth, and listing changes publish index updates only after the authoritative transaction succeeds. Search must degrade gracefully if OpenSearch is unavailable.

Kafka would be justified only when multiple independent consumers need durable asynchronous events, such as search indexing, analytics ingestion, notifications, fraud signals, and data export. Until then, it would add topics, consumer groups, replay policy, idempotency, schema evolution, dead-letter handling, monitoring, and another failure surface for a student-built marketplace.

ClickHouse would be useful when analytical queries over order and activity history materially compete with marketplace transactions. It is designed for OLAP/data-warehouse workloads, not cart, checkout, inventory reservation, or account authorization [4]. It should receive derived, privacy-reviewed events or periodic exports rather than become an operational dependency for storefront requests.

## Free-tier reality

Aiven’s official free-tier page states that its always-free services are intended for learning, prototypes, and small workloads, with capped resources; it specifically lists 1 GB RAM for PostgreSQL, 1 GB RAM for MySQL, up to 250 KB/s Kafka ingress/egress with up to three days of retention, 20 GB OpenSearch storage with 4 GB RAM, and 1 GB Valkey RAM [6]. The same page states that free services are single-node and are **not aimed at production workloads**, even though they include managed infrastructure, monitoring, and automated backups [6].

This matters for ESUT because the system is a real marketplace with authentication, orders, inventory, moderation, private evidence, and audit history. A free service can be useful for learning or a non-authoritative derived workload, but a production decision must account for single-node failure, capped connections/throughput, backup retention, regional latency, network costs, and the absence of high availability on the free tier.

## Recommended adoption sequence

| Stage | Decision | Why |
|---|---|---|
| **Now** | Keep MySQL/TiDB as the sole source of transactional truth; keep existing Redis responsibilities; keep Cloudinary/public media and private evidence storage separated. | Lowest operational risk and no dual-write problem. |
| **First optional addition** | Evaluate Aiven Valkey only if the current Redis capacity, reliability, or hosting boundary becomes a measured problem. | Closest responsibility match and Redis compatibility, but migration still requires key namespace, TTL, TLS, failover, and cache-loss testing. |
| **Next** | Add OpenSearch as a rebuildable catalogue/search index if database-backed search becomes slow or relevance requirements expand. | Improves search without moving transactional truth. |
| **Later** | Add ClickHouse for derived reporting when admin analytics becomes historically large or expensive on MySQL. | Offloads OLAP without affecting checkout correctness. |
| **Much later** | Add Kafka when multiple durable event consumers and replayable integration are genuinely required. | It is an event backbone, not a replacement for the application database or cache. |
| **Separate decision** | Consider PostgreSQL only as a deliberate migration target or a carefully scoped secondary store. | Running MySQL and PostgreSQL together does not automatically reduce MySQL load and increases operational complexity. |

## Security and reliability rules if any service is adopted

Each service must have a single documented responsibility, separate credentials, TLS-enforced connections, least-privilege service users, private network access where available, explicit backup/restore tests, resource and connection limits, and a failure-mode policy. The application must continue to function safely when a derived system is unavailable. In particular, OpenSearch, Kafka, ClickHouse, and Valkey must never become an authorization source or an authority for inventory availability.

The current project should not expose any Aiven connection string to the React frontend. Connections belong in server-side environment variables, and any new secret must be added through the project’s managed secret workflow. No Aiven service was created, connected, migrated, or modified as part of this analysis.

## Final recommendation

**Aiven is potentially useful, but the service list is broader than ESUT Marketplace currently needs.** If the goal is to reduce pressure on the current free infrastructure, first measure database query latency, connection saturation, cache hit rate, request volume, and analytics query cost. Do not add infrastructure merely because it is available for free. Based on the current architecture, the practical order is: **existing MySQL/TiDB and Redis now; Valkey only if justified; OpenSearch when search demands it; ClickHouse when analytics demands it; Kafka only when event-driven scale demands it; PostgreSQL only through a deliberate migration or explicitly bounded secondary-store plan.**

## References

[1]: https://aiven.io/docs/products/postgresql "Aiven for PostgreSQL documentation"

[2]: https://aiven.io/docs/products/kafka "Aiven for Apache Kafka documentation"

[3]: https://aiven.io/docs/products/opensearch "Aiven for OpenSearch documentation"

[4]: https://aiven.io/docs/products/clickhouse "Aiven for ClickHouse documentation"

[5]: https://aiven.io/docs/products/valkey "Aiven for Valkey documentation"

[6]: https://aiven.io/free-tier "Aiven Free Tier"
