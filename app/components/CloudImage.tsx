"use client";

import Image, { ImageProps } from "next/image";

/**
 * Image wrapper for the catalog. We bypass the /_next/image proxy because
 * (1) the catalog has 700+ image references on the homepage and Vercel's
 * Hobby-tier optimizer chokes when asked to convert that many cold,
 * (2) without a guaranteed width/height on every CloudImage call site,
 * routing through the optimizer caused CLS to balloon (Lighthouse went
 * 0.006 → 0.321), and (3) we host on R2 with sensible source sizes.
 *
 * Long-term path to AVIF/WebP: Cloudflare Image Resizing on R2 ($5/mo,
 * unlimited transformations) — that delivers next-gen formats without
 * the Vercel-optimizer bottleneck.
 */
export default function CloudImage(props: ImageProps) {
  return <Image {...props} unoptimized />;
}
