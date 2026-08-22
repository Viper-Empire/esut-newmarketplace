# Edge product-media reproduction and remediation notes

**Date:** 22 August 2026

## Verified reproduction

The earlier test route `/product/1470001` was not a product slug; `1470001` is associated with a legacy media path. A read-only database lookup identified the affected listing as **iPhone 15 Pro Max**, listing ID `210001`, public slug `iphone-15-pro-max-010c0bf3`, with an active store and a primary JPEG record.

The managed public route `https://esutshop-59wzg8bs.manus.space/product/iphone-15-pro-max-010c0bf3` rendered the listing details, but the browser reported `naturalWidth: 0` and `naturalHeight: 0` for its `/manus-storage/...jpg` image. A browser-context fetch returned `404 Not found` for the media path, while an independent plain and browser-like HTTP request received the expected `307` storage redirect and a final `200 image/jpeg`. The stored bytes were independently identified as a valid progressive JPEG (`810 × 1080`, approximately 94 KB).

This ruled out a missing database image row, malformed JPEG bytes, a product-slug failure, and a CSS object-fit problem. The failure occurred at the browser-facing redirect boundary of the managed storage proxy. The same route on the updated dev server decoded the exact image successfully, with browser dimensions `810 × 1080` for the primary image and `720 × 720` for the related listing image.

## Implemented remediation

The managed `/manus-storage/*` proxy now fetches the signed upstream object server-side and streams the response through the same-origin marketplace route. It forwards the upstream content type and length, applies a bounded public cache policy for public media, adds `X-Content-Type-Options: nosniff`, and retains the existing administrator-only and owner-only checks for private verification and evidence paths. This removes the browser-dependent cross-origin `307` redirect boundary without making private evidence public.

A seller-authorized `replaceProductImage` mutation now allows a verified seller to replace an existing listing image in place. It reuses the existing MIME, signature, size, optimization, Cloudinary-public-upload, managed-storage fallback, ownership, and audit-log controls. The seller edit page exposes an accessible **Replace** action for each image and refreshes marketplace caches after a successful replacement.

The administrator Product moderation page now includes a read-only **Public listing image integrity** panel. It checks up to 100 active listings, reports missing primary images and unreachable or unsupported public media, hides storage keys and signed URLs, and links each affected listing to its owner-scoped seller recovery path. The report is administrator-gated and does not modify product, image, seller, or customer records.

## Validation

TypeScript compilation passed. The focused media authorization tests passed, proving that media-integrity reporting remains administrator-only and image replacement remains behind the verified-seller boundary. The full Vitest suite passed with **59 test files, 170 passing tests, and 1 intentional skip** after the new regressions were added. The production frontend build passed. The updated dev-server product route decoded the affected primary image successfully in the browser.

The managed public site will receive the streaming proxy and remediation workflow when the verified checkpoint is saved. Existing broken legacy objects have not been migrated, deleted, or overwritten automatically; sellers can replace them through their own product editor, and administrators can identify them through the read-only report.

## Remaining owner validation

A final read-only review of the authenticated buyer, seller, and administrator dashboards remains pending because it requires the owner’s authenticated sessions. No dashboard data or marketplace action was changed during this investigation.
