# Public ESUT Marketplace Product Visibility Audit

**Date:** 22 August 2026  
**Scope:** Read-only inspection of `https://esutshop-59wzg8bs.manus.space/` and its public catalogue routes.  
**Author:** Manus AI

## Executive finding

The public marketplace is currently showing all **eight active listings** in both the homepage shelves and the `/explore` catalogue. The products are not being removed by pagination, search filters, failed API calls, or an empty state. The visible problem is that **six active listings have no primary image record**, while the remaining two have primary image records whose managed-storage URL returns a browser-facing HTTP `404 Not found` on the live domain. As a result, all visible cards use the intentional `Seller photo unavailable` fallback.

> The public symptom is therefore two related media problems, not one general product-query problem: six listings genuinely have no stored primary photo, and two listings have stored photos that are reachable through a command-line redirect-following request but fail when loaded by a browser against the managed domain.

## What was verified

| Area checked | Verified result | Meaning |
|---|---:|---|
| Public homepage | Eight product links rendered | Homepage data query is returning active listings |
| Public Explore route | Eight products rendered on page 1 | Pagination and default filters are not hiding the eight active listings |
| Database listing status | 8 `ACTIVE`, 3 `DRAFT`, 1 `PENDING_REVIEW` | Draft and pending-review products are correctly excluded from public discovery |
| Active listings without primary image | 6 of 8 | Six products have no image row to display |
| Active listings with primary image | 2 of 8 | iPhone 15 Pro Max and iPHONE 11 have persisted primary-image rows |
| Live browser image load | HTTP 404 plain text for the checked managed path | The browser cannot decode the stored image and the card falls back |
| Redirect-following HTTP check | HTTP 200 `image/jpeg` from the upstream CloudFront object | The underlying object exists; the failure is at the managed-domain/browser delivery boundary |

The active listing records with no primary image are **Wireless Study Headphones**, **Portable Power Bank 20000mAh**, **Engineering Mathematics Textbook**, **Adjustable Study Lamp**, **Classic Campus Backpack**, and **Scientific Calculator**. The image-backed records are **iPHONE 11** and **iPhone 15 Pro Max**.

## Why products appear without photos

The public server query correctly joins an active listing to its `listingImages` row where `isPrimary = true`. The shared React `StorefrontProductCard` then follows a truthful decision: it renders an image only when `image.url` exists and the image has not failed; otherwise it renders a category-aware fallback with the text `Seller photo unavailable`. This is why the six image-less products display campus category artwork rather than broken icons or fabricated photographs.

For the two image-backed products, the real tRPC response includes the image object and the persisted `/manus-storage/...jpg` URL. A fresh browser `fetch()` against the live managed domain returned **HTTP 404**, `content-type: text/plain;charset=UTF-8`, body `Not found`, and a 9-byte payload. A fresh browser `Image` load consequently failed with `naturalWidth: 0` and `naturalHeight: 0`. In contrast, a command-line request with redirect following received the initial managed response as `307` and the final upstream object as `200 image/jpeg`. This proves that the two stored objects are not absent; the live browser request is reaching a different or stale managed-storage route behavior than the redirect-following client.

The repository now contains a same-origin streaming proxy implementation that obtains the signed upstream object server-side, forwards safe media headers, and preserves the private authorization checks for verification and unapproved evidence. The local updated dev route decoded the affected iPhone 15 Pro Max image successfully at `810 × 1080`. The live-domain check above still observed the older redirect/404 behavior, so the managed public deployment should be rechecked for propagation or runtime-route consistency before declaring the public fix effective.

## Why some product records are legitimately absent from public pages

The public homepage and catalogue intentionally filter by `listings.status = ACTIVE` and `stores.status = ACTIVE`. The three `DRAFT` records and one `PENDING_REVIEW` record are therefore not supposed to be visible to shoppers. This is the correct marketplace lifecycle behavior: sellers must not expose drafts or products awaiting moderation. The visibility audit found no evidence that these lifecycle filters are incorrectly hiding active records.

## Safe next actions

The six image-less active listings require seller action: each owner should open the seller product editor and upload a genuine product photo. The new seller editor recovery path supports optimized JPG, PNG, and WEBP uploads and provides an in-place **Replace** action for existing image rows. The server verifies the seller’s store ownership before replacement, keeps public media delivery on the approved Cloudinary/managed-storage path, and records an audit event. No image, listing, customer, or private evidence data was changed during this audit.

The administrator Product moderation workspace now includes a read-only **Public listing image integrity** panel. It checks active listings, reports missing or unreachable primary media without exposing storage keys or signed URLs, and links affected records to the owner-scoped seller recovery route. Administrators should use that panel after deployment propagation to confirm which legacy media remains broken.

The current evidence does **not** justify changing product statuses, deleting legacy storage objects, seeding placeholder photos, migrating data automatically, or disabling the public managed URL. Those actions could damage authentic marketplace records and are not required to explain the observed symptom.

## Validation record

The investigation was read-only against the live database and public routes. TypeScript and production build validation had already passed for the remediation release. The public route inspection confirmed eight real visible products, and the database join confirmed the exact eight active records and their primary-image coverage. No marketplace mutation, upload, deletion, status change, account action, or administrator action was performed.

## References

[1]: https://esutshop-59wzg8bs.manus.space/ "ESUT Marketplace public homepage"
[2]: https://esutshop-59wzg8bs.manus.space/explore "ESUT Marketplace public catalogue"
[3]: https://esutshop-59wzg8bs.manus.space/product/iphone-15-pro-max-010c0bf3 "Affected iPhone 15 Pro Max product route"

## Cloudinary migration verification

The two approved authentic image rows were migrated to Cloudinary and verified before their database references were updated. The database still shows both rows as primary images on `ACTIVE` listings, with the same listing IDs and store ownership links; the original Manus objects were not deleted. Two immutable audit entries record the provider migration and verified HTTP 200 result.

The live homepage now returns direct Cloudinary URLs for both **iPhone 15 Pro Max** and **iPHONE 11**. A live browser check confirmed all displayed Cloudinary image elements completed successfully with decoded dimensions of `810 × 1080` for iPhone 15 Pro Max and `720 × 720` for iPHONE 11. The browser no longer falls back for these two migrated products. The remaining six active listings continue to show `Seller photo unavailable` because they have no authentic primary image records and require seller uploads.
