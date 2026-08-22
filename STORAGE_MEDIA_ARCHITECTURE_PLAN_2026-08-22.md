# ESUT Marketplace Storage and Media Architecture Plan

**Prepared:** 22 August 2026  
**Author:** Manus AI  
**Scope:** Production media storage, upload security, public/private delivery, lifecycle, recovery, and future scaling for the existing Manus-hosted ESUT Marketplace. This is a planning document; it does not change storage objects, database records, permissions, or provider configuration.

## 1. Executive recommendation

ESUT Marketplace should retain **Manus-managed object storage as the current system of record**. The existing application already stores file bytes outside the relational database through the server-side `storagePut` helper and stores only a storage key/URL plus ownership and media metadata in MySQL/TiDB. This is the correct foundation for product images, avatars, review media, seller documents, verification evidence, and dispute/report evidence.

The marketplace should organize this one managed storage namespace into three **logical zones** rather than prematurely buying or operating three independent storage containers:

| Logical zone | Intended content | Public rule |
| --- | --- | --- |
| `public/` | Approved product images, approved public store/avatar media, and approved review media | Public URLs may be returned only after the corresponding record and publication state authorize it. |
| `private/` | Seller verification documents, identity/business evidence, dispute/report evidence, private review or moderation attachments | Never expose a direct public URL; return a short-lived signed URL only after server-side authorization. |
| `quarantine/` | Newly uploaded or replacement media awaiting validation, moderation, malware scanning, or ownership confirmation | Not visible to buyers, sellers outside the owner workflow, or search/discovery responses. |

The current code uses namespace prefixes such as `listing-images/`, `verification-evidence/`, `case-evidence/`, `review-media/`, and `listing-video-evidence/`. These prefixes can be retained for compatibility and mapped to the three policy zones through metadata and server authorization. A future provider migration to separate buckets/containers should be considered only when the project needs independent retention, lifecycle deletion, malware scanning, CDN controls, or higher media volume.

## 2. Current implementation inventory

The current `server/storage.ts` obtains provider credentials from platform-injected server environment variables, requests presigned PUT URLs, uploads bytes directly to the underlying object store, and returns `/manus-storage/{key}` paths. `storageGet` returns the built-in path; `storageGetSignedUrl` requests a presigned GET URL. Browser code does not receive the storage credentials.

| Media class | Current key prefix or model | Current constraints and status |
| --- | --- | --- |
| Product images | `listing-images/{userId}/{listingId}/...` and `listingImages` | JPEG/PNG/WebP; server limit 4 MB; primary image/publication safeguards exist, but existing active listings may have missing or broken image objects. |
| Product evidence video | `listing-video-evidence/{userId}/{listingId}/...` and `listingVideoEvidence` | MP4/WebM; server limit 10 MB; administrator review path exists. |
| Avatars | Profile `avatarStorageKey`, `avatarUrl`, MIME, size, and `isAvatarPublic` | JPEG/PNG/WebP; public visibility is an explicit profile flag and should remain opt-in. |
| Seller verification | `verification-evidence/{userId}/...` and verification metadata | Intended as private evidence; the server currently validates declared MIME, size, and ownership workflow. |
| Review media | `review-media/{reviewId}/{userId}/...` and `reviewMedia` | JPEG/PNG/WebP; server limit 3 MB and content-signature validation; visibility must follow review/publication rules. |
| Dispute/report evidence | `case-evidence/{caseKind}/{caseId}/{userId}/...` and `caseEvidence` | JPEG/PNG/WebP and MP4/WebM; photos 3 MB, videos 10 MB; content-signature validation and participant authorization exist. |
| Order snapshots | `imageUrlSnapshot` in order items | This is a historical reference, not a new upload zone. Order history should retain a stable, authorized image reference or snapshot policy so later listing changes do not rewrite buyer history. |
| Seller/store media | Store/profile fields and related media as currently defined | Must remain separated from private business/identity documents; public storefront assets require explicit moderation and safe metadata. |

## 3. Public media policy

Only media attached to an approved, visible marketplace record should be publicly discoverable. Product image URLs may be used in public catalogue responses after the listing is eligible for discovery and the image record is approved/usable. A missing or failed object must render the truthful unavailable-photo state; the system must never substitute a stock, generated, or invented product image.

