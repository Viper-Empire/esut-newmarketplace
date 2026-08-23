# Public domain availability incident

**Date:** 23 August 2026

The public hostname `https://esutshop-59wzg8bs.manus.space/` was reported as a 404. Read-only command-line checks confirmed that the hostname was returning the platform-level `Manus Space` 404 page with HTTP 404 for both `/` and `/explore`, rather than the ESUT application. The response headers identified Cloudflare, and the body title was `Manus Space`, not `ESUT Marketplace`.

The browser session displayed the ESUT application because it retained a cached/service-worker-rendered page; a cache-busting browser navigation also displayed the cached application shell, so browser visual output alone was not trusted as a live availability signal. Production runtime logs continued to show the Node application starting successfully on localhost, which indicates the failure boundary is between the published hostname and the running application rather than a database or React route failure.

A republish attempt produced the same platform 404. The last known-good application checkpoint was then restored. After rollback, the hostname temporarily returned HTTP 503 with a `Site under maintenance` page while the deployment propagated; production logs showed the application restarting successfully. The public route requires another external-status check after the maintenance window before this incident can be closed.

No database, listing, media, account, storage, DNS, or application data was modified during diagnosis or rollback. The Cloudinary migration data remains external to the code rollback and is not reverted by checkpoint rollback.

## Recovery confirmation

At 00:34:44 UTC, the live root returned HTTP 200 with `x-powered-by: Express` and the ESUT Marketplace title. After the rollback propagated, a fresh browser navigation with a cache-busting query rendered the ESUT Marketplace homepage, including the real navigation, hero, category links, and product shelves. The earlier 404/503 responses were transient published-deployment propagation states, not an application route or database failure. The public domain is currently recovered.
