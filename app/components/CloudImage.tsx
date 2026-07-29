"use client";

import Image, { ImageProps } from "next/image";

/**
 * Image wrapper for the catalog. Routes through the Next.js optimizer so R2
 * source images are served as responsive AVIF/WebP instead of full-size
 * originals — the single biggest catalog-speed win.
 *
 * The old `unoptimized` bypass existed because the homepage once rendered the
 * whole catalog (700+ images) at once. It now paginates to 12 images/page, so
 * only ~12 optimizations happen per view — well within Vercel's optimizer.
 * Every call site already passes a fixed-aspect wrapper + `sizes`, so CLS stays
 * flat. Callers can still pass `unoptimized` explicitly to opt out.
 */
export default function CloudImage(props: ImageProps) {
  return <Image {...props} />;
}
