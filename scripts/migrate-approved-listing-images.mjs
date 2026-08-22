import { createHash, randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";

const assets = [
  {
    listingId: 180001,
    imageId: 120001,
    ownerId: 1470001,
    filename: "iphone-11.jpg",
    storageKey: "listing-images/1470001/180001/d043ad47-2621-4a58-a92a-4d5946b83f97-iphone_bb1df8a0.jpg",
  },
  {
    listingId: 210001,
    imageId: 150001,
    ownerId: 16350001,
    filename: "iphone-15-pro-max.jpg",
    storageKey: "listing-images/16350001/210001/6035618f-0888-430b-86bc-c2bcc24a80bb-pzzvred3z9oqeyx1m0gh_dd3956fc.jpg",
  },
];

const required = ["BUILT_IN_FORGE_API_URL", "BUILT_IN_FORGE_API_KEY", "CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];
for (const key of required) if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`);
const forgeUrl = process.env.BUILT_IN_FORGE_API_URL.replace(/\/+$/, "");
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const cloudKey = process.env.CLOUDINARY_API_KEY;
const cloudSecret = process.env.CLOUDINARY_API_SECRET;

function sign(params) {
  const serialized = Object.entries(params).filter(([, value]) => value !== "" && value !== undefined && value !== null).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join("&");
  return createHash("sha1").update(`${serialized}${cloudSecret}`).digest("hex");
}
function safe(value) { return value.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 80) || "asset"; }
function optimized(url) { return url.replace("/image/upload/", "/image/upload/f_auto/q_auto/c_limit,w_1600/"); }

const manifest = [];
for (const asset of assets) {
  const presign = new URL("v1/storage/presign/get", `${forgeUrl}/`);
  presign.searchParams.set("path", asset.storageKey);
  const signedResponse = await fetch(presign, { headers: { Authorization: `Bearer ${process.env.BUILT_IN_FORGE_API_KEY}` } });
  if (!signedResponse.ok) throw new Error(`Could not sign ${asset.storageKey}: ${signedResponse.status}`);
  const { url } = await signedResponse.json();
  const source = await fetch(url);
  if (!source.ok) throw new Error(`Could not download ${asset.storageKey}: ${source.status}`);
  const bytes = Buffer.from(await source.arrayBuffer());
  const contentType = source.headers.get("content-type")?.split(";")[0] ?? "image/jpeg";
  if (!/^image\/(jpeg|png|webp)$/.test(contentType)) throw new Error(`Unexpected media type for ${asset.storageKey}: ${contentType}`);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = `esut-marketplace/public/listings/${asset.listingId}`;
  const publicId = `${safe(String(asset.ownerId))}-${safe(asset.filename.replace(/\.[^.]+$/, ""))}-${randomUUID()}`;
  const context = `entity_type=listing|entity_id=${asset.listingId}|owner_id=${asset.ownerId}`;
  const params = { context, folder, public_id: publicId, timestamp };
  const form = new FormData();
  form.set("file", new Blob([bytes], { type: contentType }), asset.filename);
  form.set("api_key", cloudKey);
  form.set("signature", sign(params));
  form.set("folder", folder);
  form.set("public_id", publicId);
  form.set("timestamp", timestamp);
  form.set("context", context);
  const upload = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`, { method: "POST", body: form });
  if (!upload.ok) throw new Error(`Cloudinary upload failed for listing ${asset.listingId}: ${upload.status} ${await upload.text()}`);
  const result = await upload.json();
  if (!result.public_id || !result.secure_url) throw new Error(`Cloudinary returned incomplete data for listing ${asset.listingId}`);
  const publicUrl = optimized(result.secure_url);
  const verify = await fetch(publicUrl, { method: "HEAD" });
  if (!verify.ok || !verify.headers.get("content-type")?.startsWith("image/")) throw new Error(`Cloudinary verification failed for listing ${asset.listingId}: ${verify.status}`);
  manifest.push({ ...asset, cloudinaryKey: `cloudinary:${result.public_id}`, cloudinaryUrl: publicUrl, originalUrl: result.secure_url, bytes: bytes.length, contentType, verifiedStatus: verify.status });
}
await writeFile("/tmp/esut-cloudinary-approved-listing-images.json", `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify(manifest, null, 2));
console.log("Manifest written to /tmp/esut-cloudinary-approved-listing-images.json");
