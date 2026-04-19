/**
 * One-time script to generate slugs for existing products.
 * Run with: npx tsx scripts/backfill-slugs.ts
 */
import { PrismaClient } from "@prisma/client";
import { slugify } from "../lib/slug";

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    where: { slug: null },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Found ${products.length} products without slugs`);

  const usedSlugs = new Set<string>();
  // Collect existing slugs
  const existing = await prisma.product.findMany({
    where: { slug: { not: null } },
    select: { slug: true },
  });
  existing.forEach((p) => p.slug && usedSlugs.add(p.slug));

  for (const product of products) {
    let base = slugify(product.title) || "product";
    let slug = base;
    let counter = 1;
    while (usedSlugs.has(slug)) {
      counter++;
      slug = `${base}-${counter}`;
    }
    usedSlugs.add(slug);

    await prisma.product.update({
      where: { id: product.id },
      data: { slug },
    });

    console.log(`✓ ${product.title} → ${slug}`);
  }

  console.log(`\nDone! Backfilled ${products.length} slugs.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
