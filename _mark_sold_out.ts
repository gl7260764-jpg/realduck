/**
 * One-shot: mark every product whose ship price (first tier) is between
 * $300 and $499 inclusive as sold out. Products stay on the site (no
 * deletion, no hiding) — just `isSoldOut = true`.
 *
 * Idempotent: products already sold out are skipped.
 */

import { prisma } from "./lib/prisma";

const MIN = 300;
const MAX = 499;

function firstPriceLine(priceField: string | null | undefined): number | null {
  if (!priceField) return null;
  const firstLine = priceField.split("\n")[0];
  const match = firstLine.match(/(\d[\d,]*(?:\.\d+)?)/);
  if (!match) return null;
  const num = parseFloat(match[1].replace(/,/g, ""));
  return Number.isFinite(num) ? num : null;
}

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, slug: true, title: true, priceLocal: true, priceShip: true, isSoldOut: true },
  });

  console.log(`Total products: ${products.length}`);
  console.log(`Targeting ship price between $${MIN} and $${MAX}\n`);

  const matches: Array<{ id: string; slug: string | null; title: string; price: number; alreadySoldOut: boolean }> = [];

  for (const p of products) {
    const ship = firstPriceLine(p.priceShip);
    if (ship === null) continue;
    if (ship >= MIN && ship <= MAX) {
      matches.push({ id: p.id, slug: p.slug, title: p.title, price: ship, alreadySoldOut: p.isSoldOut });
    }
  }

  console.log(`Matches in ${MIN}-${MAX} range: ${matches.length}`);
  if (matches.length === 0) {
    console.log("(no products to update)");
    await prisma.$disconnect();
    return;
  }

  console.log("\nProducts that will be marked sold out:");
  console.log("─".repeat(80));
  for (const m of matches) {
    const flag = m.alreadySoldOut ? "(already sold out — skip)" : "→ marking sold out";
    console.log(`  $${m.price.toString().padEnd(6)}  ${m.title.padEnd(45).slice(0, 45)}  ${flag}`);
  }
  console.log("─".repeat(80));

  const toUpdate = matches.filter((m) => !m.alreadySoldOut);
  if (toUpdate.length === 0) {
    console.log("\nAll matching products are already sold out. Nothing to change.");
    await prisma.$disconnect();
    return;
  }

  const result = await prisma.product.updateMany({
    where: { id: { in: toUpdate.map((m) => m.id) } },
    data: { isSoldOut: true },
  });

  console.log(`\n✓ Updated ${result.count} products: isSoldOut = true`);
  console.log("Products remain visible on the site — only the sold-out badge changes.");

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
