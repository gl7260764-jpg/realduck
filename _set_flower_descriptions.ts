/**
 * One-shot: update the `description` field on FLOWER-category products
 * based on the first line of `priceShip`:
 *
 *   • $250 – $399 inclusive → write "Sold Out" in red
 *   • $500 – $800 inclusive → write "Minimum order is 2 Pounds" in red
 *
 * No other fields are changed. Existing description text is preserved —
 * the red marker is prepended once and the run is idempotent (re-running
 * skips products that already carry the marker).
 *
 * CRAFTED By W1C3
 */

import { prisma } from "./lib/prisma";

const SOLD_OUT_MIN = 250;
const SOLD_OUT_MAX = 399;
const MIN_ORDER_MIN = 500;
const MIN_ORDER_MAX = 800;

const SOLD_OUT_HTML = '<span style="color:red;font-weight:bold;">Sold Out</span>';
const MIN_ORDER_HTML = '<span style="color:red;font-weight:bold;">Minimum order is 2 Pounds</span>';

function firstPriceLine(priceField: string | null | undefined): number | null {
  if (!priceField) return null;
  const firstLine = priceField.split("\n")[0];
  const match = firstLine.match(/(\d[\d,]*(?:\.\d+)?)/);
  if (!match) return null;
  const num = parseFloat(match[1].replace(/,/g, ""));
  return Number.isFinite(num) ? num : null;
}

function withMarker(existing: string | null | undefined, marker: string): string {
  const current = (existing ?? "").trim();
  if (current.includes(marker)) return current;
  return current.length === 0 ? marker : `${marker}\n\n${current}`;
}

async function main() {
  const products = await prisma.product.findMany({
    where: { category: "FLOWER" },
    select: { id: true, slug: true, title: true, priceShip: true, description: true },
  });

  console.log(`Total FLOWER products: ${products.length}`);
  console.log(`Sold Out range:    $${SOLD_OUT_MIN}–$${SOLD_OUT_MAX} (priceShip first line)`);
  console.log(`Min Order range:   $${MIN_ORDER_MIN}–$${MIN_ORDER_MAX} (priceShip first line)\n`);

  const soldOutMatches: { id: string; title: string; price: number; nextDescription: string; alreadyMarked: boolean }[] = [];
  const minOrderMatches: { id: string; title: string; price: number; nextDescription: string; alreadyMarked: boolean }[] = [];

  for (const p of products) {
    const ship = firstPriceLine(p.priceShip);
    if (ship === null) continue;

    if (ship >= SOLD_OUT_MIN && ship <= SOLD_OUT_MAX) {
      const next = withMarker(p.description, SOLD_OUT_HTML);
      soldOutMatches.push({
        id: p.id,
        title: p.title,
        price: ship,
        nextDescription: next,
        alreadyMarked: (p.description ?? "").includes(SOLD_OUT_HTML),
      });
    } else if (ship >= MIN_ORDER_MIN && ship <= MIN_ORDER_MAX) {
      const next = withMarker(p.description, MIN_ORDER_HTML);
      minOrderMatches.push({
        id: p.id,
        title: p.title,
        price: ship,
        nextDescription: next,
        alreadyMarked: (p.description ?? "").includes(MIN_ORDER_HTML),
      });
    }
  }

  console.log(`Sold Out matches: ${soldOutMatches.length}`);
  console.log("─".repeat(80));
  for (const m of soldOutMatches) {
    const flag = m.alreadyMarked ? "(already marked — skip)" : "→ writing 'Sold Out'";
    console.log(`  $${String(m.price).padEnd(5)}  ${m.title.padEnd(45).slice(0, 45)}  ${flag}`);
  }
  console.log("─".repeat(80));

  console.log(`\nMin Order matches: ${minOrderMatches.length}`);
  console.log("─".repeat(80));
  for (const m of minOrderMatches) {
    const flag = m.alreadyMarked ? "(already marked — skip)" : "→ writing 'Minimum order is 2 Pounds'";
    console.log(`  $${String(m.price).padEnd(5)}  ${m.title.padEnd(45).slice(0, 45)}  ${flag}`);
  }
  console.log("─".repeat(80));

  const toUpdate = [
    ...soldOutMatches.filter((m) => !m.alreadyMarked),
    ...minOrderMatches.filter((m) => !m.alreadyMarked),
  ];

  if (toUpdate.length === 0) {
    console.log("\nAll matching products already carry their markers. Nothing to change.");
    await prisma.$disconnect();
    return;
  }

  let updated = 0;
  for (const m of toUpdate) {
    await prisma.product.update({
      where: { id: m.id },
      data: { description: m.nextDescription },
    });
    updated++;
  }

  console.log(`\n✓ Updated ${updated} FLOWER product description(s). No other fields touched.`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
