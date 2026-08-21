# ESUT Marketplace — Cloudflare Cache and R2 Integration Blueprint

**Status:** Architecture blueprint only.  
**Change status:** No Cloudflare account, DNS, cache rule, R2 bucket, storage credential, source code, database, or deployment configuration was changed.  
**Primary rule:** The existing MySQL/TiDB-compatible database remains the authoritative source for every marketplace fact.

## Executive Summary

Cloudflare can reduce MySQL workload in two different ways, but the two services solve different problems:

| Cloudflare capability | Primary benefit | Does it reduce MySQL queries? |
|---|---|---:|
| **CDN cache** | Serves repeat public responses and static assets from Cloudflare edge locations rather than the Node application origin. | **Yes**, when restricted to carefully selected public read responses. |
| **R2 object storage** | Serves media from object storage instead of the application origin and supports a public/private/quarantine media model. | **Indirectly.** It reduces origin bandwidth and upload work; database metadata queries still need their own cache strategy. |

> **Do not cache the whole API.** The current `/api/trpc` endpoint carries both public and authenticated traffic. A broad CDN rule for that endpoint could leak private dashboard/order data or serve a user another person’s cached response. The safe path is to cache only explicitly designed, anonymous public read routes and leave all authenticated, transactional, and security-sensitive routes uncacheable.

## Existing Architecture and Current Constraint

The marketplace currently uses an Express/tRPC backend backed by a MySQL/TiDB-compatible relational database, with Redis for short-lived security state and managed S3-compatible storage for files. The React client uses `httpBatchLink` against the shared `/api/trpc` API path.[1] [2]

That means the database load that Cloudflare can safely reduce is mainly:

1. Repeated anonymous reads of public catalogue data.
2. Repeated delivery of static JavaScript, CSS, logos, and safe public media.
3. Repeated public image/video delivery that should not transit the Node API/runtime.

It must **not** reduce load by caching a buyer’s dashboard, seller workspace, administrator queue, cart, order, session state, price-sensitive checkout state, private case evidence, or any authorization response.

## Database-Load Classification

| Workload | Example current capability | Cache policy | Reason |
|---|---|---|---|
| Static application assets | Hashed JavaScript/CSS bundles, public fonts, favicon, optimized logo. | Cache at CDN/browser with long immutable TTL. | Content-addressed assets can be safely reused and do not require MySQL. |
| Public brand/category assets | Public category images and non-user-sensitive artwork. | Long CDN TTL; versioned paths. | Safe public media changes infrequently. |
| Public homepage shelves | Active listings, categories, verified-store selections, discovery shelves. | Explicit anonymous public cache, short CDN TTL and stale-while-revalidate. | Reduces repeated public-home database reads while accepting brief staleness. |
| Public catalogue/search | Anonymous category, sort, and pagination results. | Explicit anonymous public cache, short TTL; cache key must include safe normalized query parameters. | Popular queries can otherwise repeat database joins and listing/media lookups. |
| Public product detail | Public listing/store/category fields and public approved media. | Short TTL, or separate stable listing projection from dynamic availability. | Product details are cacheable only if stock/status freshness is handled deliberately. |
| Public review summary | Published, public, completed-order-derived review aggregates. | Short-to-medium TTL with purge on review moderation/create event. | Public and read-heavy, but changes after reviews/moderation. |
| Stock and listing availability | Available unit display, listing moderation status. | Do not broadly cache; use a very short public read TTL or a separate dynamic endpoint. | Incorrectly stale availability can mislead buyers. Checkout remains MySQL-authoritative regardless. |
| Buyer/seller/admin workspaces | Account, orders, messages, seller operations, analytics, moderation queues. | `private, no-store`; bypass shared CDN cache. | Contains personalized, role-sensitive, or operationally live information. |
| Checkout and order mutations | Add-to-cart, checkout, order transitions, pickup code verification. | Never cache. | Requires immediate authorization, idempotency, transactions, and current inventory. |
| Authentication/security | Login, registration, sessions, lockout response, password reset/change. | Never cache. | Cookies, credential state, rate limits, and security errors are user-specific. |
| Private documents/evidence | Seller identity documents, reports/disputes, moderation evidence. | Never public-cache. Issue short-lived, authorization-checked signed retrieval only. | URLs are bearer credentials during their validity period and evidence is private by default.[6] |

## Recommended Cache Architecture

