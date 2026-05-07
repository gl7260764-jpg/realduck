/**
 * Ultimate SEO pass — rewrites every Product and BlogPost metaTitle and
 * metaDescription with unique, varied content.
 *
 * Strategy:
 *   • Hash-based rotation across 8–12 title patterns per category
 *   • Multi-component descriptions: opening + value-prop + trust + CTA
 *   • USA-focused keywords distributed across the catalog (states, cities,
 *     national delivery angles, regional intent)
 *   • Each product gets a deterministic-but-unique combination
 *   • Stripped emojis, clean character counts (titles ≤ 65, desc ≤ 160)
 *
 * Run:
 *   npx tsx ./_ultimate_seo_pass.ts          # preview
 *   npx tsx ./_ultimate_seo_pass.ts --apply  # write to DB
 *
 * Idempotent — same slug produces same SEO output every run.
 *
 * CRAFTED By W1C3
 */

import "dotenv/config";
import { prisma } from "./lib/prisma";

const APPLY = process.argv.includes("--apply");

// ── Hashing for deterministic-but-distributed selection ──
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function cleanTitle(s: string): string {
  let cleaned = s
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2700}-\u{27BF}]/gu, "")
    .replace(/[\u{1F1E6}-\u{1F1FF}]/gu, "") // flag emoji
    .replace(/\s+/g, " ")
    .trim();
  // If the title is ALL CAPS (more than 4 chars and no lowercase), title-case it
  // for better SEO readability. Brand-style "OG", "THC" etc. preserved.
  const isAllCaps = cleaned.length > 4 && cleaned === cleaned.toUpperCase() && /[A-Z]{3,}/.test(cleaned);
  if (isAllCaps) {
    cleaned = cleaned
      .toLowerCase()
      .split(/\s+/)
      .map((w) => {
        // Keep common acronyms/abbreviations capitalized
        if (/^(og|thc|cbd|hp|p|usa|us|la|ny|fl|tx|ca|hp|gmo|rs11|krt|2g|1g|3g|3-?\d+|h\d+|xl|xs|md|sm|lg)$/i.test(w)) {
          return w.toUpperCase();
        }
        return w.charAt(0).toUpperCase() + w.slice(1);
      })
      .join(" ");
  }
  return cleaned;
}

function pickFromArr<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

// ── Title templates per category (10+ each, varied angles) ──

