/**
 * One-shot: delete every Product row from realduck's database.
 *
 * Safety:
 *   • Connects ONLY to this project's DATABASE_URL — never to the other
 *     sites' DBs.
 *   • Backs up every deleted row to JSON before deletion (recoverable).
 *   • Does NOT touch R2 files. Other sites may still reference these
 *     images via their own DB rows (or may have copied them); R2 cleanup
 *     is a separate, opt-in step.
 *   • Touches only Product (and its cascading ProductView analytics).
 *     Orders, CheckoutOrders, BlogPost, Announcement, NewsletterSubscriber,
 *     Promoter/Campaign, Admin, etc. are NOT touched.
 *
 * Default = dry run; pass --apply to actually delete.
 *
 *   npx tsx ./_delete_all_realduck_products.ts          # preview
 *   npx tsx ./_delete_all_realduck_products.ts --apply  # delete
 *
 * CRAFTED By W1C3
 */

import "dotenv/config";
import * as fs from "fs/promises";
import { prisma } from "./lib/prisma";

const APPLY = process.argv.includes("--apply");
const BACKUP_FILE = "./_deleted_all_products_backup.json";

async function main() {
  // Sanity check: confirm we're hitting realduck's DB, not someone else's.
  const dbUrl = process.env.DATABASE_URL || "";
  const dbHost = (() => {
    try { return new URL(dbUrl).host; } catch { return "(unparseable)"; }
  })();
  console.log(`Mode: ${APPLY ? "APPLY (deleting)" : "DRY RUN"}`);
  console.log(`Target DB host: ${dbHost}\n`);

  if (!dbHost.includes("ep-jolly-brook")) {
    console.error("⚠ DATABASE_URL host does not match expected realduck host (ep-jolly-brook…).");
    console.error("Aborting. If this is intentional, edit the host check in this script.");
    process.exit(1);
  }

  const products = await prisma.product.findMany({
    orderBy: [{ category: "asc" }, { title: "asc" }],
    include: { _count: { select: { views: true } } },
  });

  let totalViews = 0;
  for (const p of products) totalViews += p._count.views;

  console.log(`Products to delete: ${products.length}`);
  console.log(`Cascading ProductView rows: ${totalViews}`);
  console.log("─".repeat(70));

  // Group by category for readable preview
  const byCat = new Map<string, typeof products>();
  for (const p of products) {
    if (!byCat.has(p.category)) byCat.set(p.category, []);
    byCat.get(p.category)!.push(p);
  }
  for (const [cat, list] of [...byCat.entries()].sort()) {
    console.log(`\n  [${cat}] (${list.length})`);
    for (const p of list) {
      console.log(`    - ${(p.slug ?? "(no-slug)").padEnd(50).slice(0, 50)} ${p.title}`);
    }
  }
  console.log();

  if (products.length === 0) {
    console.log("Nothing to delete.");
    await prisma.$disconnect();
    return;
  }

  if (!APPLY) {
    console.log("─".repeat(70));
    console.log("DRY RUN — no changes made.");
    console.log("Re-run with --apply to commit:");
    console.log("  npx tsx ./_delete_all_realduck_products.ts --apply");
    await prisma.$disconnect();
    return;
  }

  // Apply: backup first, then delete.
  const backup = {
    deletedAt: new Date().toISOString(),
    dbHost,
    count: products.length,
    products: products.map((p) => ({
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
  await fs.writeFile(BACKUP_FILE, JSON.stringify(backup, null, 2));
  console.log(`✓ Backup written: ${BACKUP_FILE} (${products.length} products)`);

  const result = await prisma.product.deleteMany({});
  console.log(`✓ Deleted ${result.count} Product rows.`);
  console.log(`  (Cascaded ${totalViews} ProductView rows)`);

  // Final verification
  const remaining = await prisma.product.count();
  console.log(`\nProducts remaining: ${remaining}`);

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