```text
Browser
   │
   ├── Cloudflare CDN
   │     ├── cache immutable static assets
   │     ├── cache approved public media
   │     └── cache explicit anonymous public JSON read endpoints
   │
   └── Node / Express / tRPC API
          ├── MySQL: authoritative commerce, accounts, and safety records
          ├── Redis: temporary security state only
          └── Object storage: media bytes and evidence

Cloudflare cache miss
   ↓
Node API reads MySQL
   ↓
Only explicit anonymous public response receives cacheable headers
   ↓
Cloudflare reuses response until TTL or targeted purge
```

## Cache-Control Policy

Cloudflare respects origin `Cache-Control` behavior on Free, Pro, and Business plans by default, and Cache Rules can augment or override origin cache policy.[3] The backend should become the source of truth for safe response classification; Cloudflare rules should enforce an allowlist, not accidentally broaden caching.

| Response class | Origin header target | Cloudflare configuration intent |
|---|---|---|
| Hashed static build assets | `public, max-age=31536000, immutable` | Cache long-term; new build filenames naturally invalidate old assets. |
| Public logo/category/media with versioned object keys | `public, max-age=2592000, immutable` | Cache for approximately 30 days; update by using a new versioned key, not overwriting bytes at the same path. |
| Public homepage projection | `public, max-age=60, s-maxage=300, stale-while-revalidate=60` | Browser sees a short cache; edge may serve a five-minute copy and refresh it in background. |
| Public catalogue/search projection | `public, max-age=30, s-maxage=60, stale-while-revalidate=30` | Minimize repeated search/list reads while limiting stale results. |
| Public product stable details | `public, max-age=60, s-maxage=120, stale-while-revalidate=30` | Cache title, description, approved media, and store presentation briefly. |
| Availability/status projection | `public, max-age=0, s-maxage=10, must-revalidate` or do not edge-cache | Keep stock/status close to current; checkout still validates directly in MySQL. |
| Any signed-in or sensitive response | `private, no-store` | Explicitly bypass shared CDN caching. |

The exact values should be tuned from observed traffic and error/latency data; the values above are cautious starting targets rather than a claim that all public data should be stale for the same duration. Cloudflare documents `public`, `private`, `no-store`, `max-age`, `s-maxage`, and `stale-while-revalidate` semantics for controlling shared and browser caches.[3]

## tRPC Boundary: The Required Design Change

The current client sends tRPC traffic to the shared `/api/trpc` endpoint through `httpBatchLink`.[2] This is appropriate for typed application calls, but it should not be globally cached because the same transport hosts private and public procedures.

The safe future pattern is:

| Design element | Requirement |
|---|---|
| Default `/api/trpc` rule | **Bypass Cloudflare cache** for the entire generic tRPC path unless and until an endpoint is proven anonymous and cache-safe. |
| New public read surface | Add a small, explicit public-read endpoint family, such as `/api/public/home`, `/api/public/catalogue`, `/api/public/listings/:slug`, and `/api/public/reviews/:listingId`. |
| Public endpoint contract | Return only data already permitted to unauthenticated visitors; never inspect or personalize from cookies, authorization headers, session state, cart state, or role. |
| Cache key | Include only normalized public query inputs: page, category, sort, public search term, and safe filters. Exclude cookies, user IDs, sessions, headers containing authorization, and hidden internal filters. |
| Error response policy | Do not cache authentication failures, validation errors, 429 responses, 5xx responses, or any response that sets cookies. |
| Write/mutation path | Keep all writes on protected tRPC procedures, not on cacheable public endpoints. |

This separation lets the public storefront avoid repeated database reads without weakening the current typed, role-aware tRPC design.

## Cache Invalidation Model

Time-to-live alone is not enough for marketplace freshness. When a relevant write succeeds, the backend should purge only the affected public cache keys. Cloudflare supports purge by URL, tag, hostname, prefix, and other scopes; single-URL purge is the preferred general method.[4]

| MySQL-authoritative event | Public cache entries to invalidate after the database transaction commits |
|---|---|
| Listing created, edited, published, paused, flagged, archived, or deleted | Listing detail, listing media/preview, store page, affected catalogue/search query pages, homepage shelf if eligible. |
| Inventory quantity/reservation changes to public availability | Listing availability projection and any listing/card response that displays availability. Do not attempt to make cache the stock authority. |
| Store status, verification, name, public description, or storefront configuration changes | Store page, seller cards, listing detail seller section, and homepage/store shelves where applicable. |
| Category activation/name/image changes | Category navigation, homepage categories, catalogue filters, and related listing views. |
| Published review, moderation action, or seller response | Listing review summary and store rating/review projections. |
| Public product-media replacement/removal | Specific media URL, listing detail/gallery, and card preview URL where the visual changes. |

