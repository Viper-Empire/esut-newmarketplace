# ESUT Marketplace Media Integrity Audit

**Date:** 22 August 2026  
**Mode:** Read-only; no uploads, deletions, migrations, visibility changes, or account changes were performed.

## Confirmed database inventory

The active catalogue currently contains **8 active listings**. Six listings have **zero rows** in `listingImages`: Wireless Study Headphones, Portable Power Bank 20000mAh, Engineering Mathematics Textbook, Adjustable Study Lamp, Classic Campus Backpack, and Scientific Calculator. Two active listings have image metadata: `iPHONE 11` has two JPEG image rows with one primary image, and `iPhone 15 Pro Max` has one JPEG primary image row.

The stored image metadata has positive byte sizes, but width and height are null for all three image rows. This reduces delivery-quality metadata and should be addressed in a future validated upload/derivative workflow, but it is not by itself proof that the bytes are corrupt.

## Confirmed managed-route checks

The persisted primary image route for `iPHONE 11` returned a managed storage response of **Not found**. The persisted primary image route for `iPhone 15 Pro Max` also returned **Not found**. This confirms that the two active listings with database image references currently have unavailable underlying objects or an invalid managed-storage mapping.

## Complete media-class inventory

The database contains 11 listing-image rows, one listing-video-evidence row, zero review-media rows, zero case-evidence rows, zero profile avatar-storage references, and four verification-document references. These counts describe metadata references only; they do not prove that every referenced object is physically reachable. Verification documents remain sensitive and must continue to be treated as private.

## Interpretation

The public fallback state is rendering honestly because the browser cannot retrieve the persisted image objects. The primary incident is storage-object integrity/delivery, not product-card CSS. The six image-less listings are a data-completeness/publication-policy gap, while the two image-backed listings are a broken-object or storage-mapping gap. No evidence from this audit supports generating replacement product images or editing listing records automatically.

## Recommended next safe action

Build a read-only administrator remediation report and a seller re-upload path. Any later visibility policy for legacy active listings should be separately approved; this audit did not pause, delete, or alter any listing.
