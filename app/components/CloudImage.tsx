"use client";

import Image, { ImageProps } from "next/image";

/**
 * Image wrapper for the catalog. Routes through Next.js's /_next/image
 * proxy so every R2-hosted source is delivered as AVIF/WebP at the
 * exact size the viewport needs. This is the single biggest performance
 * lever — pixel-perfect, format-optimized images cut LCP by multiple
 * seconds vs serving raw JPEGs.
 *
 * Caveat: Vercel Hobby includes 1000 unique image transformations per
 * month. With 167 products × ~4 viewport widths × 2 formats, the first
 * cache fill is ~1300 transformations. After that, cached delivery is
 * effectively unlimited. Cache misses fall back to the original image.
 */
export default function CloudImage(props: ImageProps) {
  return <Image {...props} />;
}
