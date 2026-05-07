/**
 * Edge middleware that returns HTTP 410 Gone for previously-deleted
 * product / blog / announcement URLs. The list is generated at build
 * time from the DeletedSlug table (see scripts/generate-deleted-slugs.ts)
 * and bundled into this middleware.
 *
 * Why 410 not 404: 410 tells search engines "permanently gone, drop the
 * page from the index". 404 means "not found right now, retry later", so
 * Google may keep retrying for weeks before dropping it.
 *
 * For active pages the middleware returns NextResponse.next() — no overhead.
 */

import { NextRequest, NextResponse } from "next/server";
import deleted from "./lib/deletedSlugs.generated.json";

const DELETED_PRODUCTS = new Set<string>(deleted.products || []);
const DELETED_BLOGS = new Set<string>(deleted.blogs || []);

const GONE_BODY = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>Gone — Real Duck Distro</title><style>body{font-family:system-ui,sans-serif;max-width:560px;margin:80px auto;padding:0 24px;color:#0f172a;line-height:1.6}h1{font-size:28px;margin:0 0 8px}p{color:#64748b;font-size:15px}a{color:#0f172a;text-decoration:underline}</style></head><body><h1>This page is no longer available</h1><p>The product or post you are looking for has been permanently removed from our catalog.</p><p><a href="/">← Browse our current catalog</a></p></body></html>`;

function gone(): NextResponse {
  return new NextResponse(GONE_BODY, {
    status: 410,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "x-robots-tag": "noindex, nofollow",
      "cache-control": "public, max-age=3600",
    },
  });
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /product/<slug> or /product/<slug>/
  const productMatch = pathname.match(/^\/product\/([^/]+)\/?$/);
  if (productMatch) {
    const slug = decodeURIComponent(productMatch[1]);
    if (DELETED_PRODUCTS.has(slug)) return gone();
  }

  // /blog/<slug> or /blog/<slug>/
  const blogMatch = pathname.match(/^\/blog\/([^/]+)\/?$/);
  if (blogMatch) {
    const slug = decodeURIComponent(blogMatch[1]);
    if (DELETED_BLOGS.has(slug)) return gone();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/product/:path*", "/blog/:path*"],
};