const TITLE_TEMPLATES: Record<string, string[]> = {
  DISPOSABLES: [
    "{name} — Premium Cannabis Disposable Vape | Real Duck Distro",
    "Buy {name} Online — Authentic THC Disposable | USA Shipping",
    "{name} Vape Pen | Real Duck Distro — Live Resin Disposables",
    "Order {name} — Lab-Tested Cannabis Disposable | RDD",
    "Shop {name} Disposable | Premium All-in-One Cannabis Pen",
    "{name} | Real Duck Distro Cannabis Disposable Vape Catalog",
    "Authentic {name} | Cannabis Vape Pen | Discreet US Shipping",
    "{name} Live Resin Disposable | Real Duck Distro Online",
    "Buy {name} Cannabis Vape | Premium THC Pen | Fast Delivery USA",
    "{name} 2G Disposable | Real Duck Distro Premium Vape Shop",
    "Get {name} Cannabis Disposable | Authentic Brand | RDD USA",
  ],
  FLOWER: [
    "{name} — Premium Indoor Cannabis Flower | Real Duck Distro",
    "Buy {name} Strain Online | Lab-Tested Indoor Exotic | RDD",
    "{name} Cannabis Flower | Top-Shelf Indoor | Real Duck Distro",
    "Order {name} Strain — Premium Exotic Indoor | Fast US Shipping",
    "Shop {name} Flower | Indoor Cannabis Strain | Real Duck Distro",
    "{name} | Indoor Exotic Flower | Real Duck Distro USA",
    "Authentic {name} Strain | Premium Cannabis Flower | RDD Online",
    "{name} Indoor Cannabis | Real Duck Distro Premium Catalog",
    "Buy {name} | Top-Shelf Indoor Exotic Flower | Real Duck Distro",
    "{name} Cannabis Strain | Premium Indoor | Order Online USA",
    "Get {name} Flower Delivered | Premium Indoor Cannabis | RDD",
  ],
  CONCENTRATES: [
    "{name} — Premium Cannabis Concentrate | Real Duck Distro",
    "Buy {name} Online | Authentic Cannabis Extract | USA Shipping",
    "{name} | Lab-Tested Cannabis Wax & Badder | Real Duck Distro",
    "Order {name} Cannabis Extract — Premium Live Resin | RDD",
    "Shop {name} Concentrate Online | Cannabis Extract Catalog",
    "{name} Cannabis Wax | Premium Concentrate | Real Duck Distro",
    "Authentic {name} | Premium Live Resin Extract | RDD",
    "{name} Cannabis Sugar & Badder | Real Duck Distro Online",
    "Buy {name} Concentrate | Lab-Tested Extract | Fast US Delivery",
    "{name} | Real Duck Distro Cannabis Concentrate Shop",
  ],
  EDIBLES: [
    "{name} — Premium THC Edibles | Real Duck Distro",
    "Buy {name} Cannabis Gummies Online | Lab-Tested THC | USA",
    "{name} | Premium THC-Infused Edibles | Real Duck Distro",
    "Order {name} Cannabis Edibles | Authentic Gummies | RDD USA",
    "Shop {name} | THC Gummies & Edibles | Real Duck Distro Online",
    "{name} Edibles | Premium Cannabis Gummies | RDD Catalog",
    "Authentic {name} Cannabis Edibles | Lab-Tested THC | RDD",
    "{name} | Real Duck Distro Premium Cannabis Gummies",
    "Get {name} Edibles | Premium THC Gummies | Fast US Shipping",
    "Buy {name} Online | Cannabis Gummies | Real Duck Distro USA",
  ],
  PREROLLS: [
    "{name} — Premium Cannabis Pre-Rolls | Real Duck Distro",
    "Buy {name} Pre-Rolls Online | Hand-Rolled Cannabis Joints",
    "{name} | Real Duck Distro Cannabis Pre-Roll Catalog",
    "Order {name} Pre-Rolls — Premium Cannabis | RDD USA",
    "Shop {name} Joints | Premium Cannabis Pre-Rolls | RDD",
    "{name} Cannabis Joints | Premium Pre-Rolls | Real Duck Distro",
    "Authentic {name} Pre-Rolls | Top-Shelf Cannabis | RDD",
    "Buy {name} | Hand-Rolled Cannabis Joints | Fast US Shipping",
  ],
  MUSHROOM: [
    "{name} — Premium Mushroom Edibles | Real Duck Distro",
    "Buy {name} Mushroom Gummies Online | Amanita Edibles | USA",
    "{name} | Functional Mushroom Edibles | Real Duck Distro",
    "Order {name} Mushroom Gummies | Authentic Amanita Blend | RDD",
    "Shop {name} | Premium Amanita Mushroom Gummies | RDD USA",
    "{name} Mushroom Edibles | Real Duck Distro Catalog",
    "Authentic {name} | Amanita Mushroom Gummies | Fast US Shipping",
    "{name} | Real Duck Distro Mushroom Gummy Shop",
  ],
  PILLS: [
    "{name} — Authentic Pharmaceutical | Real Duck Distro",
    "Buy Authentic {name} Online | Verified Pharmaceutical | RDD",
    "{name} | Pharmaceutical-Grade | Real Duck Distro USA",
    "Order Authentic {name} | Lab-Verified Quality | RDD Online",
    "Shop {name} | Real Duck Distro Pharmaceutical Catalog",
    "{name} | Verified Authentic Pharmaceutical | RDD USA",
    "Authentic {name} Pharmaceutical | Real Duck Distro Online",
    "Get {name} | Authentic Pharmaceutical | Fast US Shipping",
  ],
  COKE: [
    "{name} | Real Duck Distro Premium Catalog",
    "Buy {name} Online | Real Duck Distro USA",
    "{name} — Authentic | Real Duck Distro",
    "Order {name} Online | Real Duck Distro Premium",
    "Shop {name} | Real Duck Distro Premium Selection",
  ],
  TOP_SHELF: [
    "{name} — Boutique Top-Shelf Cannabis | Real Duck Distro",
    "Buy {name} Online | Premium Top-Shelf Indoor | RDD USA",
    "{name} Top-Shelf Flower | Boutique Cannabis | RDD",
    "Order {name} | Designer Top-Shelf Indoor | Real Duck Distro",
    "Shop {name} | Premium Boutique Cannabis Flower | RDD",
    "{name} | Top-Shelf Indoor Cannabis | Real Duck Distro Catalog",
    "Authentic {name} | Boutique Top-Shelf Cannabis | RDD USA",
    "Buy {name} Top-Shelf | Premium Indoor Cannabis | Fast Delivery",
  ],
  OTHERS: [
    "{name} — Premium Specialty Cannabis | Real Duck Distro",
    "Buy {name} Online | Real Duck Distro Specialty Catalog",
    "{name} | Real Duck Distro USA Premium Selection",
    "Order {name} | Specialty Cannabis | Real Duck Distro",
    "Shop {name} Online | Real Duck Distro Premium Shop",
    "{name} | Premium Cannabis Specialty | Real Duck Distro USA",
    "Authentic {name} | Real Duck Distro Specialty Catalog",
    "Buy {name} | Real Duck Distro Premium Online Shop",
  ],
};

