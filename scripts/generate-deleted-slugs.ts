/**
 * Build-time helper: read DeletedSlug from DB, write a static JSON file
 * that middleware can import. Runs as a prebuild step (see package.json).
 *
 * This file ships in the deployed bundle, so middleware in Edge runtime
 * can return HTTP 410 without hitting the DB on every request.
 */

import "dotenv/config";
import * as fs from "fs/promises";
import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  try {
    const [rows, currentProducts, currentBlogs] = await Promise.all([
      prisma.deletedSlug.findMany({ select: { slug: true, kind: true } }),
      prisma.product.findMany({ select: { slug: true } }),
      prisma.blogPost.findMany({ select: { slug: true } }),
    ]);
    // Exclude any "deleted" slug that's been resurrected by a current row.
    const liveProductSlugs = new Set(currentProducts.map((p) => p.slug).filter(Boolean) as string[]);
    const liveBlogSlugs = new Set(currentBlogs.map((b) => b.slug));

    const products = rows
      .filter((r) => r.kind === "product" && !liveProductSlugs.has(r.slug))
      .map((r) => r.slug);
    const blogs = rows
      .filter((r) => r.kind === "blog" && !liveBlogSlugs.has(r.slug))
      .map((r) => r.slug);
    const announcements = rows.filter((r) => r.kind === "announcement").map((r) => r.slug);

    const out = { products, blogs, announcements, generatedAt: new Date().toISOString() };
    await fs.writeFile(
      "lib/deletedSlugs.generated.json",
      JSON.stringify(out, null, 2),
    );
    console.log(`✓ Wrote lib/deletedSlugs.generated.json: ${products.length} products, ${blogs.length} blogs, ${announcements.length} announcements`);
  } catch (e) {
    // Don't fail the build if DB is unreachable — just emit an empty list.
    console.warn(`⚠ generate-deleted-slugs: ${(e as Error).message}. Emitting empty list.`);
    await fs.writeFile(
      "lib/deletedSlugs.generated.json",
      JSON.stringify({ products: [], blogs: [], announcements: [], generatedAt: new Date().toISOString() }, null, 2),
    );
  } finally {
    await prisma.$disconnect();
  }
}

main();
