/**
 * Weekly blog-post generator (cron)
 *
 * Cron-protected endpoint that generates one SEO-optimized blog post per run
 * using Claude Opus 4.7. Picks either:
 *  (a) a product that has never been featured in the blog, or
 *  (b) an evergreen cannabis topic from the rotation.
 *
 * Scheduled via `vercel.json` every Monday at 14:00 UTC.
 *
 * Protected by CRON_SECRET — Vercel Cron sends this as
 *   Authorization: Bearer <CRON_SECRET>
 * so un-auth'd callers can't fire off paid Anthropic calls.
 */

import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { BlogCategory } from "@prisma/client";
import { pingIndexNow } from "@/lib/indexNow";

export const maxDuration = 120; // allow up to 2 minutes (Vercel Pro)

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://realduckdistro.com";

const EVERGREEN_TOPICS: Array<{ topic: string; category: BlogCategory }> = [
  { topic: "How to identify top-shelf indoor flower vs mids", category: "EDUCATION" },
  { topic: "Terpene profiles explained: myrcene, limonene, caryophyllene and what they do", category: "EDUCATION" },
  { topic: "THC vs THCa vs delta-8: what the abbreviations actually mean for you", category: "EDUCATION" },
  { topic: "Live rosin vs live resin: the differences that actually matter", category: "EDUCATION" },
  { topic: "How to store cannabis to keep it fresh for months", category: "HOW_TO" },
  { topic: "Dosing edibles the right way: a beginner-safe guide", category: "HOW_TO" },
  { topic: "How to spot a fake or unregulated vape cartridge", category: "HOW_TO" },
  { topic: "Cleaning your grinder and pipe — a simple 5-minute routine", category: "HOW_TO" },
  { topic: "Why lab-tested cannabis matters: pesticides, heavy metals, and COAs", category: "IMPORTANCE" },
  { topic: "The rise of designer cannabis packs and why consumers care", category: "IMPORTANCE" },
  { topic: "Why indoor-grown beats outdoor for connoisseurs", category: "IMPORTANCE" },
  { topic: "Medical cannabis for sleep: what research actually shows", category: "HEALTH_MEDICINAL" },
  { topic: "Cannabis and pain management: what to know before you try", category: "HEALTH_MEDICINAL" },
  { topic: "Microdosing THC for focus and creativity", category: "HEALTH_MEDICINAL" },
  { topic: "CBD vs THC for anxiety: what the data says", category: "HEALTH_MEDICINAL" },
];

