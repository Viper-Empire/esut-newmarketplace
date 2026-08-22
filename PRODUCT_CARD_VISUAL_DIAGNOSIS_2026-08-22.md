# ESUT Marketplace Product-Card Visual Diagnosis

**Date:** 22 August 2026  
**Scope:** Read-only analysis of the two supplied product-card screenshots, the live managed catalogue, current product-card code, public listing projections, storage delivery, and active-listing media metadata. No listing, store, image, product, cart, order, or account data was changed.

## Executive finding

The primary issue is **not** card overlap, button clipping, or a generic front-end failure. The marketplace has a real **product-media integrity and completeness problem**. The current category-aware fallback is working as designed, but it is appearing too often because most active listings have no primary image record and the few active listings that do have persisted primary-image records currently resolve to unavailable media objects.

The result is a catalogue that is technically honest—rather than showing broken image icons or fabricated imagery—but visually incomplete for a production e-commerce marketplace.

## Confirmed issues

| Priority | Confirmed issue | Evidence | Buyer-facing effect |
| --- | --- | --- |
| Critical | Active primary-image objects are inaccessible | The two persisted primary-image paths requested by the managed live catalogue returned **HTTP 404**. Both product cards fall back to `Seller photo unavailable`. | Even image-backed phone listings render without their product photography. |
| High | Six active listings have no image row or primary image | A read-only query found 8 active listings: 6 have zero images/primary images; only 2 have primary-image records. | The category fallback dominates discovery shelves and reduces buyer confidence. |
| Medium | Offer-price treatment lacks stable vertical reservation | Cards with a comparison price show a struck-through former price and percentage badge; cards without one collapse to a smaller price treatment. | The layout remains functional, but shelf scanning feels visually uneven. |
| Medium | Catalog data quality is inconsistent | Visible examples include `iPHONE 11`, `esut Myshop`, informal store naming, and mixed location specificity. | The marketplace looks less curated and less trustworthy, even where card rendering is correct. |

## What is working correctly

The product-card component renders actual images when they are reachable and falls back safely when an image is absent or the image request fails. The fallback is category-aware, explicitly says **Seller photo unavailable**, and does not pretend that a generic illustration is a product photo. Product titles wrap without clipping; favourite controls and Add to cart controls remain aligned; and all eight active stores displayed in the audit are flagged verified in the current records.

The active discounts shown in the screenshots are structurally valid. The current active set has three comparison prices greater than their current selling prices and no invalid comparison prices at or below the current price.

## Root-cause analysis

| Layer | Confirmed behavior | Diagnosis |
| --- | --- | --- |
| Card rendering | `StorefrontProductCard` renders the fallback when `image.url` is absent or the browser reports an image error. | The card is responding correctly to unavailable media. |
| Public data projection | Homepage and search projections left-join only the primary `listingImages` record. | Listings without a primary image arrive without a usable product image. |
| Existing publishing policy | New publication invokes `assessListingPublication`, which rejects a listing with no product image. | The current safeguard protects new publication, but existing active records can still pre-date it or have reached `ACTIVE` through an older workflow. |
| Stored media delivery | Two active image paths exist in the database but return 404 through the live managed `/manus-storage/...` URL. | The file objects or their active storage mapping are missing; the defect is in stored-media integrity/delivery, not image CSS. |

> The screenshots show real phone photographs in one capture, while the current live catalogue renders fallbacks for those same two phone listings because their stored image URLs now return 404. This is evidence of a media-object availability regression or historical storage mismatch, not a reason to fabricate replacements.

## Safe corrective sequence

| Order | Recommended action | Why it is safe | Approval needed |
| --- | --- | --- | --- |
| 1 | Create a read-only administrator media-integrity report for active listings: image-row count, primary flag, reachable status, owner/store, and remediation state. | Identifies the exact affected records without altering listings or media. | Yes, before adding a new admin screen/procedure. |
| 2 | Notify only the owners of affected listings to re-upload their **real** product photographs. | Restores truthful media from the legitimate seller rather than using stock or generated images. | Yes, before notification/flow changes. |
| 3 | Add a controlled legacy-listing policy: unresolved active listings without a verified reachable image are routed for owner remediation and, after an approved grace policy, paused rather than publicly promoted. | Extends the already-existing new-publication image requirement to legacy records without deleting data. | Yes; this changes listing visibility and needs an explicit policy decision. |
| 4 | Add an asset-health check to the existing operational monitoring and alert only on a bounded threshold of public listing image failures. | Detects a repeat of the current 404 condition without exposing storage keys or flooding administrators. | Yes, before operational behavior changes. |
| 5 | Refine, but do not hide, the fallback card treatment after remediation policy is in place—for example, reserve a consistent media/price rhythm and make the unavailable state compact. | Improves scanability while preserving honesty about missing photos. | Yes, before visual code changes. |
| 6 | Validate comparison pricing server-side as `compareAtPrice > price` and reserve a stable comparison-price line in the card. | Prevents future misleading offers and reduces visual jumpiness. | Yes, because it changes seller update validation and presentation. |

## What should not be done

The affected cards should **not** receive AI-generated product photos, stock photos, invented seller images, or hardcoded sample assets. The public catalog should also not silently relabel unavailable media as product imagery. Those approaches would mask an integrity issue and could mislead buyers.

## Conclusion

The screenshots reveal a **real launch-quality problem**, but the defensive UI is behaving correctly. The highest-priority repair is to recover or replace only the sellers’ authentic images and then prevent old active listings with missing/broken primary media from continuing to dominate marketplace discovery. The existing new-listing guard is a useful foundation; it needs an approved legacy-remediation and live-asset-integrity layer.
