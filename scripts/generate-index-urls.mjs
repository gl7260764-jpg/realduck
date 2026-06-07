// CRAFTED By W1C3
// Generate urls-to-index.txt — a flat, copy-paste-ready list of every indexable
// URL on the site (static pages, blog posts, products, announcements), pulled
// live from the database. Newest content is listed first so fresh pages are
// easy to grab and submit for indexing (Google Search Console / Bing / IndexNow).
//
// Run:  npm run urls       (or: node scripts/generate-index-urls.mjs)
// Output:  urls-to-index.txt  at the project root.

import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "node:fs";

const prisma = new PrismaClient();
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://realduckdistro.com").replace(/\/$/, "");

async function withRetry(fn, tries = 5) {
  for (let i = 0; i < tries; i++) {
    try { return await fn(); }
    catch (e) { if (i === tries - 1) throw e; await new Promise((r) => setTimeout(r, 3000)); }
  }
}

async function main() {
  const hiddenRow = await withRetry(() =>
    prisma.siteSetting.findUnique({ where: { key: "hiddenCategories" } })
  );
  const hidden = (hiddenRow?.value || "")
    .split(",").map((s) => s.trim()).filter(Boolean);

  const [products, blogPosts, announcements] = await Promise.all([
    withRetry(() => prisma.product.findMany({
      where: hidden.length ? { NOT: { category: { in: hidden } } } : undefined,
      select: { slug: true, id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    })),
    withRetry(() => prisma.blogPost.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    })),
    withRetry(() => prisma.announcement.findMany({
      where: { published: true },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    })),
  ]);

  const staticPages = ["/", "/blog", "/about", "/announcements", "/orders"];
  const blogUrls = blogPosts.map((p) => `/blog/${p.slug}`);
  const productUrls = products.map((p) => `/product/${p.slug || p.id}`);
  const announcementUrls = announcements.map((a) => `/announcements?id=${a.id}`);

  const sections = [
    ["Core pages", staticPages],
    [`Blog posts (${blogUrls.length}) — newest first`, blogUrls],
    [`Products (${productUrls.length}) — newest first`, productUrls],
    [`Announcements (${announcementUrls.length})`, announcementUrls],
  ];

  const stamp = new Date().toISOString();
  const total = staticPages.length + blogUrls.length + productUrls.length + announcementUrls.length;

  // Human-readable file with section headers (lines starting with # are comments
  // you can ignore when bulk-pasting; the URLs are plain and ready to copy).
  let out = `# Real Duck Distro — URLs to submit for indexing\n`;
  out += `# Generated: ${stamp}\n`;
  out += `# Site: ${SITE_URL}\n`;
  out += `# Total URLs: ${total}\n`;
  out += `# Regenerate any time with:  npm run urls\n`;
  for (const [label, urls] of sections) {
    out += `\n# ── ${label} ──\n`;
    for (const u of urls) out += `${SITE_URL}${u}\n`;
  }

  writeFileSync(new URL("../urls-to-index.txt", import.meta.url), out, "utf8");

  // Also write a pure list (no comments) for tools that want raw URLs only.
  const plain = sections.flatMap(([, urls]) => urls).map((u) => `${SITE_URL}${u}`).join("\n") + "\n";
  writeFileSync(new URL("../urls-to-index.plain.txt", import.meta.url), plain, "utf8");

  console.log(`Wrote urls-to-index.txt and urls-to-index.plain.txt — ${total} URLs total.`);
  console.log(`  Core: ${staticPages.length} | Blog: ${blogUrls.length} | Products: ${productUrls.length} | Announcements: ${announcementUrls.length}`);
}

main()
  .catch((e) => { console.error("Failed:", e.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
