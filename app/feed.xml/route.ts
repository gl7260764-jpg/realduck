/**
 * RSS 2.0 feed at /feed.xml — auto-discoverable by RSS aggregators, news
 * readers, and content-syndication services. Some of these (Feedly, NewsBlur,
 * Inoreader, FeedSpot directories) re-publish your headlines + link back to
 * your site, generating organic backlinks over time.
 *
 * Indexed by Google's RSS crawler in addition to the regular sitemap path.
 */

import prisma from "@/lib/prisma";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.realduckdistro.com";
const FEED_TITLE = "Real Duck Distro — Premium Cannabis Guides & Strain Reviews";
const FEED_DESC = "Cannabis education, strain reviews, and industry guides from Real Duck Distro — premium California indoor cannabis brand with US nationwide discreet shipping.";

export const revalidate = 3600; // hourly

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      slug: true,
      title: true,
      subtitle: true,
      excerpt: true,
      imageUrl: true,
      author: true,
      category: true,
      createdAt: true,
      updatedAt: true,
      metaDescription: true,
    },
  });

  const now = new Date();

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">\n';
  xml += "  <channel>\n";
  xml += `    <title>${xmlEscape(FEED_TITLE)}</title>\n`;
  xml += `    <link>${SITE_URL}</link>\n`;
  xml += `    <description>${xmlEscape(FEED_DESC)}</description>\n`;
  xml += `    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>\n`;
  xml += `    <language>en-us</language>\n`;
  xml += `    <copyright>© ${now.getUTCFullYear()} Real Duck Distro</copyright>\n`;
  xml += `    <lastBuildDate>${now.toUTCString()}</lastBuildDate>\n`;
  xml += `    <generator>Next.js custom RSS feed</generator>\n`;
  xml += `    <ttl>60</ttl>\n`;
  xml += `    <image>\n`;
  xml += `      <url>${SITE_URL}/images/logo.jpg</url>\n`;
  xml += `      <title>${xmlEscape(FEED_TITLE)}</title>\n`;
  xml += `      <link>${SITE_URL}</link>\n`;
  xml += `    </image>\n`;

  for (const post of posts) {
    const postUrl = `${SITE_URL}/blog/${post.slug}`;
    const description = post.metaDescription || post.excerpt || post.subtitle || "";
    xml += "    <item>\n";
    xml += `      <title>${xmlEscape(post.title)}</title>\n`;
    xml += `      <link>${postUrl}</link>\n`;
    xml += `      <guid isPermaLink="true">${postUrl}</guid>\n`;
    xml += `      <pubDate>${post.createdAt.toUTCString()}</pubDate>\n`;
    xml += `      <dc:creator>${xmlEscape(post.author || "Real Duck Distro Editorial Team")}</dc:creator>\n`;
    xml += `      <category>${xmlEscape(post.category)}</category>\n`;
    xml += `      <description>${xmlEscape(description)}</description>\n`;
    if (post.imageUrl) {
      xml += `      <enclosure url="${xmlEscape(post.imageUrl)}" type="image/jpeg"/>\n`;
    }
    xml += "    </item>\n";
  }

  xml += "  </channel>\n";
  xml += "</rss>\n";

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
    },
  });
}
