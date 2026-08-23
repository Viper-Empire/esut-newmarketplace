# Cloudflare staging browser verification notes — 2026-08-23

The immutable deployment `https://2817b465.esut-marketplace-staging.pages.dev` mounted successfully with title `ESUT Marketplace | Buy. Sell. Connect.` and the ESUT homepage shell. The page exposed the expected public navigation: marketplace search, cart, login, Buy / Sell, category discovery, real marketplace shelves, seller onboarding, and footer trust links. The logo resolved from the verified Cloudinary public asset.

A second read-only browser view preserved the same application shell and route structure while the category shelves remained in their explicit loading-skeleton branch. The staging deployment itself returned application content rather than a platform 404 or maintenance page. The next checks are direct same-origin API responses and browser console/network inspection to determine whether the live Pages Function proxy is forwarding the current backend contract correctly.


The staging browser resource log showed only the expected same-origin `auth.me` and `marketplace.home` requests and no `observability.record` request, confirming telemetry suppression on the deployed Pages host. The deep-linked `/explore` route mounted directly, rendered the real catalogue controls, showed real active listings and Cloudinary product images, and exposed no raw `Unexpected token` or HTML-response error.


The staging `/account` route returned only the signed-out buyer boundary with login and registration links; no buyer records were present. The staging `/seller` route returned only the signed-out seller boundary with an Apply to sell route; no seller workspace data was present. These checks confirm the Pages deployment preserves the protected-route boundaries.


The staging `/admin` route rendered only the safe administrator access boundary plus the protected moderation-queue discovery card; no administrator metrics, audit data, or queues were exposed. The staging `/account/messages` deep link rendered the new contextual `Back to account overview` and `Browse marketplace` links, followed by the private signed-out messaging boundary with login and registration actions; no conversation content was exposed.


The staging alias `https://staging.esut-marketplace-staging.pages.dev` served the current ESUT Marketplace homepage with real category cards, real active listings, Cloudinary product images, the Buy / Sell entry point, and no legacy mood controls. The browser console remained empty during the protected-route verification, with no unexpected-response or observability-recursion errors.


Cloudflare deployment metadata confirms deployment ID `2817b465-8a3c-41c0-ad2a-0b1dc722b461`, environment `Preview`, branch `staging`, and build source `76be291`. The immutable URL and stable `staging` alias are the valid staging entry points. The bare project hostname `esut-marketplace-staging.pages.dev` returns the platform 404 because no production branch deployment was requested; this is intentional branch isolation, not a managed-site outage.

A read-only `marketplace.search` request through the stable staging alias returned HTTP 200 JSON with real iPhone listings and private `no-store`/`noindex` response headers. An initial malformed non-batched probe returned HTTP 400 JSON with a safe validation message, confirming the proxy and error boundary return JSON rather than an HTML parse failure; the exact batched frontend envelope then passed.


The stable alias `/explore` deep link mounted correctly and exposed the real search, sort, condition, price, verified-seller, and category controls. In the immediate browser capture the catalogue remained on its explicit loading skeleton, while the direct batched `marketplace.search` probe returned HTTP 200 JSON with real iPhone results. This warrants a browser network/console check rather than being classified as a proxy failure yet.


The stable staging catalogue resource log contained an `auth.me` request and a combined same-origin `marketplace.search,marketplace.categories` request with about 8.9 seconds duration and a nonzero response transfer size. The browser console had no output. Because the UI remained in its loading branch despite the successful individual search probe, the combined batch response is being inspected directly before any code change.


The exact combined catalogue batch was fetched read-only from the staging browser and returned HTTP 200 with `application/json` and real iPhone listing data. A subsequent browser view rendered the real catalogue cards and Cloudinary images, replacing the skeleton. The earlier skeleton was therefore a normal delayed loading state during the first capture, not a proxy or route failure.


On the stable staging alias, entering `iphone` in the real catalogue search resolved to two authentic active listings: iPhone 15 Pro Max and iPHONE 11. Both rendered their Cloudinary images, prices, seller/location context, and pagination state. The responsive browser view showed the controls and cards without a raw API error.


The staging product deep link `/product/iphone-15-pro-max-010c0bf3` rendered the authentic Cloudinary image, real price and low-stock state, verified-purchase review, structured specifications, campus-pickup/cash-on-pickup safeguards, buyer actions, seller context, related active listings, and an explicit `Back to marketplace` path. The settled view remained stable with no raw transport error.
