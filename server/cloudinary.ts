import { createHash } from "node:crypto";
import { ENV } from "./_core/env";

const CLOUDINARY_PUBLIC_PREFIX = "cloudinary:";

function getCloudinaryConfig() {
  if (!ENV.cloudinaryCloudName || !ENV.cloudinaryApiKey || !ENV.cloudinaryApiSecret) {
    throw new Error("Cloudinary public media is not configured.");
  }
  return {
    cloudName: ENV.cloudinaryCloudName,
    apiKey: ENV.cloudinaryApiKey,
    apiSecret: ENV.cloudinaryApiSecret,
  };
}

function signUploadParams(params: Record<string, string>, apiSecret: string) {
  const serialized = Object.entries(params)
    .filter(([, value]) => value !== "" && value !== undefined && value !== null)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  return createHash("sha1").update(`${serialized}${apiSecret}`).digest("hex");
}

function safePublicIdSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 80) || "asset";
}

export function isCloudinaryPublicKey(storageKey: string | null | undefined) {
  return Boolean(storageKey?.startsWith(CLOUDINARY_PUBLIC_PREFIX));
}

export function cloudinaryOptimizedUrl(url: string, width = 1200) {
  if (!url.includes("res.cloudinary.com/") || !url.includes("/image/upload/")) return url;
  const boundedWidth = Math.min(1600, Math.max(240, Math.round(width)));
  return url.replace("/image/upload/", `/image/upload/f_auto/q_auto/c_limit,w_${boundedWidth}/`);
}

export async function cloudinaryUploadPublicImage({
  bytes,
  mimeType,
  ownerId,
  entityType,
  entityId,
  filename,
}: {
  bytes: Buffer;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  ownerId: number;
  entityType: "listing" | "avatar" | "brand";
  entityId: number | string;
  filename: string;
}) {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = `esut-marketplace/public/${entityType}s/${safePublicIdSegment(String(entityId))}`;
  const publicId = `${safePublicIdSegment(String(ownerId))}-${safePublicIdSegment(filename.replace(/\.[^.]+$/, ""))}-${crypto.randomUUID()}`;
  const context = `entity_type=${entityType}|entity_id=${entityId}|owner_id=${ownerId}`;
  const signedParams = { context, folder, public_id: publicId, timestamp };
  const signature = signUploadParams(signedParams, apiSecret);
  const form = new FormData();
  const exactBytes = new Uint8Array(bytes.byteLength);
  exactBytes.set(bytes);
  form.set("file", new Blob([exactBytes.buffer], { type: mimeType }), filename);
  form.set("api_key", apiKey);
  form.set("signature", signature);
  form.set("folder", folder);
  form.set("public_id", publicId);
  form.set("timestamp", timestamp);
  form.set("context", context);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`, { method: "POST", body: form });
  if (!response.ok) {
    const detail = await response.text().catch(() => "Cloudinary upload failed");
    throw new Error(`Cloudinary upload failed (${response.status}): ${detail.slice(0, 240)}`);
  }
  const payload = (await response.json()) as { public_id?: string; secure_url?: string; bytes?: number; width?: number; height?: number; format?: string };
  if (!payload.public_id || !payload.secure_url) throw new Error("Cloudinary returned an incomplete public-image response.");
  return {
    key: `${CLOUDINARY_PUBLIC_PREFIX}${payload.public_id}`,
    url: cloudinaryOptimizedUrl(payload.secure_url),
    originalUrl: payload.secure_url,
    sizeBytes: payload.bytes ?? bytes.length,
    width: payload.width ?? null,
    height: payload.height ?? null,
    format: payload.format ?? null,
  };
}
