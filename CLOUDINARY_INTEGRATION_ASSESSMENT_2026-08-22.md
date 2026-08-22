# Cloudinary Asset Integration Assessment

**Status:** Assessment only; no Cloudinary upload, deletion, transformation, migration, credential change, or application code change has been performed.

## Connector status

The current session configuration contains an enabled connector named **Cloudinary Asset** with UID `c088a9e9-a73b-43ac-afaa-3974926add33`. Its available operations include asset search/listing, asset details, signed upload preparation, remote upload, transformations, backup download/archive, and asset deletion. The generic `manus-mcp-cli` server lookup does not recognize this connector name as a callable MCP server, so no live asset operation was attempted. The connector metadata was inspected without exposing credentials.

## Official capability findings

Cloudinary’s official upload documentation states that authenticated uploads can use backend-generated signatures, while unauthenticated presets expose only restricted upload parameters and should be treated as sensitive. Authenticated uploads use HTTPS and a signature generated from the product environment credentials; the API secret must remain server-side. Cloudinary supports image, video, raw, and auto resource types and automatically analyzes uploaded assets.

Cloudinary’s official transformation documentation states that dynamic transformation URLs can resize, crop, optimize, convert formats, and deliver derivatives through a CDN. Transformed derivatives may be created on first request and cached for later users. This is useful for product-card thumbnails and responsive catalogue images, but transformation usage is subject to the Cloudinary plan and must be bounded in production.

Cloudinary’s official media-access documentation states that default upload-type assets are publicly accessible through CDN URLs, and randomly generated public IDs alone do not prevent access. Private or authenticated delivery types, signed URLs, access controls, `noindex` headers, and strict transformations are available for protected media. The documentation also warns that private originals may still have publicly accessible derived versions unless the delivery type and strict-transformation policy are configured correctly.

## Initial architecture decision

Cloudinary is a strong candidate for **approved public product-image and avatar derivative delivery**, not an immediate replacement for Manus-managed storage. Manus remains the current system of record for existing objects, application ownership metadata, private evidence, verification documents, disputes, reports, and server authorization.

The safest first boundary is a controlled pilot for newly approved public product images: the server authorizes the upload, records the Cloudinary immutable asset identifier and ownership metadata in the database, generates only allowlisted thumbnail/card transformations, and retains a fallback to the existing Manus object path. Private verification and case evidence should remain on the current private Manus storage path until a separate Cloudinary private-delivery design is implemented and tested.

## References

[1] [Cloudinary Upload documentation](https://cloudinary.com/documentation/upload_images) — signed and unsigned upload behavior, upload API, resource types, and security considerations.  
[2] [Cloudinary Image Transformations documentation](https://cloudinary.com/documentation/image_transformations) — dynamic transformations, format optimization, responsive derivatives, and CDN delivery.  
[3] [Cloudinary Media Access documentation](https://cloudinary.com/documentation/control_access_to_media) — public/default delivery, private/authenticated assets, signed access, noindex, and strict transformations.

## Implementation outcome

The approved public-media pilot is now implemented. New seller product-image uploads first use a server-signed Cloudinary image upload, store an opaque `cloudinary:` key and optimized public URL in the existing listing-image metadata, and fall back to the existing Manus public path if Cloudinary is temporarily unavailable. Existing server-side MIME, byte-size, seller-ownership, image-count, primary-image, publication, audit, and moderation checks remain in place.

When a user explicitly marks a newly uploaded avatar public, the same server-signed Cloudinary image path is used; private avatar uploads remain on Manus storage. Existing private evidence, verification documents, review media, case evidence, and product evidence videos remain on Manus storage. No public/private evidence boundary was widened.

The existing ESUT Marketplace WebP logo was uploaded to the Cloudinary public brand folder and the shared application brand reference now uses its verified public URL. No ZIP asset or fabricated media was used.

Validation passed after implementation: TypeScript compilation; the live read-only Cloudinary credential endpoint; Cloudinary helper unit tests; public-logo and storefront asset regressions; the complete suite with **58 files / 164 tests passed and 1 intentional skip**; and the production frontend build with 1,808 modules transformed. A local homepage/login visual check confirmed that the Cloudinary logo reference did not introduce a visible layout regression.

The implementation deliberately does **not** migrate existing Manus-backed listing images, avatars, private evidence, or videos automatically. Existing broken or absent product media must be repaired through the approved seller/admin media-integrity workflow so the marketplace never silently substitutes or fabricates product imagery.
