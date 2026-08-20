export const PRODUCT_IMAGE_MAX_EDGE = 1920;
export const PRODUCT_IMAGE_OPTIMIZE_ABOVE_BYTES = 1_250_000;

export type OptimizedProductImage = {
  filename: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  dataUrl: string;
  originalBytes: number;
  deliveryBytes: number;
  optimized: boolean;
};

export function shouldOptimizeProductImage({ size, width, height }: { size: number; width: number; height: number }) {
  return size > PRODUCT_IMAGE_OPTIMIZE_ABOVE_BYTES || Math.max(width, height) > PRODUCT_IMAGE_MAX_EDGE;
}

export function optimizedProductImageFilename(filename: string) {
  const stem = filename.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9._-]/g, "_") || "product-photo";
  return `${stem}.webp`;
}

function asDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onerror = () => reject(new Error("The product photo could not be read.")); reader.onload = () => resolve(String(reader.result)); reader.readAsDataURL(file); });
}

function loadBrowserImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => { URL.revokeObjectURL(objectUrl); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("The selected file is not a readable product image.")); };
    image.src = objectUrl;
  });
}

/**
 * Produces a visually high-quality WebP only when its delivery benefit is material.
 * It never crops; the full original aspect ratio is preserved. Efficient smaller
 * images pass through untouched so their existing quality is not recompressed.
 */
export async function optimizeProductImage(file: File): Promise<OptimizedProductImage> {
  const image = await loadBrowserImage(file);
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  if (!shouldOptimizeProductImage({ size: file.size, width, height })) return { filename: file.name, mimeType: file.type as OptimizedProductImage["mimeType"], dataUrl: await asDataUrl(file), originalBytes: file.size, deliveryBytes: file.size, optimized: false };
  const scale = Math.min(1, PRODUCT_IMAGE_MAX_EDGE / Math.max(width, height));
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not prepare this product image.");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, targetWidth, targetHeight);
  const webp = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/webp", 0.92));
  if (!webp || webp.size >= file.size) return { filename: file.name, mimeType: file.type as OptimizedProductImage["mimeType"], dataUrl: await asDataUrl(file), originalBytes: file.size, deliveryBytes: file.size, optimized: false };
  return { filename: optimizedProductImageFilename(file.name), mimeType: "image/webp", dataUrl: await asDataUrl(webp), originalBytes: file.size, deliveryBytes: webp.size, optimized: true };
}
