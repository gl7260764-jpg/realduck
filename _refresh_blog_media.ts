/**
 * Refresh every blog and announcement's image using the current product
 * catalog as the source. Replaces whatever's there now (no skip-if-set
 * logic — explicit overwrite) and clears any leftover `images[]`.
 *
 *   • Strain-review blogs → exact-match product
 *   • Other blogs         → cycle through the FLOWER product pool, newest-first
 *   • Announcements       → keyword match → product; else first FLOWER product
 *
 * Site 1 only — Site 2 has no blogs.
 *
 * Default = dry run; pass --apply to commit.
 *
 *   npx tsx ./_refresh_blog_media.ts          # preview
 *   npx tsx ./_refresh_blog_media.ts --apply  # commit
 *
 * CRAFTED By W1C3
 */

import "dotenv/config";
import { prisma } from "./lib/prisma";

const APPLY = process.argv.includes("--apply");

const BLOG_TO_PRODUCT_SLUG: Record<string, string> = {
  "pink-runtz-strain-review-exotic-indoor-runtz-pheno": "pink-runtz",
  "gumbo-88g-strain-review-bubblegum-cannabis-indoor-flower": "gumbo-88g",
  "venom-runtz-strain-review-runtz-pheno-exotic-cannabis": "venom-runtz",
  "frozen-thin-mint-strain-review-vanilla-mint-indoor-smalls": "frozen-thin-mint-sm",
  "blue-candy-lemons-strain-review-indoor-citrus-candy-flower": "blue-candy-lemons-indoors",
  "raspberry-airheadz-strain-review-candy-flavor-indoor-flower": "raspberry-airheadz",
};

const ANNOUNCEMENT_KEYWORD_PRODUCT: { keyword: string; productSlug: string }[] = [
  { keyword: "gogeta", productSlug: "gogetta-candy" },
  { keyword: "raspberry", productSlug: "raspberry-airheadz" },
];

async function main() {
  console.log(`Mode: ${APPLY ? "APPLY (writing DB)" : "DRY RUN"}\n`);

  // Build product image map + dynamic FLOWER pool, newest first
  const allProducts = await prisma.product.findMany({
    where: { imageUrl: { contains: "r2.dev" } },
    orderBy: { createdAt: "desc" },
    select: { slug: true, title: true, imageUrl: true, category: true, createdAt: true },
  });
  const productImageBySlug: Record<string, string> = {};
  for (const p of allProducts) {
    if (p.slug && p.imageUrl) productImageBySlug[p.slug] = p.imageUrl;
  }
  const flowerPool = allProducts.filter((p) => p.category === "FLOWER");

  console.log(`Catalog: ${allProducts.length} products with R2 images`);
  console.log(`Flower pool: ${flowerPool.length} (used for non-strain-review blogs)\n`);

  if (flowerPool.length === 0) {
    console.error("No FLOWER products with R2 images — cannot refresh blogs.");
    process.exit(1);
  }

  // ── BLOGS ──
  const blogs = await prisma.blogPost.findMany({
    select: { id: true, slug: true, title: true, imageUrl: true, images: true },
    orderBy: { createdAt: "desc" },
  });
  console.log(`=== BLOG POSTS (${blogs.length}) ===\n`);

  let cycleIdx = 0;
  const blogOps: { id: string; data: { imageUrl: string; images: string[] }; old: string | null; reason: string }[] = [];

  for (const b of blogs) {
    let pickSlug = BLOG_TO_PRODUCT_SLUG[b.slug];
    let reason = "exact-match";
    if (!pickSlug) {
      const candidate = flowerPool[cycleIdx % flowerPool.length];
      pickSlug = candidate.slug ?? "";
      cycleIdx++;
      reason = `flower-pool[${cycleIdx - 1}]`;
    }
    const newImageUrl = productImageBySlug[pickSlug];
    if (!newImageUrl) {
      console.log(`  ⚠ ${b.slug.slice(0, 60)} — no image for "${pickSlug}", skip`);
      continue;
    }
    const willChange = b.imageUrl !== newImageUrl || (b.images?.length ?? 0) > 0;
    if (!willChange) {
      console.log(`  = ${b.slug.padEnd(60).slice(0, 60)}  unchanged (${reason})`);
      continue;
    }
    blogOps.push({
      id: b.id,
      data: { imageUrl: newImageUrl, images: [] },
      old: b.imageUrl,
      reason,
    });
    const shortNew = newImageUrl.split("/").slice(-2).join("/");
    console.log(`  → ${b.slug.padEnd(60).slice(0, 60)}  ← ${pickSlug} (${reason})  [${shortNew}]`);
  }

  console.log(`\nBlogs to update: ${blogOps.length}\n`);

  // ── ANNOUNCEMENTS ──
  const anns = await prisma.announcement.findMany({
    select: { id: true, title: true, imageUrl: true },
    orderBy: { createdAt: "desc" },
  });
  console.log(`=== ANNOUNCEMENTS (${anns.length}) ===\n`);

  const annOps: { id: string; data: { imageUrl: string }; reason: string }[] = [];
  const fallbackAnnSlug = flowerPool[0].slug ?? "";
  for (const a of anns) {
    const titleLower = a.title.toLowerCase();
    let pickSlug: string | undefined;
    let reason = "fallback";
    for (const { keyword, productSlug } of ANNOUNCEMENT_KEYWORD_PRODUCT) {
      if (titleLower.includes(keyword)) {
        pickSlug = productSlug;
        reason = `keyword:${keyword}`;
        break;
      }
    }
    if (!pickSlug) pickSlug = fallbackAnnSlug;

    const newImageUrl = productImageBySlug[pickSlug];
    if (!newImageUrl) {
      console.log(`  ⚠ "${a.title.slice(0, 50)}" — no image for "${pickSlug}", skip`);
      continue;
    }
    if (a.imageUrl === newImageUrl) {
      console.log(`  = "${a.title.slice(0, 50)}"  unchanged (${reason})`);
      continue;
    }
    annOps.push({ id: a.id, data: { imageUrl: newImageUrl }, reason });
    console.log(`  → "${a.title.slice(0, 50)}"  ← ${pickSlug} (${reason})`);
  }

  console.log(`\nAnnouncements to update: ${annOps.length}\n`);

  if (!APPLY) {
    console.log("─".repeat(70));
    console.log("DRY RUN — no changes made. Re-run with --apply.");
    await prisma.$disconnect();
    return;
  }

  console.log("─".repeat(70));
  for (const op of blogOps) {
    await prisma.blogPost.update({ where: { id: op.id }, data: op.data });
  }
  for (const op of annOps) {
    await prisma.announcement.update({ where: { id: op.id }, data: op.data });
  }
  console.log(`✓ Updated ${blogOps.length} blogs and ${annOps.length} announcements.`);

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
