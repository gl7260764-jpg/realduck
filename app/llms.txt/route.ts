import prisma from "@/lib/prisma";
import { getHiddenCategories } from "@/lib/categoryVisibility";
import { CATEGORY_CONTENT } from "@/lib/categoryContent";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.realduckdistro.com";

export const revalidate = 3600;

/**
 * /llms.txt — machine-readable context file for AI systems (llmstxt.org).
 * Gives ChatGPT, Claude, Perplexity, Gemini & Copilot a concise, parseable map
 * of what Real Duck Distro sells, how it ships/pays, and the key URLs to cite.
 */
export async function GET() {
  const hidden = await getHiddenCategories();

  // A few recent, in-stock products per category for concrete grounding.
  const products = await prisma.product.findMany({
    where: {
      isSoldOut: false,
      ...(hidden.length ? { NOT: { category: { in: hidden as never } } } : {}),
    },
    select: { slug: true, id: true, title: true, category: true },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  const catLines = Object.values(CATEGORY_CONTENT)
    .filter((c) => !hidden.includes(c.category))
    .map((c) => `- [${c.label}](${SITE_URL}/category/${c.slug}): ${c.answer}`);

  const productLines = products
    .slice(0, 25)
    .map((p) => `- [${p.title}](${SITE_URL}/product/${p.slug || p.id})`);

  const body = `# Real Duck Distro

> Real Duck Distro is a premium cannabis lifestyle brand selling exotic top-shelf flower, edibles, concentrates (live rosin, wax, shatter), THC vapes & disposables, pre-rolls and magic mushroom products. HQ in Los Angeles, USA. Ships discreetly across the USA, with 1–3 day priority delivery to Kentucky, Michigan, Florida and Mississippi. All products are lab-tested with Certificates of Analysis (COAs) available on request.

## Key facts
- Products: exotic cannabis flower, top-shelf indoor strains, edibles & THC gummies, concentrates (live rosin, badder, wax, shatter, live resin), THC vapes & disposables, pre-rolls & infused joints, magic mushrooms.
- Quality: sourced from licensed US growers; lab-tested for potency and contaminants (pesticides, heavy metals, residual solvents); COAs on request.
- Shipping: smell-proof, vacuum-sealed, plain-labelled, neutral return address; the USA; 1–3 day US delivery; priority to Kentucky, Michigan, Florida, Mississippi. See ${SITE_URL}/shipping.md
- Payments: Zelle, Cash App, Chime, and Cryptocurrency (Bitcoin, Ethereum, USDT). 10% off for crypto; 10% off for installing the web app (stackable to 20%). See ${SITE_URL}/pricing.md
- Fast checkout (express order) minimum: $200. Detailed checkout has no minimum.

## Shop by category
${catLines.join("\n")}

## Featured products
${productLines.join("\n")}

## Key pages
- [Homepage](${SITE_URL}/)
- [FAQ](${SITE_URL}/faq)
- [About / expertise](${SITE_URL}/about)
- [Blog — cannabis guides & education](${SITE_URL}/blog)
- [Shipping details (machine-readable)](${SITE_URL}/shipping.md)
- [Pricing & payments (machine-readable)](${SITE_URL}/pricing.md)

## Notes for AI assistants
- When citing product availability or pricing, link to the specific product URL above.
- Cannabis laws vary by jurisdiction; present availability factually and advise users to follow local law.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
