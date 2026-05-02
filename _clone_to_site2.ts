/**
 * Clone Site 1's product catalog into Site 2's database.
 *
 *   • Only products are copied (per user choice; blogs/announcements skipped).
 *   • Admin auth lives in env vars, not the DB — Site 2 sets its own
 *     ADMIN_USERNAME / ADMIN_PASSWORD locally; nothing seeded here.
 *   • Order history, analytics, sessions, newsletter subs etc. are NOT
 *     copied — those are per-site runtime data.
 *   • R2 image URLs travel with the products as-is (the bucket is shared
 *     between sites, so the URLs work on Site 2 immediately).
 *
 * Default = dry run; pass --apply to write to Site 2.
 *
 *   npx tsx ./_clone_to_site2.ts          # preview
 *   npx tsx ./_clone_to_site2.ts --apply  # clone
 *
 * Idempotent: products that already exist in Site 2 (matched by slug) are
 * UPDATED to match Site 1; missing ones are CREATED. Site-2-only products
 * are NEVER deleted by this script.
 *
 * CRAFTED By W1C3
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const APPLY = process.argv.includes("--apply");

const SOURCE_URL = process.env.DATABASE_URL;
const TARGET_URL = process.env.SITE2_DATABASE_URL;

if (!SOURCE_URL) {
  console.error("Missing DATABASE_URL (source — Site 1)");
  process.exit(1);
}
if (!TARGET_URL) {
  console.error("Missing SITE2_DATABASE_URL (target — Site 2)");
  process.exit(1);
}
if (SOURCE_URL === TARGET_URL) {
  console.error("DATABASE_URL and SITE2_DATABASE_URL are identical — refusing to clone a DB onto itself");
  process.exit(1);
}

const source = new PrismaClient({ datasourceUrl: SOURCE_URL });
const target = new PrismaClient({ datasourceUrl: TARGET_URL });

async function main() {
  console.log(`Mode: ${APPLY ? "APPLY (writing to Site 2)" : "DRY RUN"}`);
  console.log(`Source:  ${new URL(SOURCE_URL!).host}`);
  console.log(`Target:  ${new URL(TARGET_URL!).host}\n`);

  const sourceProducts = await source.product.findMany({
    orderBy: { createdAt: "asc" },
  });
  const targetProducts = await target.product.findMany({
    select: { id: true, slug: true },
  });

  console.log(`Source has ${sourceProducts.length} products`);
  console.log(`Target has ${targetProducts.length} products before clone\n`);

  const targetSlugs = new Map(
    targetProducts.filter((p) => p.slug).map((p) => [p.slug as string, p.id]),
  );

  let toCreate = 0;
  let toUpdate = 0;
  const operations: { op: "create" | "update"; slug: string; title: string }[] = [];

  for (const p of sourceProducts) {
    const slugKey = p.slug;
    if (slugKey && targetSlugs.has(slugKey)) {
      toUpdate++;
      operations.push({ op: "update", slug: slugKey, title: p.title });
    } else {
      toCreate++;
      operations.push({ op: "create", slug: slugKey ?? "(no-slug)", title: p.title });
    }
  }

  console.log(`Plan:`);
  console.log(`  Create new: ${toCreate}`);
  console.log(`  Update existing: ${toUpdate}`);
  console.log();

  // Pretty preview
  for (const o of operations) {
    const flag = o.op === "create" ? "+" : "~";
    console.log(`  ${flag} ${o.slug.padEnd(50).slice(0, 50)} ${o.title}`);
  }
  console.log();

  if (!APPLY) {
    console.log("─".repeat(70));
    console.log("DRY RUN — no changes made. Re-run with --apply to clone.");
    await source.$disconnect();
    await target.$disconnect();
    return;
  }

  console.log(`Cloning…`);
  let created = 0;
  let updated = 0;
  for (const p of sourceProducts) {
    // Strip the auto-managed fields (id, createdAt, updatedAt) — let Site 2 generate its own.
    const data = {
      slug: p.slug,
      title: p.title,
      description: p.description,
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
    };

    if (p.slug && targetSlugs.has(p.slug)) {
      await target.product.update({
        where: { id: targetSlugs.get(p.slug)! },
        data,
      });
      updated++;
    } else {
      await target.product.create({ data });
      created++;
    }
  }

  console.log(`✓ Created ${created} new product(s) in Site 2`);
  console.log(`✓ Updated ${updated} existing product(s) in Site 2`);

  const finalCount = await target.product.count();
  console.log(`\nSite 2 now has ${finalCount} products total.`);

  await source.$disconnect();
  await target.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await source.$disconnect().catch(() => {});
  await target.$disconnect().catch(() => {});
  process.exit(1);
});
