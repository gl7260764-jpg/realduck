/**
 * Read all _deleted_*_backup.json files in the project root and populate
 * the DeletedSlug table. Idempotent — uses upsert on slug.
 *
 *   npx tsx ./_seed_deleted_slugs.ts          # preview counts
 *   npx tsx ./_seed_deleted_slugs.ts --apply  # write to DB
 */

import "dotenv/config";
import * as fs from "fs/promises";
import * as path from "path";
import { prisma } from "./lib/prisma";

const APPLY = process.argv.includes("--apply");

async function main() {
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY RUN"}\n`);
  const files = (await fs.readdir(".")).filter(
    (f) => /^_deleted.*backup.*\.json$/.test(f),
  );

  if (files.length === 0) {
    console.error("No _deleted_*_backup*.json files found.");
    process.exit(1);
  }

  // slug → { title, sourceFile }
  const collected = new Map<string, { title?: string; source: string }>();

  for (const file of files) {
    const raw = await fs.readFile(path.join(".", file), "utf8");
    const data = JSON.parse(raw);
    const products: { slug?: string; title?: string }[] = data.products || [];
    let added = 0;
    for (const p of products) {
      if (!p.slug) continue;
      if (!collected.has(p.slug)) {
        collected.set(p.slug, { title: p.title, source: file });
        added++;
      }
    }
    console.log(`  ${file}: ${products.length} entries (${added} new unique slugs)`);
  }

  console.log(`\nTotal unique deleted slugs: ${collected.size}`);

  if (!APPLY) {
    console.log("\nDRY RUN — re-run with --apply to write to DB.");
    await prisma.$disconnect();
    return;
  }

  let inserted = 0;
  let updated = 0;
  for (const [slug, { title }] of collected) {
    const result = await prisma.deletedSlug.upsert({
      where: { slug },
      create: { slug, kind: "product", title },
      update: {}, // don't overwrite existing entries (deletedAt stays)
    });
    if (!result) continue;
    // Detect insert vs update by checking if it already existed before — simpler approach: just count.
    inserted++;
  }

  const total = await prisma.deletedSlug.count();
  console.log(`✓ Upserted ${inserted}. Total DeletedSlug rows now: ${total}`);

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
