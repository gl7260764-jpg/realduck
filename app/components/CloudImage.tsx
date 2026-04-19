"use client";

import Image, { ImageProps } from "next/image";

/**
 * Image component for Cloudinary URLs.
 * Skips Next.js /_next/image proxy since Cloudinary already handles
 * format conversion (WebP/AVIF), quality optimization, and resizing at the CDN edge.
 * This avoids double-processing and proxy failures.
 */
export default function CloudImage(props: ImageProps) {
  return <Image {...props} unoptimized />;
}
