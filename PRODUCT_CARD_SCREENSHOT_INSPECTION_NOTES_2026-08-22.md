# Product-Card Screenshot Inspection Notes

## Source and reading order

The supplied screenshots were inspected as two horizontal panoramas. Each was split into four overlapping tiles and is being reviewed left-to-right. These notes distinguish what is visible in the screenshots from implementation causes, which still require source inspection.

## Verified observations — first screenshot, tiles 1–2

| Area | Verified observation |
| --- | --- |
| Listing imagery | The **Classic Campus Backpack** and **Engineering Mathematics Textbook** cards use pastel category placeholder panels rather than product photographs. Each panel says **Seller photo unavailable**. |
| Offer treatment | A red percentage badge is visible on both cards and a grey struck-through former price is shown beside the red current price. The visual information is present but crowded in the card’s compact price row. |
| Card consistency | The cards retain consistent title, seller, location, favourite, and Add to cart positions. No overlap or text clipping is visible within these two crops. |
| Product trust | A **Verified seller** label is shown, which is appropriate only if derived from live seller data; that data source will be traced before drawing a conclusion. |

No implementation conclusion has been made at this stage.

## Verified observations — first screenshot, tiles 3–4

| Area | Verified observation |
| --- | --- |
| Missing product imagery | The **Scientific Calculator** and **Wireless Study Headphones** cards also show category placeholder panels labelled **Seller photo unavailable**. Across the full first screenshot, all four visible cards lack a product photograph. |
| Inconsistent offer presentation | **Scientific Calculator** has no former price or percentage badge, while the other three cards do. This may be correct live data, but the difference is visually prominent because the price area has no reserved secondary-price space. |
| Category-driven colour | Each missing-image panel changes colour and iconography by category. The visible treatment is labelled as unavailable, so it is not presenting the placeholder as an actual product image. |
| Card height | Title wrapping changes the available whitespace, especially on **Wireless Study Headphones**, but the action buttons stay aligned at the bottom of the cards. |

The first image therefore confirms a **data-completeness/product-image experience issue**, not an overlapping-layout defect: the fallback presentation is functioning but dominates the product shelf because too many live listings have no usable primary image.

## Verified observations — second screenshot, tiles 1–2

| Area | Verified observation |
| --- | --- |
| Real product photography | **iPhone 15 Pro Max** and **iPHONE 11** display seller-uploaded photographs. The images fill the media area consistently and are visibly more useful for buyer discovery than the category placeholders. |
| Image source inconsistency | The same shelf contains both strong real photos and fallback panels. This confirms that the card component can render images; the main visible problem is incomplete listing media rather than a universal image-rendering failure. |
| Content consistency | Seller/store names, verification labels, locations, favourite buttons, current prices, and cart actions are consistently positioned under cards with real photos. |

The correct remediation should therefore prioritise **listing-media completeness and media-quality controls**, not substitute generic category art for product images or fabricate images for listings.

## Verified observations — second screenshot, tiles 3–4

| Area | Verified observation |
| --- | --- |
| Repeated fallback panels | **Portable Power Bank 20000mAh** and **Adjustable Study Lamp** show the same labelled category fallback pattern seen in the first screenshot. The category wording and icon vary appropriately: **Campus Tech** and **Campus Living**. |
| Card layout | Long titles wrap cleanly, product metadata remains readable, and Add to cart actions remain aligned. No visible collision, cut-off text, or collapsed interactive control was observed in the supplied crop set. |
| Market-readiness concern | In the eight unique visible listings across both screenshots, four use real product photography and four use an unavailable-photo fallback. This is high enough to make the shelf look incomplete, even though the fallback itself is technically honest and readable. |

## Preliminary diagnosis

1. **Confirmed defect:** too many public listings without a usable primary product image. The current category-aware fallback avoids broken-image affordances but cannot substitute for real seller product media in an e-commerce discovery shelf.
2. **Confirmed UX weakness:** price rows change height and visual density depending on whether a comparison price exists. This does not break card alignment, but makes discount and non-discount listings scan less consistently.
3. **Confirmed data-quality concern:** naming and location quality are inconsistent, for example `iPHONE 11`, `Elon`, `esut Myshop`, `ESUT Campus`, and `Agbani Road, Enugu`. This needs a source/data-policy trace before it is labelled a code defect.
4. **Not confirmed:** a universal image-rendering failure, visual overlap, button clipping, or an error in the verified-seller label. The screenshots show real images render correctly where valid listing media exists.

## Source and live-catalogue trace

| Finding | Confirmed evidence | Interpretation |
| --- | --- | --- |
| New-publication protection exists | `assessListingPublication` rejects a seller publication with no product images, and `publishProduct` invokes it before a listing can become active. | Newly published listings are protected from this data-quality issue. |
| Legacy/incomplete active records exist | The read-only active-listing query returned **8** active listings: **6** have no image rows or primary image, and **2** have a primary image. | The screenshot’s six unavailable-photo cards match the current active data. These records pre-date or bypassed the current publication guard. |
| Stored image objects are unavailable | The two active primary-image URL paths requested by the live catalogue returned **HTTP 404** from the managed `/manus-storage/...` route. The browser then renders the fallback. | This is a confirmed public media-delivery/data-integrity defect affecting the two listings that appear to have image records. It is not fixed by the card component. |
| Fallback is intentional | `StorefrontProductCard` uses a category-aware fallback when no image URL exists **or** an `<img>` fires `onError`. | The visible **Seller photo unavailable** panel is the correct defensive reaction to both absent media rows and failed live media delivery. |
| Comparison prices are valid in the current active records | The read-only query found three listings with a comparison price greater than the current price, and none with a comparison price at or below the current price. | The visible discounts are backed by structurally valid data, although the compact price-row visual treatment can still be improved. |
