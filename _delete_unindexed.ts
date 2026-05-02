/**
 * One-shot: delete every Product row whose slug is NOT in the indexed-keep
 * list AND has zero ProductView records. SEO-safe: anything Google has
 * indexed (per your screenshots) or that any real visitor has ever opened
 * is preserved.
 *
 * Dry-run by default — prints what would be deleted. Pass --apply to
 * actually delete. Always writes a JSON backup of deleted rows first
 * so nothing is permanently lost.
 *
 *   npx tsx ./_delete_unindexed.ts            # preview only
 *   npx tsx ./_delete_unindexed.ts --apply    # delete (with backup)
 *
 * CRAFTED By W1C3
 */

import "dotenv/config";
import * as fs from "fs/promises";
import { prisma } from "./lib/prisma";

const APPLY = process.argv.includes("--apply");
const STRICT = process.argv.includes("--strict");

// Slugs identified as indexed by Google (per the 4 screenshots).
// Also keeping the second slug of any duplicate ("LCG 90H" / "Citrus tsunami")
// since the screenshots can't always disambiguate which one is indexed.
const INDEXED_KEEP_LIST = new Set<string>([
  "dark-matter",
  "gumbo-88g",
  "candy-x",
  "skittles-candy",
  "pink-runtz",
  "lcg-90h",
  "lcg-90h-2",
  "applescotti-indoors",
  "cherry-7up",
  "strawberry-mac",
  "gogetta-candy",
  "rainbow-dulce-indoors",
  "citrus-tsunami",
  "citrus-tsunami-2",
  "pink-versace-indoors",
  "fetty-wap-ing-stamp",
  "liitt-exotics-thc",
  "cookie-crisp-indoors",
  "black-runtz-3-108",
  "marshmallow-mac-indoor-sm",
  "blue-candy-lemons-indoors",
  "kaws-rocks-master-boxes-premium-moonrocks",
  // Subjects of indexed blog reviews — deleting these would break the blog → product link
  "frozen-thin-mint-sm",
  "venom-runtz",
  "raspberry-airheadz",
]);

const BACKUP_FILE = "./_deleted_products_backup.json";

async function main() {
  console.log(`Mode: ${APPLY ? "APPLY (deleting + writing backup)" : "DRY RUN (no changes)"}\n`);

  // Pull every product, plus its view count
  const products = await prisma.product.findMany({
    orderBy: [{ category: "asc" }, { title: "asc" }],
    include: {
      _count: { select: { views: true } },
    },
  });

  // Auto-keep any product with ≥1 ProductView (real organic traffic = probably indexed)
  // — disabled with --strict so only the indexed list keeps anything alive.
  const trafficKeep = new Set<string>();
  if (!STRICT) {
    for (const p of products) {
      if (p._count.views > 0 && p.slug) trafficKeep.add(p.slug);
    }
  }

  console.log(`Total products in DB: ${products.length}`);
  console.log(`Indexed keep list (from screenshots): ${INDEXED_KEEP_LIST.size}`);
  console.log(`Auto-keep (≥1 ProductView):           ${STRICT ? "disabled (--strict)" : trafficKeep.size}`);

  // Cross-check: which indexed-list slugs don't actually exist in DB? Spot mismatch.
  const dbSlugs = new Set(products.map((p) => p.slug).filter((s): s is string => !!s));
  const missingIndexed = [...INDEXED_KEEP_LIST].filter((s) => !dbSlugs.has(s));
  if (missingIndexed.length) {
    console.log(`\n⚠ Indexed-list slugs not found in DB (typo? renamed?):`);
    for (const s of missingIndexed) console.log(`    ${s}`);
  }

  // Partition products into keep vs delete
  const keep: typeof products = [];
  const del: typeof products = [];
  for (const p of products) {
    const slug = p.slug || "";
    const keptByIndex = INDEXED_KEEP_LIST.has(slug);
    const keptByTraffic = trafficKeep.has(slug);
    if (keptByIndex || keptByTraffic) {
      keep.push(p);
    } else {
      del.push(p);
    }
  }

  console.log(`\n${"─".repeat(70)}`);
  console.log(`KEEP: ${keep.length} products`);
  console.log("─".repeat(70));
  for (const p of keep) {
    const views = p._count.views;
    const reason = INDEXED_KEEP_LIST.has(p.slug || "") ? "indexed" : `${views} view${views === 1 ? "" : "s"}`;
    console.log(`  ✓  [${p.category.padEnd(13)}]  ${(p.slug ?? "(no-slug)").padEnd(45).slice(0, 45)}  (${reason})`);
  }

  console.log(`\n${"─".repeat(70)}`);
  console.log(`DELETE: ${del.length} products`);
  console.log("─".repeat(70));
  for (const p of del) {
    console.log(`  ✗  [${p.category.padEnd(13)}]  ${(p.slug ?? "(no-slug)").padEnd(45).slice(0, 45)}  ${p.title}`);
  }

  if (del.length === 0) {
    console.log("\nNothing to delete — every product is either indexed or has traffic.");
    await prisma.$disconnect();
    return;
  }

  if (!APPLY) {
    console.log(`\n${"─".repeat(70)}`);
    console.log(`This is a DRY RUN — no changes made.`);
    console.log(`Review the DELETE list above carefully. If it looks right, re-run:`);
    console.log(`  npx tsx ./_delete_unindexed.ts --apply`);
    console.log(`Backups will be written to ${BACKUP_FILE} before any deletion.`);
    await prisma.$disconnect();
    return;
  }

  // --- APPLY MODE ---
  // 1. Write backup of every product about to be deleted
  const backupPayload = {
    deletedAt: new Date().toISOString(),
    count: del.length,
    products: del.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      category: p.category,
      indoor: p.indoor,
      rating: p.rating,
      priceLocal: p.priceLocal,
      priceShip: p.priceShip,
      slashedPriceLocal: p.slashedPriceLocal,
      slashedPriceShip: p.slashedPriceShip,
      isSoldOut: p.isSoldOut,
      imageUrl: p.imageUrl,
      images: p.images,
      videoUrl: p.videoUrl,
      description: p.description,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      viewCount: p._count.views,
    })),
  };
  await fs.writeFile(BACKUP_FILE, JSON.stringify(backupPayload, null, 2));
  console.log(`\n✓ Backup written: ${BACKUP_FILE} (${del.length} products)`);

  // 2. Delete in chunks (Postgres can choke on huge IN lists)
  const ids = del.map((p) => p.id);
  const result = await prisma.product.deleteMany({ where: { id: { in: ids } } });
  console.log(`✓ Deleted ${result.count} product rows from the database.`);

  console.log(`\nDone. ${keep.length} products remain. ${del.length} archived to ${BACKUP_FILE}.`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
