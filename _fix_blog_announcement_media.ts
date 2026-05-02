/**
 * Replace dead Cloudinary URLs in BlogPost and Announcement rows with
 * working R2 product images.
 *
 * Strategy:
 *   • Strain review blogs → exact-match product image
 *   • Generic educational blogs → cycle through a curated flower-image pool
 *   • Announcements → keyword match on title
 *   • Clear images[] galleries on blogs (those Cloudinary URLs are also dead)
 *
 * Dry-run by default — pass --apply to actually write.
 *
 *   npx tsx ./_fix_blog_announcement_media.ts          # preview
 *   npx tsx ./_fix_blog_announcement_media.ts --apply  # commit
 *
 * Idempotent — already-fixed rows are skipped.
 *
 * CRAFTED By W1C3
 */

import "dotenv/config";
import { prisma } from "./lib/prisma";

const APPLY = process.argv.includes("--apply");

// Strain-review blog slug → product slug whose R2 image should be reused.
const BLOG_TO_PRODUCT_SLUG: Record<string, string> = {
  "pink-runtz-strain-review-exotic-indoor-runtz-pheno": "pink-runtz",
  "gumbo-88g-strain-review-bubblegum-cannabis-indoor-flower": "gumbo-88g",
  "venom-runtz-strain-review-runtz-pheno-exotic-cannabis": "venom-runtz",
  "frozen-thin-mint-strain-review-vanilla-mint-indoor-smalls": "frozen-thin-mint-sm",
  "blue-candy-lemons-strain-review-indoor-citrus-candy-flower": "blue-candy-lemons-indoors",
  "raspberry-airheadz-strain-review-candy-flavor-indoor-flower": "raspberry-airheadz",
};

// Pool of flower product slugs to cycle through for generic educational blogs.
// Picked to give visual variety across the blog index.
const FLOWER_POOL = [
  "dark-matter",
  "candy-x",
  "skittles-candy",
  "lcg-90h",
  "applescotti-indoors",
  "cherry-7up",
  "cookie-crisp-indoors",
  "rainbow-dulce-indoors",
  "citrus-tsunami",
  "marshmallow-mac-indoor-sm",
  "pink-versace-indoors",
  "strawberry-mac",
  "kaws-rocks-master-boxes-premium-moonrocks",
  "fetty-wap-ing-stamp",
  "liitt-exotics-thc",
  "black-runtz-3-108",
];

// Announcement keyword → product slug
const ANNOUNCEMENT_KEYWORD_PRODUCT: { keyword: string; productSlug: string }[] = [
  { keyword: "gogeta", productSlug: "gogetta-candy" },
  { keyword: "raspberry", productSlug: "raspberry-airheadz" },
];
const ANNOUNCEMENT_FALLBACK = "kaws-rocks-master-boxes-premium-moonrocks";

function isCloudinary(url: string | null | undefined): boolean {
  return !!url && url.includes("res.cloudinary.com");
}

async function loadProductImageMap(): Promise<Record<string, string>> {
  const products = await prisma.product.findMany({
    where: { imageUrl: { contains: "r2.dev" } },
    select: { slug: true, imageUrl: true },
  });
  const map: Record<string, string> = {};
  for (const p of products) {
    if (p.slug && p.imageUrl) map[p.slug] = p.imageUrl;
  }
  return map;
}

async function main() {
  console.log(`Mode: ${APPLY ? "APPLY (writing DB)" : "DRY RUN (no changes)"}\n`);

  const productImage = await loadProductImageMap();
  console.log(`Loaded ${Object.keys(productImage).length} product → R2 image mappings.\n`);

  // ── BLOG POSTS ──
  const blogs = await prisma.blogPost.findMany({
    select: { id: true, slug: true, title: true, imageUrl: true, images: true },
    orderBy: { createdAt: "desc" },
  });

  console.log(`=== BLOG POSTS (${blogs.length}) ===\n`);
  let blogsToUpdate = 0;
  let fallbackIdx = 0;
  const blogOps: { id: string; data: { imageUrl: string; images: string[] } }[] = [];

  for (const b of blogs) {
    if (!isCloudinary(b.imageUrl)) {
      console.log(`  ✓ ${b.slug.padEnd(60).slice(0, 60)} — already on R2 / non-cloudinary, skip`);
      continue;
    }
    let pickSlug = BLOG_TO_PRODUCT_SLUG[b.slug];
    let pickReason = "exact-match";
    if (!pickSlug) {
      pickSlug = FLOWER_POOL[fallbackIdx % FLOWER_POOL.length];
      fallbackIdx++;
      pickReason = "fallback-pool";
    }
    const newImageUrl = productImage[pickSlug];
    if (!newImageUrl) {
      console.log(`  ⚠ ${b.slug.padEnd(60).slice(0, 60)} — no R2 image for "${pickSlug}", skipping`);
      continue;
    }
    console.log(`  → ${b.slug.padEnd(60).slice(0, 60)} ← ${pickSlug} (${pickReason}) + clear gallery`);
    blogsToUpdate++;
    blogOps.push({
      id: b.id,
      data: { imageUrl: newImageUrl, images: [] },
    });
  }
  console.log(`\nBlogs to update: ${blogsToUpdate}\n`);

  // ── ANNOUNCEMENTS ──
  const anns = await prisma.announcement.findMany({
    select: { id: true, title: true, imageUrl: true },
    orderBy: { createdAt: "desc" },
  });

  console.log(`=== ANNOUNCEMENTS (${anns.length}) ===\n`);
  let annsToUpdate = 0;
  const annOps: { id: string; data: { imageUrl: string } }[] = [];

  for (const a of anns) {
    if (!isCloudinary(a.imageUrl)) {
      console.log(`  ✓ "${a.title.slice(0, 60)}" — already non-cloudinary, skip`);
      continue;
    }
    const titleLower = a.title.toLowerCase();
    let pickSlug: string | undefined;
    let pickReason = "fallback";
    for (const { keyword, productSlug } of ANNOUNCEMENT_KEYWORD_PRODUCT) {
      if (titleLower.includes(keyword)) {
        pickSlug = productSlug;
        pickReason = `keyword:${keyword}`;
        break;
      }
    }
    if (!pickSlug) pickSlug = ANNOUNCEMENT_FALLBACK;
    const newImageUrl = productImage[pickSlug];
    if (!newImageUrl) {
      console.log(`  ⚠ "${a.title.slice(0, 60)}" — no R2 image for "${pickSlug}", skipping`);
      continue;
    }
    console.log(`  → "${a.title.slice(0, 60)}" ← ${pickSlug} (${pickReason})`);
    annsToUpdate++;
    annOps.push({ id: a.id, data: { imageUrl: newImageUrl } });
  }
  console.log(`\nAnnouncements to update: ${annsToUpdate}\n`);

  if (!APPLY) {
    console.log("─".repeat(70));
    console.log("DRY RUN — no changes made. Re-run with --apply to commit:");
    console.log("  npx tsx ./_fix_blog_announcement_media.ts --apply");
    await prisma.$disconnect();
    return;
  }

  console.log("─".repeat(70));
  console.log(`Applying ${blogOps.length + annOps.length} updates…`);
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
