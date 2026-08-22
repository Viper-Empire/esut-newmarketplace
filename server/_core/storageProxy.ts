import type { Express } from "express";
import { Readable } from "node:stream";
import { ENV } from "./env";
import { sdk } from "./sdk";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { listingVideoEvidence, listings, stores } from "../../drizzle/schema";

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    if (key.startsWith("verification-evidence/")) {
      try {
        const user = await sdk.authenticateRequest(req);
        if (!user.isActive || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
          res.status(403).send("Forbidden");
          return;
        }
      } catch {
        res.status(401).send("Authentication required");
        return;
      }
    }

    if (key.startsWith("listing-video-evidence/")) {
      try {
        const db = await getDb();
        const evidence = db ? (await db.select({ evidence: listingVideoEvidence, listing: listings, store: stores }).from(listingVideoEvidence).innerJoin(listings, eq(listingVideoEvidence.listingId, listings.id)).innerJoin(stores, eq(listings.storeId, stores.id)).where(eq(listingVideoEvidence.storageKey, key)).limit(1))[0] : null;
        if (!evidence) { res.status(404).send("Not found"); return; }
        if (evidence.evidence.status !== "APPROVED") {
          const user = await sdk.authenticateRequest(req);
          if (!user.isActive || !(["ADMIN", "SUPER_ADMIN"].includes(user.role) || evidence.store.ownerUserId === user.id)) { res.status(403).send("Forbidden"); return; }
        }
      } catch {
        res.status(401).send("Authentication required");
        return;
      }
    }

    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }

    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/",
      );
      forgeUrl.searchParams.set("path", key);

      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
      });

      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }

      const { url } = (await forgeResp.json()) as { url: string };
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }

      const upstream = await fetch(url, { headers: { Accept: req.get("accept") ?? "*/*" } });
      if (!upstream.ok || !upstream.body) {
        console.error(`[StorageProxy] upstream media error: ${upstream.status}`);
        res.status(upstream.status >= 400 ? upstream.status : 502).send("Storage media unavailable");
        return;
      }

      const contentType = upstream.headers.get("content-type");
      const contentLength = upstream.headers.get("content-length");
      const cacheControl = upstream.headers.get("cache-control");
      if (contentType) res.set("Content-Type", contentType);
      if (contentLength) res.set("Content-Length", contentLength);
      res.set("Cache-Control", cacheControl && cacheControl !== "no-store" ? cacheControl : "public, max-age=300, stale-while-revalidate=86400");
      res.set("X-Content-Type-Options", "nosniff");
      Readable.fromWeb(upstream.body as Parameters<typeof Readable.fromWeb>[0]).pipe(res);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}