### Invalidation Safety Rules

1. **Commit first, purge second.** The MySQL write/transaction succeeds before a purge request is submitted; otherwise a failed transaction could erase a valid cache unnecessarily.
2. **Purge narrowly.** Avoid “purge everything” for ordinary seller/admin activity. It destroys cache efficiency and can create an origin/database thundering herd.
3. **Version public media.** A new content-addressed object key is safer than overwriting an existing media path. The CDN then treats new content as a new asset without depending on an urgent purge.
4. **Never cache the mutation response.** The frontend should invalidate its TanStack Query client cache after a mutation while Cloudflare invalidates only the safe public edge views.
5. **Observe purges.** Record a privacy-safe operational event when a public-cache purge fails; do not expose API tokens or response bodies to the browser.

## R2 Storage Architecture

R2 should replace or complement the current managed S3-compatible storage only through a separate storage project. R2 is S3-compatible object storage with bucket-scoped controls, public-bucket capability, CORS configuration, and location hints.[5] It should be organized by security boundary, not merely file type.

| R2 bucket | Permitted content | Public access | Required backend policy | Lifecycle direction |
|---|---|---|---|---|
| `esut-public-media` | Approved listing images, explicitly public avatars, approved storefront/brand assets, approved public review images. | Custom public domain/CDN delivery only after approval. | Only backend service credential writes; database stores key/mime/size/ownership/approval metadata. | Long retention while referenced; remove orphan files after a verified grace period. |
| `esut-private-evidence` | Seller verification documents, case/report/dispute evidence, moderation-sensitive video/media. | **None.** No public bucket/domain. | Backend checks authenticated role/ownership/case relationship, then issues short-lived signed GET only. | Retain by approved evidence policy; never auto-promote to public. |
| `esut-quarantine-uploads` | New uploads pending server validation, signature verification, scanning, transformation, and content-policy decision. | **None.** No public bucket/domain. | Server creates a scoped upload intent; browser receives a short PUT URL for one object/key/type only. | Expire unfinalized objects promptly; retain scan failures only as policy requires. |

R2 supports presigned GET/PUT/HEAD/DELETE URLs with a defined expiry. These URLs are bearer tokens and must be treated as sensitive; Cloudflare recommends content-type restriction and CORS controls for browser upload flows.[6]

## Safe Direct-Upload Flow

The current application includes browser-side image optimization and server-side validation, but parts of the existing upload experience pass file data through the Node API. A future R2 flow can reduce Node memory/bandwidth pressure by letting the browser upload a validated, single-use target object directly to the quarantine bucket.

```text
1. Authenticated user chooses file
       ↓
2. Node API verifies account, seller/case ownership, purpose, filename/type/size policy
       ↓
3. Node API creates a short-lived upload intent and an exact quarantine object key
       ↓
4. API returns short-lived, scoped R2 PUT URL — no permanent R2 credential
       ↓
5. Browser uploads directly to quarantine bucket under exact CORS/type constraints
       ↓
6. Server verifies object metadata/signature and performs scan/transform/review workflow
       ↓
7. Only successful finalization creates/updates the MySQL media metadata record
       ↓
8. Server copies/promotes object to public or private destination and deletes quarantine object
```

The object must not become a published listing image, private case file, or public review image merely because an upload completed. MySQL retains the authoritative metadata and publication/visibility state.

## Media-Safety Controls

| Control | Requirement |
|---|---|
| Upload authorization | Authenticate the user and verify seller/listing/case ownership before issuing any upload URL. |
| Exact target | Presign a single operation against one server-created object key; never let the browser choose an arbitrary private path. |
| Type/size enforcement | Sign permitted content type where supported, enforce server-side byte/format validation after upload, and retain current allowed MIME/signature policy. |
| CORS | Allow only approved marketplace staging/production origins and required methods/headers. |
| Scan and review | Run malware/content checking in quarantine before promotion. Neither R2 nor a browser MIME label substitutes for validation. |
| Private access | Require backend authorization for every private evidence retrieval; signed URLs should be short-lived and never logged in UI/audit projections. |
| Lifecycle | Apply lifecycle deletion/transition rules by bucket or prefix. R2 lifecycle rules support expiration and storage-class transitions, but deletion timing is asynchronous and must not replace application-side legal/safety retention decisions.[7] |
| Cleanup | Track incomplete/failed upload intents and delete abandoned quarantine objects through an authenticated scheduled task. |

## What R2 Does Not Solve

R2 is valuable for media delivery and the three-zone design, but it does **not** by itself solve these database responsibilities:

