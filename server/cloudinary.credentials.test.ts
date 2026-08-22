import { describe, expect, it } from "vitest";

describe("Cloudinary credentials", () => {
  it("authenticate against the read-only asset listing endpoint", async () => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    expect(cloudName).toBeTruthy();
    expect(apiKey).toBeTruthy();
    expect(apiSecret).toBeTruthy();

    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName!)}/resources/image/upload?max_results=1`,
      { headers: { Authorization: `Basic ${auth}` } },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toMatch(/application\/json/i);
    await response.body?.cancel();
  }, 20_000);
});
