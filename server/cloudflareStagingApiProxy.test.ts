import { describe, expect, it, vi } from "vitest";
import { proxyCloudflareStagingApi } from "../shared/cloudflareStagingApiProxy";

describe("Cloudflare staging API proxy", () => {
  it("forwards same-origin API traffic to the managed backend without edge caching", async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe("https://esutshop-59wzg8bs.manus.space/api/trpc/auth.me?batch=1");
      expect(init?.method).toBe("GET");
      expect(new Headers(init?.headers).get("cookie")).toBe("session=opaque-value");
      expect(new Headers(init?.headers).get("x-forwarded-proto")).toBe("https");
      return new Response('{"result":true}', { headers: { "content-type": "application/json" } });
    });

    const response = await proxyCloudflareStagingApi(
      new Request("https://preview.esut-marketplace-staging.pages.dev/api/trpc/auth.me?batch=1", {
        headers: { cookie: "session=opaque-value" },
      }),
      fetcher as typeof fetch
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store, private, max-age=0");
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow, noarchive");
    await expect(response.json()).resolves.toEqual({ result: true });
  });

  it("rejects attempts to use the staging function as an open proxy", async () => {
    await expect(
      proxyCloudflareStagingApi(new Request("https://preview.esut-marketplace-staging.pages.dev/not-api"))
    ).rejects.toThrow("Only /api/* requests may be proxied");
  });
});
