import { describe, expect, it, vi } from "vitest";
import { createMarketplaceApiFetch } from "./trpcFetch";

describe("marketplace API transport", () => {
  it("preserves JSON API responses and authenticated credentials", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('{"ok":true}', { headers: { "content-type": "application/json; charset=utf-8" } }));
    const fetchApi = createMarketplaceApiFetch(fetchImpl);
    const response = await fetchApi("/api/trpc/marketplace.home", { method: "GET" });
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(fetchImpl).toHaveBeenCalledWith("/api/trpc/marketplace.home", expect.objectContaining({ credentials: "include" }));
  });

  it("rejects an HTML document before tRPC tries to parse it as JSON", async () => {
    const fetchApi = createMarketplaceApiFetch(vi.fn().mockResolvedValue(new Response("<!doctype html><html><body>Not found</body></html>", { status: 404, headers: { "content-type": "text/html" } })));
    await expect(fetchApi("/api/trpc/seller.submitApplication", { method: "POST" })).rejects.toThrow("received a webpage instead of API data");
  });

  it("guards representative public and authenticated marketplace paths from HTML fallbacks", async () => {
    const fetchApi = createMarketplaceApiFetch(vi.fn().mockResolvedValue(new Response("<!doctype html><html><body>Fallback</body></html>", { status: 200, headers: { "content-type": "text/html" } })));
    for (const path of ["/api/trpc/marketplace.home", "/api/trpc/auth.me", "/api/trpc/seller.dashboard"]) {
      await expect(fetchApi(path, { method: "GET" })).rejects.toThrow("received a webpage instead of API data");
    }
  });
});
