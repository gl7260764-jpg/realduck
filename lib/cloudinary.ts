/**
 * Cloudinary image optimization utility.
 * Transforms Cloudinary URLs for fast loading with optimal quality.
 */

const CLOUDINARY_BASE = "res.cloudinary.com";

type ImageSize = "thumbnail" | "card" | "detail" | "full" | "blur";

interface SizeConfig {
  width: number;
  height?: number;
  crop: string;
  quality: string;
}

const SIZE_CONFIG: Record<ImageSize, SizeConfig> = {
  // Tiny blur placeholder — ~300 bytes, loads instantly
  blur: { width: 32, height: 40, crop: "c_fill,g_center", quality: "q_auto:low" },
  // Thumbnails for cart/modals — 150x150, fast
  thumbnail: { width: 150, height: 150, crop: "c_fill,g_center", quality: "q_auto:good" },
  // Product cards — 400x500, good balance of quality/speed
  card: { width: 400, height: 500, crop: "c_fill,g_center", quality: "q_auto:good" },
  // Product detail page — 800px wide, higher quality
  detail: { width: 800, crop: "c_limit", quality: "q_auto:good" },
  // Full-size hero/gallery — 1200px, best quality
  full: { width: 1200, crop: "c_limit", quality: "q_auto:best" },
};

/**
 * Optimizes a Cloudinary image URL with transformations.
 */
export function optimizeImage(url: string, size: ImageSize = "card"): string {
  if (!url || !url.includes(CLOUDINARY_BASE)) {
    return url;
  }

  const config = SIZE_CONFIG[size];

  const transforms = [
    `w_${config.width}`,
    ...(config.height ? [`h_${config.height}`] : []),
    config.crop,
    "f_auto",
    config.quality,
  ].join(",");

  return url.replace("/upload/", `/upload/${transforms}/`);
}

/**
 * Returns a tiny blurred placeholder URL for use with next/image blurDataURL.
 * This is a real Cloudinary URL that loads in ~300 bytes.
 */
export function blurUrl(url: string): string {
  if (!url || !url.includes(CLOUDINARY_BASE)) {
    return "";
  }
  return url.replace("/upload/", "/upload/w_32,h_40,c_fill,g_center,f_auto,q_auto:low,e_blur:800/");
}