Public media keys should be opaque, unpredictable, and non-semantic beyond a policy prefix. Filenames must be sanitized for display and audit readability, but authorization must rely on database ownership and state—not on a filename, user-supplied path, or hidden frontend control.

Avatars should remain private by default. A user may explicitly make an avatar public only through an authenticated profile action. Public profile and review projections must return only the approved avatar URL and must not expose email addresses, user IDs, storage keys, or private profile metadata.

## 4. Private media policy

Private media includes seller identity/business evidence, dispute and report proof, moderation attachments, and any document that can identify a person or support a sensitive case. The frontend must never receive a durable public URL for these files. A protected server procedure should check the requester’s role, case participation, seller ownership, or administrator authorization before returning a short-lived signed retrieval URL.

Private evidence paths should not be placed in public listing, store, review, notification, analytics, or audit projections. Audit records should store an opaque evidence identifier and action metadata, not raw file bytes, unrestricted URLs, or sensitive document contents. Administrators should see only the evidence required for their current case and role.

## 5. Quarantine and state model

The production-safe target state model is:

`REQUESTED → UPLOADED → VALIDATED → QUARANTINED → APPROVED → PUBLIC/PRIVATE SERVING`

Any validation, signature, malware, moderation, ownership, or policy failure should enter `REJECTED` or `REMOVED` without becoming publicly reachable. Replacement uploads should not immediately overwrite the current approved image; the new object should be validated first, then promoted atomically by changing the database reference.

The current storage helper does not expose an underlying-object delete operation. Therefore, deleting a database reference makes an object unreachable by application lookup but does not guarantee physical byte deletion or immediate cost recovery. This must be documented honestly. If legal deletion, retention expiry, or storage-cost control becomes a launch requirement, the project will need a provider/API capability with authenticated object deletion and lifecycle policies, or a carefully approved migration to a storage service that supports them.

## 6. Upload security controls

All uploads should remain server-authorized. The client may select a file, but the server must decide whether the authenticated user can attach it to the target listing, profile, review, seller application, dispute, or report. The server must enforce maximum bytes, permitted MIME types, safe names, and a storage prefix derived from server-side IDs.

The existing implementation already enforces useful size and type boundaries for several flows, and case/review evidence checks content signatures. The main hardening gap is consistency: product images, product videos, avatars, and verification uploads should also validate file signatures rather than trusting only the declared MIME type. Future implementation should add bounded decompression/image-dimension checks, reject polyglot or malformed files, normalize orientation safely, and prevent oversized pixel counts from causing memory exhaustion.

For large media, the current base64/data-URL request pattern should not be expanded. It increases request size and memory pressure. A future direct-upload flow should issue a short-lived, object-specific upload authorization from the server, enforce size/type/key restrictions, complete the upload server-side, and create the database metadata only after the object is confirmed. Until that exists, current limits should remain conservative.

## 7. Image optimization and delivery

Product images and avatars should be optimized before public serving without destroying the original seller evidence. The recommended model is to retain the original object under a private or restricted source prefix and create a bounded derivative for catalogue delivery, such as a width-limited WebP/AVIF or JPEG variant. The derivative must preserve the seller’s real image and maintain acceptable visual quality; it must not become a substitute for a missing image.

The catalogue should use stable aspect-ratio boxes, lazy loading below the fold, responsive image dimensions, and explicit error handling. A successful upload must not be considered public until its stored object can be retrieved. Asset failures should be recorded through bounded operational telemetry without storing raw URLs, credentials, or private case information.

The existing live product-image 404 findings are a separate data/object-integrity incident. A storage architecture plan should remediate those objects through authentic seller re-upload or controlled restoration, not by hiding the fallback or generating replacement media.

## 8. Database metadata model

The existing specialized tables should remain the business source of truth for ownership and authorization. A future generalized media catalogue can reduce duplicated logic, but it should be additive and migration-safe rather than replacing working tables abruptly.

| Metadata field | Purpose |
| --- | --- |
| `id` | Stable internal media identifier. |
| `storageKey` | Exact opaque object key; never accept this from an untrusted client as authorization. |
| `zone` | `PUBLIC`, `PRIVATE`, or `QUARANTINE` policy classification. |
| `ownerUserId` | Server-authorized owner/uploader. |
| `entityType` and `entityId` | Listing, profile, review, seller application, dispute, report, or other parent record. |
| `mimeType` and `sizeBytes` | Validated content metadata. |
| `contentHash` | Deduplication and integrity comparison where supported. |
| `status` | Upload/validation/moderation/publication lifecycle state. |
| `isPrimary` | Primary listing/profile media selection where applicable. |
| `createdAt`, `approvedAt`, `rejectedAt`, `expiresAt` | Audit and retention decisions in UTC. |
| `failureCode` | Privacy-safe operational reason for rejection or retrieval failure. |

