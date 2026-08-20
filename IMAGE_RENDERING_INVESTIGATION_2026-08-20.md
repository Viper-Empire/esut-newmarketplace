# Image Rendering Investigation — 20 August 2026

## Initial live-site observation

The live homepage at `https://esutshop-59wzg8bs.manus.space/` renders the ESUT Marketplace page structure, public product data, and all text content. The header source references the static logo path `/manus-storage/esut-main-logo_0f99c6ab.png`. Product cards use URL values returned from listing-image records.

The current browser capture did not return an uploadable screenshot, so visual fault attribution cannot be made from that capture alone. The next checks will inspect the generated image URLs, direct HTTP responses, and network/browser error records to distinguish an unavailable static logo asset from broken listing image URLs or a client-rendering issue.

## Confirmed causes

The original header and footer logo was a 2048 × 2048 transparent PNG weighing 6.1 MB. The live path did return HTTP 200 after a signed-storage redirect, but it was marked `no-store` at the application edge. Downloading and decoding a 6.1 MB logo for a 48–56 px header slot was unnecessarily expensive and could make the logo appear delayed or fail on slower connections.

The live catalogue response also confirms that several active listing records have no primary `listingImages` row (`image: null`). Those listings do not have a seller-provided product photo to render. This is a missing seller media record, not a browser image URL failure. No product photography was fabricated to conceal that data condition.

## Repair applied

1. The same ESUT logo was deterministically downscaled without cropping to 256 × 256 transparent WebP and uploaded as a managed web asset. Its delivery size is 24 KB rather than 6.1 MB.
2. The public header and footer now use the optimized asset and render a branded `E` mark if the image resource still fails.
3. Public catalogue product cards now provide a visible, labelled `Seller photo unavailable` state when a seller has not uploaded an image or a returned image URL fails to load. This prevents broken-image icons and makes the correct seller action clear.
4. A Vitest regression verifies that the public storefront uses the lightweight managed WebP asset rather than the legacy PNG.

## Validation

The new logo appeared correctly in a desktop homepage capture. The complete homepage capture also showed the clear, non-broken product-photo fallback treatment on listings without seller image records. The focused Vitest asset regression passed and `pnpm check` completed without TypeScript errors.