const PRODUCT_CATEGORY_MAP: Record<string, BlogCategory> = {
  FLOWER: "EDUCATION",
  TOP_SHELF: "EDUCATION",
  EDIBLES: "HOW_TO",
  CONCENTRATES: "EDUCATION",
  VAPES: "HOW_TO",
  PREROLLS: "HOW_TO",
  ROSIN: "EDUCATION",
  MUSHROOM: "HEALTH_MEDICINAL",
  DISPOSABLES: "HOW_TO",
  GUMMIES: "HOW_TO",
  PILLS: "HEALTH_MEDICINAL",
  COKE: "EDUCATION",
  OTHERS: "EDUCATION",
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

async function ensureUniqueSlug(base: string): Promise<string> {
  let slug = base;
  let n = 0;
  while (await prisma.blogPost.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${base}-${Date.now().toString(36)}${n}`;
    if (n > 5) break;
  }
  return slug;
}

interface GeneratedPost {
  title: string;
  subtitle: string;
  excerpt: string;
  content_markdown: string;
  tags: string[];
}

async function generatePost(prompt: string, systemPrompt: string): Promise<GeneratedPost> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const client = new Anthropic({ apiKey });

  // Stream long-form output (~1500 words) to avoid HTTP timeouts, then collect
  // the final message. JSON is constrained via output_config.format.
  const stream = client.messages.stream({
    model: "claude-opus-4-7",
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "high",
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            title: { type: "string", description: "SEO-optimized title, 50–70 characters, with the primary keyword near the front" },
            subtitle: { type: "string", description: "One-sentence hook under the title, 100–150 characters" },
            excerpt: { type: "string", description: "Meta description, 140–160 characters, keyword-rich and compelling" },
            content_markdown: { type: "string", description: "Full article body in Markdown, 1200–1800 words, with H2/H3 subheadings, short paragraphs, and natural keyword integration. No title at the top — the title is rendered separately. Include a closing CTA paragraph linking the reader to Real Duck Distro's shop." },
            tags: { type: "array", items: { type: "string" }, minItems: 5, maxItems: 8, description: "SEO tags — lowercase, a mix of broad and long-tail cannabis keywords relevant to the article" },
          },
          required: ["title", "subtitle", "excerpt", "content_markdown", "tags"],
          additionalProperties: false,
        },
      },
    },
    system: systemPrompt,
    messages: [{ role: "user", content: prompt }],
  });

  const message = await stream.finalMessage();

  // Extract JSON from the first text block
  for (const block of message.content) {
    if (block.type === "text") {
      const parsed = JSON.parse(block.text) as GeneratedPost;
      if (!parsed.title || !parsed.content_markdown) {
        throw new Error("Generated post missing required fields");
      }
      return parsed;
    }
  }
  throw new Error("No text block in Claude response");
}

async function pickTopic(): Promise<{
  prompt: string;
  systemPrompt: string;
  category: BlogCategory;
  imageUrl: string | null;
  sourceLabel: string;
}> {
  // Prefer a product that has never been blogged about (by title match in tags).
  const products = await prisma.product.findMany({
    where: { isSoldOut: false },
    orderBy: { createdAt: "desc" },
    take: 60,
    select: { id: true, slug: true, title: true, description: true, category: true, imageUrl: true, rating: true },
  });

  // Pull existing blog tags to avoid duplicates
  const existingPosts = await prisma.blogPost.findMany({
    select: { title: true, tags: true },
    take: 200,
  });
  const featuredTitles = new Set(
    existingPosts.flatMap((p) => [p.title.toLowerCase(), ...p.tags.map((t) => t.toLowerCase())])
  );

  const freshProducts = products.filter((p) => !featuredTitles.has(p.title.toLowerCase()));

  if (freshProducts.length > 0) {
    const p = freshProducts[Math.floor(Math.random() * freshProducts.length)];
    const cat = PRODUCT_CATEGORY_MAP[p.category] || "EDUCATION";
    return {
      category: cat,
      imageUrl: p.imageUrl,
      sourceLabel: `product:${p.title}`,
      systemPrompt:
        "You are a senior cannabis journalist writing for Real Duck Distro, a premium cannabis lifestyle brand with HQ in Los Angeles and Sydney, with priority delivery to Kentucky, Michigan, Florida and Mississippi. " +
        "Tone: informed, confident, friendly — never hypey, never medical-advice-y. Write the way a knowledgeable budtender explains things to a curious customer. " +
        "Audience: US adults aged 21+ shopping online for premium cannabis — with particular relevance for customers in Kentucky, Michigan, Florida, and Mississippi, plus Australia. " +
        "Style: short paragraphs (2–4 sentences each), skimmable H2/H3 headings, one specific actionable takeaway per section, no AI fluff. " +
        "SEO: weave the primary product/keyword naturally into the title, first paragraph, and at least one H2. Where it reads naturally, mention regional shipping availability (KY/MI/FL/MS or Australia) once — don't keyword-stuff. " +
        "End every article with a short CTA paragraph that invites the reader to explore Real Duck Distro's catalog at " + SITE_URL + ". " +
        "Do not invent specific health claims. Cite general principles (terpene effects, indoor-grown quality, lab-testing) only when well-established.",
      prompt:
        `Write a detailed 1400-word product spotlight & buying guide blog post for this item:\n\n` +
        `Product: ${p.title}\n` +
        `Category: ${p.category}\n` +
        `Rating: ${p.rating}\n` +
        (p.description ? `Description: ${p.description}\n` : "") +
        `Product URL: ${SITE_URL}/product/${p.slug || p.id}\n\n` +
        `The article should:\n` +
        `- Open with a hook that establishes why this product stands out in its category\n` +
        `- Include an H2 section on the product's likely terpene/flavor profile or effects (inferred from the name/category — no fabricated lab data)\n` +
        `- Include an H2 section on who this product is best for (new users, connoisseurs, evening wind-down, etc.)\n` +
        `- Include an H2 section on how to get the most out of it (storage, dosing, pairing, session tips — whatever fits the category)\n` +
        `- Include an H2 comparison or "what else to try" section linking to 1–2 adjacent categories in the Real Duck Distro catalog\n` +
        `- End with a CTA to shop this product or similar at Real Duck Distro.\n\n` +
        `Return as JSON matching the required schema. Target 1200–1800 words in content_markdown.`,
    };
  }

  // Fall back to evergreen topic rotation
  const existingTitles = new Set(existingPosts.map((p) => p.title.toLowerCase()));
  const fresh = EVERGREEN_TOPICS.filter((t) => !existingTitles.has(t.topic.toLowerCase()));
  const pool = fresh.length > 0 ? fresh : EVERGREEN_TOPICS;
  const pick = pool[Math.floor(Math.random() * pool.length)];

  return {
    category: pick.category,
    imageUrl: null,
    sourceLabel: `evergreen:${pick.topic}`,
    systemPrompt:
      "You are a senior cannabis journalist writing for Real Duck Distro, a premium cannabis lifestyle brand with HQ in Los Angeles and Sydney, with priority delivery to Kentucky, Michigan, Florida and Mississippi. " +
      "Tone: informed, confident, friendly — never hypey, never medical-advice-y. " +
      "Audience: US adults aged 21+ interested in cannabis education and buying online — with particular relevance for customers in Kentucky, Michigan, Florida, and Mississippi, plus Australia. " +
      "Style: short paragraphs (2–4 sentences), skimmable H2/H3 headings, one actionable takeaway per section. No AI fluff. " +
      "SEO: weave the primary keyword from the topic naturally into the title, first paragraph, and at least one H2. Where it reads naturally, mention regional shipping availability once — don't keyword-stuff. " +
      "End every article with a short CTA paragraph pointing the reader to Real Duck Distro's catalog at " + SITE_URL + ". " +
      "Do not invent specific health claims or dose numbers you can't stand behind.",
    prompt:
      `Write a detailed 1400-word educational cannabis blog post on this topic: "${pick.topic}".\n\n` +
      `The article should:\n` +
      `- Open with a hook that establishes why this topic matters to the reader right now\n` +
      `- Be structured with clear H2 sections and H3 sub-sections where helpful\n` +
      `- Include at least one "Quick takeaway" or numbered-list section readers can skim\n` +
      `- Include a section addressing common misconceptions\n` +
      `- End with a CTA that connects the topic back to shopping at Real Duck Distro.\n\n` +
      `Return as JSON matching the required schema. Target 1200–1800 words in content_markdown.`,
  };
}

