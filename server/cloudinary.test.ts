import { afterEach, describe, expect, it, vi } from "vitest";
import { cloudinaryOptimizedUrl, cloudinaryUploadPublicImage, isCloudinaryPublicKey } from "./cloudinary";

describe("Cloudinary public media helper", () => {
  afterEach(() => vi.restoreAllMocks());

  it("creates an allowlisted optimized delivery URL", () => {
    const original = "https://res.cloudinary.com/esut/image/upload/sample.jpg";
    expect(cloudinaryOptimizedUrl(original, 1_900)).toBe("https://res.cloudinary.com/esut/image/upload/f_auto/q_auto/c_limit,w_1600/sample.jpg");
    expect(cloudinaryOptimizedUrl(original, 80)).toContain("w_240");
    expect(cloudinaryOptimizedUrl("/manus-storage/example.jpg")).toBe("/manus-storage/example.jpg");
  });

  it("returns an opaque Cloudinary key and does not expose credentials in the delivery URL", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ public_id: "esut-marketplace/public/listings/42/owner-photo", secure_url: "https://res.cloudinary.com/esut/image/upload/esut-marketplace/public/listings/42/owner-photo.jpg", bytes: 32, width: 10, height: 12, format: "jpg" }), { status: 200, headers: { "content-type": "application/json" } }));
    const result = await cloudinaryUploadPublicImage({ bytes: Buffer.from("verified-image-bytes"), mimeType: "image/jpeg", ownerId: 7, entityType: "listing", entityId: 42, filename: "owner-photo.jpg" });
    expect(isCloudinaryPublicKey(result.key)).toBe(true);
    expect(result.url).toContain("f_auto/q_auto/c_limit,w_1200");
    expect(result.url).not.toContain(process.env.CLOUDINARY_API_SECRET ?? "secret");
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]?.[0]).toContain("/image/upload");
  });
});
