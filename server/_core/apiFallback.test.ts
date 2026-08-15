import express from "express";
import { afterEach, describe, expect, it } from "vitest";
import { registerApiFallback } from "./apiFallback";

const servers: ReturnType<ReturnType<typeof express>["listen"]>[] = [];
afterEach(() => { servers.splice(0).forEach(server => server.close()); });

describe("API fallback", () => {
  it("returns JSON rather than a storefront HTML document for an unknown API route", async () => {
    const app = express();
    registerApiFallback(app);
    const server = app.listen(0);
    servers.push(server);
    await new Promise<void>(resolve => server.once("listening", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Expected a TCP listener.");
    const response = await fetch(`http://127.0.0.1:${address.port}/api/missing-route`);
    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toContain("application/json");
    await expect(response.json()).resolves.toMatchObject({ error: "API_ROUTE_NOT_FOUND" });
  });
});