// ── Description components (rotate via different hash bits) ──

const OPENINGS = [
  "Order {name} from Real Duck Distro",
  "Shop authentic {name} at Real Duck Distro",
  "Buy {name} online with Real Duck Distro",
  "Get {name} delivered nationwide from Real Duck Distro",
  "Real Duck Distro stocks authentic {name}",
  "Premium {name} now available at Real Duck Distro",
  "Looking for {name}? Real Duck Distro carries it",
  "Real Duck Distro's {name} ships across the USA",
];

const VALUE_PROPS_BY_CATEGORY: Record<string, string[]> = {
  DISPOSABLES: [
    "with live resin and liquid diamond formulations for tier-3 potency",
    "featuring premium cannabis oil and rich strain-specific terpenes",
    "with rechargeable hardware and lab-tested all-in-one performance",
    "engineered for smooth vapor flow and bold authentic strain flavor",
    "in 2G disposable hardware with adjustable airflow technology",
    "delivering authentic terpene profiles in premium all-in-one pens",
    "with verified extracts, ceramic coils, and consistent dosing",
    "built around live resin oil and high-purity cannabis distillate",
  ],
  FLOWER: [
    "indoor-grown with dense trichome coverage and rich terpene profiles",
    "top-shelf cannabis cultivated to boutique-grade quality standards",
    "premium exotic flower with vibrant colors and intense bag appeal",
    "lab-tested indoor cannabis with verified potency and clean smoke",
    "cured for two-plus weeks to preserve terpenes and slow burn",
    "hand-trimmed indoor flower from California's most respected growers",
    "with heavy frost coverage and gas-forward terpene expression",
    "boutique indoor cannabis matching tier-1 dispensary quality",
  ],
  CONCENTRATES: [
    "with full terpene retention and lab-verified concentrate purity",
    "featuring premium live resin, badder, and sugar-grade extracts",
    "extracted from California flower for authentic terpene flavor",
    "delivering rich terpene profiles in clean concentrate consistency",
    "lab-tested with no residual solvents and verified potency",
    "premium-tier cannabis extract with proper cure and texture",
    "from licensed extractors with consistent batch-to-batch quality",
  ],
  EDIBLES: [
    "with precise THC dosing per piece and lab-tested potency",
    "featuring premium cannabis extract and authentic fruit flavors",
    "crafted with high-quality ingredients and consistent dosing",
    "lab-tested for cannabinoid potency with bold flavor profiles",
    "delivering reliable THC effects with consistent piece-to-piece dosing",
    "featuring nano-emulsified extract for faster, more predictable onset",
    "with full-spectrum cannabis extract and gourmet flavor blends",
  ],
  PREROLLS: [
    "rolled with top-shelf cannabis flower and clean-burning paper",
    "hand-rolled with premium ground flower and infused for extra potency",
    "featuring boutique-grade cannabis and even-burn consistency",
    "rolled fresh with premium indoor flower and sealed for freshness",
    "with infused live diamonds and kief for elevated potency",
    "premium ground flower in clean paper with consistent draw",
  ],
  MUSHROOM: [
    "featuring Amanita Muscaria blend and functional mushroom support",
    "with consistent dosing per piece and verified mushroom extract",
    "blending Amanita with Lion's Mane, Reishi, and Cordyceps for balance",
    "premium mushroom edibles with clean ingredients and bold flavors",
    "lab-verified Amanita extract in flavorful gummy form",
  ],
  PILLS: [
    "verified pharmaceutical-grade with consistent dosing and authentic source",
    "from licensed pharmaceutical manufacturers with batch traceability",
    "lab-verified pharmaceutical product with consistent quality",
    "authenticated pharmaceutical-grade — never pressed, never counterfeit",
    "premium pharmaceutical-grade with verified active ingredient and dose",
  ],
  COKE: [
    "premium product with verified quality and discreet packaging",
    "authenticated premium-grade with consistent quality and trust",
  ],
  TOP_SHELF: [
    "boutique top-shelf cannabis with designer-grade indoor cultivation",
    "premium top-shelf flower from California's elite cultivators",
    "designer indoor cannabis with limited-batch quality control",
    "boutique top-shelf flower with rare-pheno terpene profiles",
    "ultra-premium indoor cannabis with handpicked nug selection",
  ],
  OTHERS: [
    "premium specialty cannabis with verified quality standards",
    "authentic specialty product with consistent quality control",
    "lab-tested specialty cannabis from verified sources",
    "premium curated cannabis specialty with batch verification",
  ],
};

