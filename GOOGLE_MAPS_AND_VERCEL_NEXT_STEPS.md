# Google Maps and Vercel Next Steps

## Google Maps

ESUT Marketplace already contains a reusable `MapView` wrapper at `client/src/components/Map.tsx`. It loads the Google Maps JavaScript SDK through the Manus maps proxy, so the project does **not** need a user-supplied Google Maps API key or a second external map library.

The first production use case should be the seller and buyer pickup experience. A seller can save a campus pickup location as structured latitude/longitude metadata, while buyers can view that location on an order or store page. The next implementation should therefore be scoped to three steps: add safe location coordinates to the existing store or pickup-coordination model, render a map only when coordinates exist, and provide an honest address-only fallback when coordinates are unavailable. Any persisted location must remain protected by the existing store/order ownership and authorization rules.

The frontend should use `MapView` and its `onMapReady` callback for markers, places, directions, or geocoding. Backend map requests should be introduced only if the application needs server-side persistence, caching, or bulk geocoding. Do not request or hardcode a Google Maps key; the built-in proxy handles authentication.

## Vercel

Connecting Vercel does not require an immediate code change. ESUT Marketplace is already configured for Manus managed hosting, which is the supported deployment path for the current full-stack project. Vercel can remain connected for repository visibility or future experimentation, but deploying this database-backed application there without reproducing the managed server, database, storage, authentication, and environment configuration may cause compatibility issues.

The safe next step is to keep the current Manus checkpoint as the release source, use the Management UI **Publish** action when the user is ready, and bind a custom domain from the project Domains settings if needed. If Vercel is intentionally chosen later, first confirm that it will host the complete application rather than only the Vite frontend, then separately provision compatible server runtime, MySQL/TiDB access, S3 storage, JWT/auth configuration, Resend configuration, and all required environment variables. Do not expose server-only secrets such as `DATABASE_URL`, `JWT_SECRET`, or Resend credentials to Vite client variables.

## Recommended sequence

1. Keep the public storefront unchanged and publish the current stable Manus checkpoint when ready.
2. Implement pickup-location coordinates and the first map surface using the existing `MapView` wrapper.
3. Test map rendering, missing-coordinate fallback, mobile layout, and authorization for seller and buyer order views.
4. Reassess Vercel only if there is a confirmed business requirement that cannot be met by Manus hosting.