async function authorized(request: NextRequest): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // dev: no secret configured → allow (same pattern as /api/announcements/process)
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}

async function handle(request: NextRequest) {
  if (!(await authorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const topic = await pickTopic();
    console.log(`[blog-gen] Generating post for ${topic.sourceLabel}`);

    const post = await generatePost(topic.prompt, topic.systemPrompt);
    const slug = await ensureUniqueSlug(slugify(post.title));

    const saved = await prisma.blogPost.create({
      data: {
        slug,
        title: post.title.slice(0, 200),
        subtitle: post.subtitle?.slice(0, 300) || null,
        category: topic.category,
        content: post.content_markdown,
        excerpt: post.excerpt.slice(0, 300),
        imageUrl: topic.imageUrl || "/images/hero.webp?v=2",
        images: [],
        author: "Real Duck Distro",
        published: true,
        featured: false,
        tags: (post.tags || []).map((t) => t.toLowerCase().slice(0, 40)).slice(0, 8),
      },
    });

    pingIndexNow([
      `${SITE_URL}/blog/${saved.slug}`,
      `${SITE_URL}/blog`,
      `${SITE_URL}/sitemap.xml`,
    ]).catch(() => {});

    console.log(`[blog-gen] Published: ${saved.slug}`);
    return NextResponse.json({
      ok: true,
      id: saved.id,
      slug: saved.slug,
      title: saved.title,
      category: saved.category,
      wordCount: saved.content.split(/\s+/).length,
      source: topic.sourceLabel,
      url: `${SITE_URL}/blog/${saved.slug}`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[blog-gen] Failed:", message);
    if (err instanceof Anthropic.APIError) {
      console.error("[blog-gen] Anthropic status:", err.status);
    }
    return NextResponse.json({ error: "Blog generation failed", detail: message }, { status: 500 });
  }
}
