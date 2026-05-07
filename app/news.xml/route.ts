/**
 * Google News sitemap — published at /news.xml.
 *
 * Lists recent (last 2 days) blog posts using Google News sitemap format.
 * Submit this URL in Google News Publisher Center to fast-track indexing
 * of editorial content. Only posts with `published: true` are listed.
 *
 * Spec: https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap
 */

import prisma from "@/lib/prisma";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.realduckdistro.com";
const PUBLICATION_NAME = "Real Duck Distro";
const LANGUAGE = "en";

export const revalidate = 600; // 10 min — news sitemap should refresh frequently

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  // Google News only accepts URLs published within the last 2 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 2);

  const posts = await prisma.blogPost.findMany({
    where: { published: true, createdAt: { gte: cutoff } },
    orderBy: { createdAt: "desc" },
    take: 1000,
    select: { slug: true, title: true, createdAt: true, tags: true },
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${posts
  .map((post) => {
    const url = `${SITE_URL}/blog/${post.slug}`;
    const pubDate = post.createdAt.toISOString();
    const keywords = (post.tags || []).slice(0, 8).join(", ");
    return `  <url>
    <loc>${escapeXml(url)}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(PUBLICATION_NAME)}</news:name>
        <news:language>${LANGUAGE}</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${escapeXml(post.title)}</news:title>
      ${keywords ? `<news:keywords>${escapeXml(keywords)}</news:keywords>` : ""}
    </news:news>
  </url>`;
  })
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=86400",
    },
  });
}