| Still owned by MySQL/API | Why |
|---|---|
| Listing, media ownership, and publication state | Object presence is not proof that a seller may publish it. |
| Inventory availability and checkout | R2 has no role in stock transactions, reservations, order IDs, or pickup state. |
| Private evidence authorization | R2 URL possession must not decide who may read protected evidence. |
| Seller/moderator decisions | Trust workflows remain in role-guarded backend procedures and audit logs. |
| Search/catalogue data | R2 objects are not a relational listing/search database. |

## Staged Adoption Plan

| Stage | Scope | Success criterion | No-go condition |
|---|---|---|---|
| **0 — Measure** | Use current operational telemetry and database/provider metrics to identify the top public read routes and media bandwidth drivers. | A real baseline exists before new infrastructure is introduced. | Move because caching “sounds faster” without evidence. |
| **1 — Static CDN** | Put only public static frontend assets behind Cloudflare, with asset hashing and long cache headers. | Public pages load from CDN; authenticated APIs remain unchanged. | Broadly caching `/api/*` or changing production DNS without a staging test. |
| **2 — Public read cache** | Introduce explicit anonymous public GET/read endpoints with conservative TTLs and targeted purge. | Homepage/catalogue/product read load falls while private routes remain uncacheable. | Caching the shared tRPC endpoint, any cookie-aware response, or all errors. |
| **3 — Public R2 media** | Move approved public media to versioned R2 objects; retain MySQL metadata and dual-validate rendering. | Faster media delivery and less origin bandwidth; no broken media references. | Overwriting media keys in place or deleting existing storage before migration reconciliation. |
| **4 — Private/quarantine R2** | Add the private-evidence and quarantine buckets, signed upload/download flows, lifecycle policies, and scanning. | Private evidence stays private and uploads are promoted only after validation. | Making a private bucket public, or treating upload completion as approval. |
| **5 — Optimize** | Tune TTLs/purges from measured cache hit rate, database latency, error rate, and user-visible freshness. | Lower MySQL read load with no observed authorization or commerce regression. | Scaling cache duration while ignoring stale product/status behavior. |

## Required Tests Before Activation

1. Verify that no signed-in page, cookie-bearing response, error response, or private API result is stored in Cloudflare shared cache.
2. Verify cache keys for catalogue/search vary only by intended public parameters and cannot be poisoned with unknown or user-specific values.
3. Verify product publication, unpublication, inventory change, store suspension, and review moderation invalidate the correct public URLs.
4. Verify a Cloudflare outage/cache miss does not prevent direct Node API/MySQL commerce operations.
5. Verify R2 public media renders after migration and stale/removed references do not remain visible beyond the defined policy.
6. Verify private evidence returns `403` without a qualifying participant/privileged role and uses short-lived signed access only after authorization.
7. Verify quarantine objects cannot be loaded as public media, even if an attacker guesses an object key.
8. Verify malicious MIME labels, mismatched byte signatures, oversized files, aborted uploads, and re-used/expired upload URLs fail safely.
9. Verify final checkout/inventory tests still pass with caching enabled because checkout continues to read/validate MySQL directly.
10. Verify purge API credentials remain backend-only, are scoped minimally, and are not exposed through client bundles, logs, audit metadata, or error messages.

## Decision Gates

Before implementation, the owner must explicitly authorize:

1. A Cloudflare account/organization ownership and staging-zone model.
2. Whether the first approved scope is static CDN caching, public JSON caching, public-media R2, or the full three-bucket R2 model.
3. The production/staging domain and API origin arrangement.
4. Storage retention, deletion, privacy, evidence-access, and quarantine-scan policy.
5. The external scanning provider or safe self-hosted scanning design.
6. The non-production test plan, backup/export plan for existing storage metadata, and rollback criteria.
7. Explicit `READY` authorization before any code, provider configuration, storage migration, cache rule, or DNS work begins.

## References

[1]: [Current ESUT Marketplace client tRPC transport](client/src/main.tsx)

[2]: [Current ESUT Marketplace Node/Express runtime entry point](server/_core/index.ts)

[3]: [Cloudflare Cache-Control guidance](https://developers.cloudflare.com/cache/concepts/cache-control/)

[4]: [Cloudflare cache purge guidance](https://developers.cloudflare.com/cache/how-to/purge-cache/)

[5]: [Cloudflare R2 overview](https://developers.cloudflare.com/r2/)

[6]: [Cloudflare R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)

[7]: [Cloudflare R2 object lifecycle rules](https://developers.cloudflare.com/r2/buckets/object-lifecycles/)
