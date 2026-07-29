// CRAFTED By W1C3
// SEO/AEO content for category landing pages (/category/[slug]).
// Each entry drives a real, indexable, buyer-intent page: unique <title>,
// meta description, H1, a 40–60 word "answer block" (optimised for Google AI
// Overviews / ChatGPT / Perplexity extraction), supporting copy, and an FAQ
// set rendered both visibly and as FAQPage JSON-LD.
//
// Slugs are the public URL segment; `category` maps to the Prisma enum used to
// query products. Categories without an authored entry fall back to a generic
// template so every real category still gets a valid page.

import type { Category } from "@/lib/categoryVisibility";

export interface CategoryFAQ {
  question: string;
  answer: string;
}

export interface CategoryContent {
  slug: string;
  category: Category;
  label: string; // short display name, e.g. "Exotic Flower"
  metaTitle: string;
  metaDescription: string;
  h1: string;
  // 40–60 word direct answer — the passage AI engines lift into answers.
  answer: string;
  // 1–2 supporting paragraphs of E-E-A-T copy (trust, sourcing, shipping).
  body: string[];
  faqs: CategoryFAQ[];
}

// Common trust/shipping clause reused across answers so every category page
// carries the brand's core buying signals for AEO extraction.
const SHIP = "Every order is lab-tested with COAs on request and ships discreetly (smell-proof, vacuum-sealed) across the USA, Australia and worldwide — 1–3 day priority delivery to Kentucky, Michigan, Florida and Mississippi.";