const TRUST_SIGNALS = [
  "Lab-tested for purity, sealed for freshness.",
  "Sourced from verified California suppliers.",
  "Authentic batches only, every order verified.",
  "Discreet packaging with tracked US shipping.",
  "Premium quality with consistent results.",
  "Verified-source product, never counterfeit.",
  "Lab-verified potency, full transparency.",
  "Authenticated supply chain, batch numbers logged.",
];

const CTAS_USA = [
  "Order today for fast US shipping.",
  "Same-day handling from Los Angeles, USA.",
  "Discreet shipping to all 50 states.",
  "Buy online, ships anywhere in the USA.",
  "Fast nationwide delivery from California.",
  "Ships discreetly to FL, TX, NY, CA, and beyond.",
  "Free domestic shipping on qualifying orders.",
  "Coast-to-coast US delivery, tracked and discreet.",
  "Trusted by buyers in CA, FL, TX, NY, IL.",
  "Fast US delivery from Los Angeles HQ.",
];

// ── Generators ──

function generateProductSEO(input: { name: string; slug: string; category: string }): { metaTitle: string; metaDescription: string } {
  const cleaned = cleanTitle(input.name);
  const seed = hashStr(input.slug);

  // Title: pick a template by primary hash, replace name token, truncate at word boundary if needed
  const tmplArr = TITLE_TEMPLATES[input.category] || TITLE_TEMPLATES.OTHERS;
  let title = pickFromArr(tmplArr, seed).replace(/{name}/g, cleaned);
  if (title.length > 70) {
    title = title.slice(0, 68).replace(/\s+\S+$/, "") + "…";
  }

  // Description: 4-component build
  const opening = pickFromArr(OPENINGS, seed >> 3).replace(/{name}/g, cleaned);
  const valueProps = VALUE_PROPS_BY_CATEGORY[input.category] || VALUE_PROPS_BY_CATEGORY.OTHERS;
  const valueProp = pickFromArr(valueProps, seed >> 7);
  const trust = pickFromArr(TRUST_SIGNALS, seed >> 11);
  const cta = pickFromArr(CTAS_USA, seed >> 14);

  let desc = `${opening} ${valueProp}. ${trust} ${cta}`;
  desc = desc.replace(/\s+/g, " ").trim();
  if (desc.length > 162) {
    desc = desc.slice(0, 159).replace(/\s+\S+$/, "") + "…";
  }

  return { metaTitle: title, metaDescription: desc };
}

