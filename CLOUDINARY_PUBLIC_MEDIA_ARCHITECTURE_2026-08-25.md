# ESUT Marketplace Cloudinary Public Media Architecture

## Decision

Cloudinary is the authoritative public media provider for ESUT Marketplace. It stores and delivers public product images, optimized product-image variants, public avatars that the account holder explicitly enables, approved public artwork, and approved brand assets. The application never sends Cloudinary credentials to the browser; the server signs and performs public uploads using the configured server-side Cloudinary credentials.

Private evidence remains on the existing protected Manus object-storage path. This includes seller verification documents, dispute evidence, and listing evidence video. Private evidence is not copied into Cloudinary and is not exposed through public listing or profile responses.

## Public upload lifecycle

1. A protected seller or account procedure validates the authenticated owner, filename, declared MIME type, data-URL structure, file signature, and size limit.
2. The server uploads the bytes to Cloudinary using a server-generated folder, public ID, context metadata, and signed request.
3. The database stores the Cloudinary storage key, public ID, original secure URL, transformed delivery URL, dimensions, size, purpose, owner, entity, provider, zone, and transformation profile in `mediaAssets`.
4. Product-image records begin as `PENDING` and become `APPROVED` when the existing publication or administrator activation gate makes the listing public. Public avatars are `APPROVED` only when the user explicitly enables public visibility.
5. Replacements archive the previous media record before recording the new asset. Listing and avatar removal archive media metadata rather than silently destroying the audit trail.

## Transformation profiles

The server exposes bounded named profiles rather than accepting arbitrary transformation strings:

| Profile | Intended use | Width limit |
|---|---|---:|
| `listingCard` | Catalogue and grid derivatives | 640px |
| `productDetail` | Product detail display and stored listing delivery | 1200px |
| `avatar` | Public profile avatar delivery | 256px |
| `publicArtwork` | Logo and public artwork delivery | 1600px |

Delivery uses Cloudinary `f_auto`, `q_auto`, and bounded `c_limit` width transformations. The original secure URL is retained for server-side metadata and future reconciliation; the transformed URL is used for normal application delivery.

## Security and failure behavior

Public upload procedures are authenticated and ownership-checked. A public avatar cannot be enabled merely by toggling a database flag: the stored key must identify an approved Cloudinary public asset. If Cloudinary is unavailable, a public upload fails clearly and does not silently fall back to a private URL that could later be misclassified as public. Private avatar uploads continue to use protected managed storage.

The database stores metadata and references only; it does not store image bytes. Cloudinary public IDs are opaque application metadata and delivery URLs do not contain the Cloudinary API secret.

## Existing data and future migration

Existing active listing and avatar records are not rewritten automatically by this release. Existing Cloudinary-backed records continue to render, while legacy managed-storage records remain subject to their existing visibility and media-integrity checks. A future migration should be a separately reviewed, idempotent job that copies only eligible public assets, verifies the Cloudinary response, writes `mediaAssets`, updates the owning record, and archives the old reference only after successful verification.

No Cloudinary deletion job is enabled in this release. Archiving metadata is intentionally separated from remote deletion so cleanup can be reconciled safely after retention, moderation, and order/dispute requirements are reviewed.

## Validation

The full automated suite passed with the Cloudinary transformation and eligibility contracts, the existing moderation regression updated for the additional lifecycle write, TypeScript validation, and production build. No marketplace listings, ownership records, orders, private evidence, roles, or unrelated provider settings were changed by the migration.