export const CATEGORY_CONTENT: Record<string, CategoryContent> = {
  flower: {
    slug: "flower",
    category: "FLOWER",
    label: "Exotic Flower",
    metaTitle: "Buy Exotic Cannabis Flower Online | Top-Shelf Indoor Strains — Real Duck Distro",
    metaDescription:
      "Buy exotic indoor cannabis flower online at Real Duck Distro. Top-shelf designer strains and gas packs, lab-tested with COAs, discreet 1–3 day shipping across the USA, Australia & worldwide.",
    h1: "Buy Exotic Cannabis Flower Online",
    answer:
      "Real Duck Distro sells exotic, top-shelf indoor cannabis flower — designer strains and gas packs graded for aroma, density and potency. " + SHIP,
    body: [
      "Our flower is indoor-grown by trusted US and Australian cultivators and hand-selected for terpene profile, trichome coverage and cure quality. Each drop is graded on our internal 10-point scale, so what you see rated 10/10 is genuine top-shelf, not filler.",
      "From candy-gas hybrids to loud OG cuts, every strain is photographed as it ships and backed by lab testing for potency and contaminants (pesticides, heavy metals, residual solvents). Prices cover both local pickup and discreet nationwide delivery.",
    ],
    faqs: [
      { question: "Is Real Duck Distro flower lab-tested?", answer: "Yes. All flower is sourced from licensed growers and lab-tested for potency and contaminants (pesticides, heavy metals, residual solvents). Certificates of Analysis (COAs) are available on request." },
      { question: "How is the cannabis flower shipped?", answer: "Flower ships in smell-proof, vacuum-sealed, plain-labelled packaging with a neutral return address. Most US orders arrive in 1–3 business days, with priority delivery to Kentucky, Michigan, Florida and Mississippi." },
      { question: "What does 'exotic' or 'top-shelf' flower mean here?", answer: "Exotic/top-shelf refers to indoor-grown, high-terpene designer strains with dense structure and strong potency — the upper tier of quality versus mid-grade or outdoor flower. We grade each strain on a 10-point scale." },
      { question: "Do you ship flower to my state?", answer: "We deliver across the entire USA and Australia plus worldwide, with priority routes to Kentucky, Michigan, Florida and Mississippi. Packaging is discreet on every route." },
    ],
  },

  "top-shelf": {
    slug: "top-shelf",
    category: "TOP_SHELF",
    label: "Top-Shelf",
    metaTitle: "Top-Shelf Indoor Cannabis Online | Premium Exotic Strains — Real Duck Distro",
    metaDescription:
      "Shop top-shelf indoor cannabis online at Real Duck Distro — the highest-grade exotic strains, lab-tested with COAs, discreetly shipped across the USA, Australia & worldwide.",
    h1: "Top-Shelf Indoor Cannabis Online",
    answer:
      "Top-shelf at Real Duck Distro means the highest-grade indoor exotics we carry — peak terpene, potency and bag appeal. " + SHIP,
    body: [
      "This is the premium tier: limited designer cuts and connoisseur strains reserved for customers who want the best in the drop. Each is indoor-grown, hand-trimmed and graded at the top of our 10-point scale.",
      "Every top-shelf strain is lab-tested and photographed as it ships, so you know exactly what you're buying. Discreet, tracked delivery is included on every order.",
    ],
    faqs: [
      { question: "What makes a strain 'top-shelf'?", answer: "Top-shelf strains score at the top of our 10-point grading scale for terpene intensity, potency, density and cure — indoor-grown designer genetics, not mid-grade or bulk flower." },
      { question: "Is top-shelf flower more expensive?", answer: "Top-shelf commands a premium because it's limited, hand-selected indoor product. Pricing is shown per strain and covers discreet, tracked shipping across the USA, Australia and worldwide." },
      { question: "Is it lab-tested?", answer: "Yes — every top-shelf strain is lab-tested for potency and contaminants, with COAs available on request." },
    ],
  },

  edibles: {
    slug: "edibles",
    category: "EDIBLES",
    label: "Edibles",
    metaTitle: "Buy Cannabis Edibles & THC Gummies Online | Lab-Tested — Real Duck Distro",
    metaDescription:
      "Buy lab-tested cannabis edibles and THC gummies online at Real Duck Distro. Accurately dosed, discreetly shipped across the USA, Australia & worldwide with COAs on request.",
    h1: "Buy Cannabis Edibles & THC Gummies Online",
    answer:
      "Real Duck Distro stocks lab-tested cannabis edibles and THC gummies with accurate, labelled dosing per piece. " + SHIP,
    body: [
      "Our edibles range covers fruit gummies, chocolates and infused treats from trusted brands, each with clearly stated THC content so you can dose predictably. Every batch is lab-tested for potency and purity.",
      "New to edibles? Start low (5–10 mg) and wait 60–90 minutes before taking more — effects onset slower than smoking but last longer. All edibles ship discreetly and arrive fresh.",
    ],
    faqs: [
      { question: "How much THC is in each edible?", answer: "Dosing is printed on every product page and package — typically 5–10 mg THC per piece for gummies, with higher-dose options clearly labelled. Lab tests confirm the stated potency." },
      { question: "How long do THC edibles take to kick in?", answer: "Edibles onset in about 60–90 minutes and last several hours. Start with 5–10 mg, wait at least 90 minutes, then adjust — never redose early." },
      { question: "Are the edibles lab-tested?", answer: "Yes. Every edible is lab-tested for potency and contaminants, with Certificates of Analysis available on request." },
      { question: "Do edibles ship discreetly?", answer: "Yes — all edibles ship in plain, smell-proof packaging with neutral labelling, across the USA, Australia and worldwide." },
    ],
  },

  concentrates: {
    slug: "concentrates",
    category: "CONCENTRATES",
    label: "Concentrates",
    metaTitle: "Buy Cannabis Concentrates Online | Live Rosin, Wax, Shatter — Real Duck Distro",
    metaDescription:
      "Buy cannabis concentrates online at Real Duck Distro — live rosin, badder, wax, shatter and live resin. Lab-tested, solventless options, discreet worldwide shipping.",
    h1: "Buy Cannabis Concentrates Online",
    answer:
      "Real Duck Distro sells premium cannabis concentrates — live rosin, badder, wax, shatter and live resin — including solventless options. " + SHIP,
    body: [
      "Concentrates deliver the highest potency and fullest terpene expression of any cannabis format. We carry solventless live rosin (pressed from ice-water hash) alongside hydrocarbon extracts, each lab-tested for potency and residual solvents.",
      "Every jar is graded for colour, consistency and terp profile and ships cold-stable and discreet. COAs are available on request.",
    ],
    faqs: [
      { question: "What's the difference between rosin and resin?", answer: "Live rosin is solventless — pressed from ice-water hash using heat and pressure. Live resin uses a hydrocarbon solvent (later purged). Both are lab-tested; rosin is prized for purity, resin for yield and terpene punch." },
      { question: "Are your concentrates solventless?", answer: "We carry both. Solventless live rosin is clearly labelled; hydrocarbon extracts (wax, shatter, live resin) are lab-tested for residual solvents to confirm they're within safe limits." },
      { question: "How should I store concentrates?", answer: "Keep concentrates cool and dark, ideally refrigerated in an airtight container, to preserve potency and terpenes. They ship cold-stable and discreet." },
    ],
  },

  "pre-rolls": {
    slug: "pre-rolls",
    category: "PREROLLS",
    label: "Pre-Rolls",
    metaTitle: "Buy Pre-Rolls & Infused Joints Online | Cannabis Pre-Rolls — Real Duck Distro",
    metaDescription:
      "Buy cannabis pre-rolls and infused joints online at Real Duck Distro. Fresh-rolled top-shelf flower, lab-tested, discreetly shipped across the USA, Australia & worldwide.",
    h1: "Buy Cannabis Pre-Rolls & Infused Joints Online",
    answer:
      "Real Duck Distro offers ready-to-smoke cannabis pre-rolls and infused joints rolled from top-shelf flower. " + SHIP,
    body: [
      "Our pre-rolls are packed with the same graded indoor flower we sell by weight — no shake or trim filler. Infused options add concentrate or kief for extra potency.",
      "Each pre-roll is fresh, sealed for aroma retention and lab-tested at the flower level. Discreet delivery is included on every order.",
    ],
    faqs: [
      { question: "What's in your pre-rolls?", answer: "Our pre-rolls use graded top-shelf indoor flower — never shake or trim filler. Infused pre-rolls add concentrate and/or kief for higher potency, clearly labelled per product." },
      { question: "Are infused pre-rolls stronger?", answer: "Yes. Infused pre-rolls are coated or blended with concentrate/kief, raising total THC well above a standard flower joint. Start slow if you're new to infused products." },
      { question: "Are pre-rolls lab-tested?", answer: "Yes — the flower used is lab-tested for potency and contaminants, with COAs available on request." },
    ],
  },

  mushrooms: {
    slug: "mushrooms",
    category: "MUSHROOM",
    label: "Mushrooms",
    metaTitle: "Buy Magic Mushroom Products Online | Psilocybin Gummies — Real Duck Distro",
    metaDescription:
      "Buy magic mushroom products online at Real Duck Distro — psilocybin gummies and edibles, accurately dosed, discreetly shipped across the USA, Australia & worldwide.",
    h1: "Buy Magic Mushroom Products Online",
    answer:
      "Real Duck Distro carries magic mushroom products, including psilocybin gummies and edibles, with clearly labelled dosing. " + SHIP,
    body: [
      "Our mushroom range focuses on consistent, measured products so you can dose deliberately rather than guessing. Each product page states the potency per piece.",
      "New users should start low and be mindful of set and setting. All mushroom products ship discreetly and are sealed for freshness.",
    ],
    faqs: [
      { question: "How are magic mushroom products dosed?", answer: "Dosing is stated on each product page and package — measured per gummy or piece so you can dose deliberately. Start low, especially if you're new." },
      { question: "Do mushroom products ship discreetly?", answer: "Yes — all mushroom products ship in plain, smell-proof, sealed packaging across the USA, Australia and worldwide." },
      { question: "What should first-time users know?", answer: "Start with the lowest labelled dose, be mindful of set and setting, and wait — effects build over 30–60 minutes. Never redose early." },
    ],
  },

  disposables: {
    slug: "disposables",
    category: "DISPOSABLES",
    label: "Vapes & Disposables",
    metaTitle: "Buy THC Vapes & Disposables Online | Vape Carts — Real Duck Distro",
    metaDescription:
      "Buy THC vapes and disposables online at Real Duck Distro — all-in-one rechargeable disposables and vape cartridges, lab-tested, discreetly shipped across the USA, Australia & worldwide.",
    h1: "Buy THC Vapes & Disposables Online",
    answer:
      "Real Duck Distro sells THC vapes and disposables — all-in-one rechargeable devices and vape cartridges filled with lab-tested oil. " + SHIP,
    body: [
      "Our disposables come pre-charged and ready to use, with authentic hardware from recognised brands — no clones. Each device states strain, oil type and potency.",
      "All vape oil is lab-tested for potency and contaminants. Bulk pricing applies to disposables (minimum order quantities noted at checkout), and everything ships discreet and sealed.",
    ],
    faqs: [
      { question: "Are your vapes authentic?", answer: "Yes. We stock authentic hardware from recognised brands — not clones — with lab-tested oil. Strain, oil type and potency are stated on every product." },
      { question: "Is there a minimum order for disposables?", answer: "Disposables carry a minimum order quantity (shown at checkout — typically bulk units). This keeps pricing wholesale-competitive. Other categories have no unit minimum." },
      { question: "Is the vape oil lab-tested?", answer: "Yes — all vape oil is lab-tested for potency and contaminants (pesticides, heavy metals, residual solvents), with COAs available on request." },
    ],
  },
};

// Enum → slug for building internal links (breadcrumbs, product pages, sitemap).
export const CATEGORY_SLUG_BY_ENUM: Record<string, string> = Object.values(
  CATEGORY_CONTENT,
).reduce((acc, c) => {
  acc[c.category] = c.slug;
  return acc;
}, {} as Record<string, string>);

export function getCategoryContentBySlug(slug: string): CategoryContent | null {
  return CATEGORY_CONTENT[slug] ?? null;
}

export function getCategorySlug(category: string): string | null {
  return CATEGORY_SLUG_BY_ENUM[category] ?? null;
}

export const ALL_CATEGORY_SLUGS = Object.keys(CATEGORY_CONTENT);
