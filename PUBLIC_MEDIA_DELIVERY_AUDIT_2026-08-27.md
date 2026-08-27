# ESUT Marketplace Public Media Delivery Audit

**Date:** 27 August 2026  
**Author:** Manus AI  
**Scope:** Active public listing image records and current Cloudinary delivery path. No marketplace data was modified.

## Executive conclusion

The previously reported “six genuine listings lacking images” condition is not present in the current database state. The current production inventory contains **four active listings**, and each has a primary listing-image row with a Cloudinary URL. All four primary Cloudinary URLs returned **HTTP 200** with `image/jpeg` content during a read-only delivery check. The corresponding public product routes also returned **HTTP 200**.

There is therefore no verified public-storage fault to repair in this pass, and no seller-provided replacement photos are required for the currently active inventory. Fabricated or placeholder imagery was not added.

## Inventory readback

| Active listing | Store | Primary image | Storage/provider state | Delivery result |
|---|---|---|---|---|
| `iphone-11-e187c53d` | Esut Myshop | Present | Cloudinary public URL; `cloudinary:` storage key | HTTP 200, JPEG |
| `iphone-15-pro-max-010c0bf3` | Elon | Present | Cloudinary public URL; `cloudinary:` storage key | HTTP 200, JPEG |
| `iphone-11-pro-max-d5dfaa59` | Esut Myshop | Present | Cloudinary public URL with approved media metadata | HTTP 200, JPEG |
| `bezaleel-collections-8f70b703` | Esut Myshop | Present | Cloudinary public URL with approved media metadata | HTTP 200, JPEG |

A broader read-only aggregate showed six draft listings and two pending-review listings in addition to the four active listings. These non-public records also had image rows; they were not treated as public inventory and were not changed.

## Observations

The active records are now primarily Cloudinary-backed. Two active listings have approved `mediaAssets` rows visible in the metadata join, while two older Cloudinary-backed primary image rows carry the Cloudinary storage key and delivery URL without a matching `mediaAssets` row in the current readback. Because their public URLs returned successfully and the application’s public query uses the listing-image record, this is a metadata-reconciliation observation rather than a confirmed delivery failure. It should not be repaired by ad hoc database mutation; a future idempotent reconciliation job should be designed and authorized separately if the project owner wants every legacy Cloudinary image to have a corresponding media-assets record.

Each active listing also has a secondary legacy managed-storage image in the current database for some records. The public primary-image path is Cloudinary-backed and healthy. Secondary legacy rows were not deleted or rewritten because deletion would be a data-policy decision and could affect seller galleries or historical references.

## Verification method

The database checks were read-only and joined `listings`, `stores`, `listingImages`, and `mediaAssets`. The four exact primary Cloudinary URLs were fetched with redirects enabled and a 15-second timeout. The four corresponding public product routes were fetched from the managed production domain. No private evidence URLs, credentials, seller identity data, or provider settings were exposed.

## Recommended next step

Keep the current public media implementation unchanged. If a user still sees a missing image, capture the exact listing URL, browser, timestamp, and failed image request so the issue can be distinguished between browser cache, a specific secondary-gallery asset, or an environment-specific proxy problem. Do not create substitute images. Any future media metadata reconciliation should be implemented as an idempotent, audited server operation and separately authorized before changing records.

## References

No external sources were required. This audit is based on the project’s current database readback, application source, and read-only HTTP delivery checks performed on 27 August 2026.