// ── Blog SEO ──

const BLOG_TITLE_TEMPLATES = [
  "{title} | Real Duck Distro Cannabis Blog",
  "{title} — Cannabis Education from Real Duck Distro",
  "{title} | RDD Cannabis Journal",
  "{title} — Read the Full Guide | Real Duck Distro",
  "{title} | Real Duck Distro Cannabis Insights",
  "{title} — Real Duck Distro Cannabis Education",
];

const BLOG_OPENINGS = [
  "Real Duck Distro's complete guide to",
  "Everything you need to know about",
  "An honest, in-depth look at",
  "The complete 2026 guide to",
  "Read Real Duck Distro's deep-dive on",
];

const BLOG_TRUST = [
  "Educational content from Real Duck Distro, premium cannabis from Los Angeles, USA.",
  "Cannabis education from a trusted Real Duck Distro source.",
  "Practical, honest cannabis writing from Real Duck Distro.",
  "Premium cannabis education — Real Duck Distro, USA-wide.",
];

function generateBlogSEO(input: { title: string; slug: string; excerpt: string | null; existingMetaTitle?: string | null; existingMetaDescription?: string | null }): { metaTitle: string; metaDescription: string } {
  // If the post already has a custom-crafted SEO (long, distinctive), keep it.
  // The 6 hand-written blogs have descriptive, unique meta we don't want to overwrite.
  const isHandCrafted =
    input.existingMetaTitle &&
    input.existingMetaTitle.length >= 45 &&
    !input.existingMetaTitle.endsWith("| Real Duck Distro") &&
    !input.existingMetaTitle.endsWith("Real Duck Distro");
  if (isHandCrafted && input.existingMetaDescription && input.existingMetaDescription.length >= 100) {
    return {
      metaTitle: input.existingMetaTitle!,
      metaDescription: input.existingMetaDescription,
    };
  }

  const seed = hashStr(input.slug);
  const cleanedTitle = cleanTitle(input.title).replace(/\s*\(\d{4}\)\s*/, " ").replace(/\s+/g, " ").trim();

  // Title: pick template, but only append brand if title is short enough
  let title: string;
  if (cleanedTitle.length >= 50) {
    title = cleanedTitle.length > 65 ? cleanedTitle.slice(0, 63).replace(/\s+\S+$/, "") + "…" : cleanedTitle;
  } else {
    const tmpl = pickFromArr(BLOG_TITLE_TEMPLATES, seed);
    title = tmpl.replace(/{title}/g, cleanedTitle);
    if (title.length > 70) title = title.slice(0, 68).replace(/\s+\S+$/, "") + "…";
  }

  // Description: opening + topic + trust signal
  const topic = cleanedTitle.toLowerCase().replace(/[^a-z0-9 ]/g, "");
  const opening = pickFromArr(BLOG_OPENINGS, seed >> 4);
  const trust = pickFromArr(BLOG_TRUST, seed >> 9);
  const sourceContent = input.excerpt && input.excerpt.length > 50
    ? input.excerpt.replace(/\s+/g, " ").trim()
    : `${opening} ${topic}.`;

  let desc = sourceContent.length > 100 ? sourceContent : `${opening} ${topic}. ${trust}`;
  desc = desc.replace(/\s+/g, " ").trim();
  if (desc.length > 162) desc = desc.slice(0, 159).replace(/\s+\S+$/, "") + "…";

  return { metaTitle: title, metaDescription: desc };
}

