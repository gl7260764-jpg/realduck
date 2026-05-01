/**
 * One-shot: update the `description` field on FLOWER-category products
 * based on the first line of `priceShip`:
 *
 *   • $300 – $499 inclusive → write "Sold Out" in red (description only,
 *                              no image badge — clears `isSoldOut`)
 *   • $500 – $800 inclusive → write "Minimum order is 2 Pounds" in red
 *
 * The message lives in the description (rendered on the product details
 * page) — it is NOT shown over the product image. Existing description
 * text is preserved; the red marker is prepended once and the run is
 * idempotent (re-running skips already-marked products).
 *
 * CRAFTED By W1C3
 */

import { prisma } from "./lib/prisma";

const SOLD_OUT_MIN = 300;
const SOLD_OUT_MAX = 499;
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

interface Match {
  id: string;
  title: string;
  price: number;
  nextDescription: string;
  needsDescUpdate: boolean;
  needsBadgeClear: boolean;
}

async function main() {
  const products = await prisma.product.findMany({
    where: { category: "FLOWER" },
    select: { id: true, slug: true, title: true, priceShip: true, description: true, isSoldOut: true },
  });

  console.log(`Total FLOWER products: ${products.length}`);
  console.log(`Sold Out range:    $${SOLD_OUT_MIN}–$${SOLD_OUT_MAX} (priceShip first line)`);
  console.log(`Min Order range:   $${MIN_ORDER_MIN}–$${MIN_ORDER_MAX} (priceShip first line)\n`);

  const soldOutMatches: Match[] = [];
  const minOrderMatches: Match[] = [];

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
        needsDescUpdate: !(p.description ?? "").includes(SOLD_OUT_HTML),
        needsBadgeClear: p.isSoldOut === true,
      });
    } else if (ship >= MIN_ORDER_MIN && ship <= MIN_ORDER_MAX) {
      const next = withMarker(p.description, MIN_ORDER_HTML);
      minOrderMatches.push({
        id: p.id,
        title: p.title,
        price: ship,
        nextDescription: next,
        needsDescUpdate: !(p.description ?? "").includes(MIN_ORDER_HTML),
        needsBadgeClear: false,
      });
    }
  }

  console.log(`Sold Out matches: ${soldOutMatches.length}`);
  console.log("─".repeat(80));
  for (const m of soldOutMatches) {
    const parts: string[] = [];
    if (m.needsDescUpdate) parts.push("write 'Sold Out' to description");
    if (m.needsBadgeClear) parts.push("clear isSoldOut badge");
    const flag = parts.length ? "→ " + parts.join(" + ") : "(already correct — skip)";
    console.log(`  $${String(m.price).padEnd(5)}  ${m.title.padEnd(45).slice(0, 45)}  ${flag}`);
  }
  console.log("─".repeat(80));

  console.log(`\nMin Order matches: ${minOrderMatches.length}`);
  console.log("─".repeat(80));
  for (const m of minOrderMatches) {
    const flag = m.needsDescUpdate ? "→ writing 'Minimum order is 2 Pounds'" : "(already marked — skip)";
    console.log(`  $${String(m.price).padEnd(5)}  ${m.title.padEnd(45).slice(0, 45)}  ${flag}`);
  }
  console.log("─".repeat(80));

  const toUpdate = [...soldOutMatches, ...minOrderMatches].filter(
    (m) => m.needsDescUpdate || m.needsBadgeClear,
  );

  if (toUpdate.length === 0) {
    console.log("\nNothing to change — all matching products are already correct.");
    await prisma.$disconnect();
    return;
  }

  let updated = 0;
  for (const m of toUpdate) {
    const data: { description?: string; isSoldOut?: boolean } = {};
    if (m.needsDescUpdate) data.description = m.nextDescription;
    if (m.needsBadgeClear) data.isSoldOut = false;
    await prisma.product.update({ where: { id: m.id }, data });
    updated++;
  }

  console.log(`\n✓ Updated ${updated} FLOWER product(s). Sold-out message now only on the details page, not the image.`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