No BLOB column should be added to MySQL/TiDB. The database stores references and policy metadata; object storage stores bytes.

## 9. Backup and recovery

A recoverable media system needs two coordinated recovery sets: the relational metadata/authorization backup and the object-byte backup. Backing up only the database will restore keys that point to missing files; backing up only object bytes will not restore ownership, moderation, or visibility decisions.

Before launch, the owner should confirm what backup and recovery guarantees Manus-managed object storage provides, how an object inventory can be exported, and how a restore can be tested without exposing private evidence. Until an independent object export and restore drill exists, the project should treat seller re-upload as the practical remediation for missing public product images and retain the database as the authoritative link between media and permission state.

## 10. Retention and lifecycle

Retention should be tied to business purpose. Approved product images may persist while a listing or order history needs them. Rejected uploads, abandoned replacements, expired verification material, and closed case evidence should receive explicit retention periods approved by the owner and applicable policy. Private evidence must not be made public merely because its parent case is closed.

Because the current managed helper has no delete operation, lifecycle expiry cannot be assumed. The first implementation should track `expiresAt` and `retentionStatus` in metadata, produce an administrator report of eligible objects, and defer physical deletion until a verified provider deletion mechanism is available. No destructive cleanup should run automatically against current storage.

## 11. Service decision

For the current marketplace, **Manus managed object storage is sufficient** and should remain the primary media service. A persistent cloud workspace is not a storage replacement; it is an always-on compute environment. It should not be purchased merely to hold media or run the existing web app. Consider a separate storage provider later if the marketplace requires provider-level object deletion, independent public/private buckets, malware scanning at upload, image transformation/CDN controls, large video handling, cross-region backup, or storage volume beyond the current managed service’s practical limits.

## 12. Phased implementation roadmap

| Phase | Work | Release gate |
| --- | --- | --- |
| 0. Inventory | Reconcile all current media tables, prefixes, public projections, missing/broken objects, and owner relationships. | Read-only report complete; no data changed. |
| 1. Boundary hardening | Normalize public/private URL issuance, forbid private paths in public projections, and add regression coverage for ownership/role access. | Unauthorized private retrieval is denied. |
| 2. Validation consistency | Add signature, size, dimension, and safe-name checks to every media class; retain existing limits until tested. | Malformed and mislabeled files are rejected before storage/reference creation. |
| 3. Quarantine workflow | Add metadata state, validation/moderation promotion, replacement safety, and bounded failure telemetry. | No unvalidated object reaches discovery or private-case viewers. |
| 4. Delivery quality | Add optimized derivatives, stable media boxes, lazy loading, retrieval health checks, and authentic broken-media remediation. | Product images load consistently without fabricated fallbacks. |
| 5. Recovery and retention | Confirm provider backup/export/delete capabilities, define retention policy, and perform a non-production restore drill. | Metadata and bytes can be recovered together. |
| 6. Scale decision | Reassess Manus storage versus a separate provider using measured volume, failure rate, bandwidth, upload size, and operational needs. | Migration only if a concrete managed-service limit is demonstrated. |

## 13. Immediate recommendation

Do not create new storage containers, migrate media, or add a persistent cloud workspace yet. First approve a read-only media-integrity audit and a boundary-hardening implementation. The highest-value immediate correction is to repair the existing public product-image 404/missing-image population through authentic seller media, then enforce a consistent media state and access policy so new defects do not reappear.

## References

[1] Current project helper: `server/storage.ts` — Manus presigned upload, managed `/manus-storage/` serving, and signed retrieval behavior.  
[2] Current project schema: `drizzle/schema.ts` — listing, profile, review, report, dispute, and media metadata tables.  
[3] Current project router: `server/routers.ts` — upload validation, storage prefixes, size limits, file-signature checks, and authorization procedures.  
[4] Manus WebDev file-storage skill: `/home/ubuntu/skills/webdev-file-storage/SKILL.md` — managed storage helper and no-delete limitation.