// ── Main ──

async function main() {
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY RUN"}\n`);

  // Products
  const products = await prisma.product.findMany({
    select: { id: true, slug: true, title: true, category: true, metaTitle: true, metaDescription: true },
  });
  console.log(`=== Products (${products.length}) ===`);
  // Distribution counts to sanity-check variety
  const titleVariants = new Set<string>();
  const descVariants = new Set<string>();
  const updates: { id: string; metaTitle: string; metaDescription: string }[] = [];
  for (const p of products) {
    if (!p.slug) continue;
    const seo = generateProductSEO({ name: p.title, slug: p.slug, category: p.category });
    titleVariants.add(seo.metaTitle.replace(cleanTitle(p.title), "{name}"));
    descVariants.add(seo.metaDescription.replace(cleanTitle(p.title), "{name}").slice(0, 60));
    updates.push({ id: p.id, ...seo });
  }
  console.log(`Distinct title patterns used:       ${titleVariants.size}`);
  console.log(`Distinct description openings used: ${descVariants.size}`);

  // Sample 6
  console.log(`\nSample (6 random):`);
  const sampleIds = new Set<number>();
  while (sampleIds.size < 6) sampleIds.add(Math.floor(Math.random() * updates.length));
  for (const i of sampleIds) {
    const p = products[i];
    const u = updates[i];
    console.log(`\n  [${p.category}] ${p.slug}`);
    console.log(`    OLD title: ${(p.metaTitle ?? "").slice(0, 90)}…`);
    console.log(`    NEW title: ${u.metaTitle}`);
    console.log(`    NEW desc:  ${u.metaDescription}`);
  }

  // Blogs
  const blogs = await prisma.blogPost.findMany({
    select: { id: true, slug: true, title: true, excerpt: true, metaTitle: true, metaDescription: true },
  });
  console.log(`\n=== Blog posts (${blogs.length}) ===`);
  const blogUpdates: { id: string; metaTitle: string; metaDescription: string }[] = [];
  for (const b of blogs) {
    const seo = generateBlogSEO({
      title: b.title, slug: b.slug, excerpt: b.excerpt,
      existingMetaTitle: b.metaTitle, existingMetaDescription: b.metaDescription,
    });
    blogUpdates.push({ id: b.id, ...seo });
  }

  console.log(`\nBlog sample (4):`);
  const blogSample = new Set<number>();
  while (blogSample.size < Math.min(4, blogs.length)) blogSample.add(Math.floor(Math.random() * blogUpdates.length));
  for (const i of blogSample) {
    const b = blogs[i];
    const u = blogUpdates[i];
    console.log(`\n  ${b.slug}`);
    console.log(`    OLD: ${(b.metaTitle ?? "").slice(0, 90)}`);
    console.log(`    NEW: ${u.metaTitle}`);
    console.log(`    DESC: ${u.metaDescription.slice(0, 130)}`);
  }

  if (!APPLY) {
    console.log("\n" + "─".repeat(70));
    console.log("DRY RUN — no changes written. Re-run with --apply.");
    await prisma.$disconnect();
    return;
  }

  console.log("\nApplying…");
  for (const u of updates) {
    await prisma.product.update({ where: { id: u.id }, data: { metaTitle: u.metaTitle, metaDescription: u.metaDescription } });
  }
  for (const u of blogUpdates) {
    await prisma.blogPost.update({ where: { id: u.id }, data: { metaTitle: u.metaTitle, metaDescription: u.metaDescription } });
  }
  console.log(`✓ Updated ${updates.length} products and ${blogUpdates.length} blog posts.`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
