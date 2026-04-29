import { MetadataRoute } from "next";
import prisma from "@/lib/prisma";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.realduckdistro.com";

/**
 * Sitemap — built dynamically from the DB.
 *
 * Emits:
 *  - All indexable static pages
 *  - Every product (slug-preferred URL)
 *  - Every category filter URL (slugified)
 *  - All published blog posts + the blog index
 *  - All published announcements + the announcements index
 *
 * Google's Next.js sitemap output includes the `images` field at
 * MetadataRoute.Sitemap v14+, which surfaces each item in Google Images.
 *
 * We keep this under 50k URLs and 50 MB — safe headroom for future growth.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // ── Parallelise DB reads
  const [products, blogPosts, announcements] = await Promise.all([
    prisma.product.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        imageUrl: true,
        images: true,
        updatedAt: true,
        category: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.blogPost.findMany({
      where: { published: true },
      select: { slug: true, title: true, imageUrl: true, images: true, updatedAt: true, category: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.announcement.findMany({
      where: { published: true },
      select: { id: true, title: true, imageUrl: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const productCategories = [...new Set(products.map((p) => p.category))];
  const blogCategories = [...new Set(blogPosts.map((p) => p.category))];

  // ── Static pages (crawlable, public)
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/announcements`, lastModified: now, changeFrequency: "daily", priority: 0.85 },
    { url: `${SITE_URL}/orders`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  // ── Product category filters (keyword-rich URLs)
  const categoryPages: MetadataRoute.Sitemap = productCategories.map((category) => ({
    url: `${SITE_URL}/?category=${category}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.9,
  }));

  // ── Blog category filters
  const blogCategoryPages: MetadataRoute.Sitemap = blogCategories.map((cat) => ({
    url: `${SITE_URL}/blog?category=${cat}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.65,
  }));

  // ── Product pages (one per product, slug-preferred, with image sitemap entries)
  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${SITE_URL}/product/${product.slug || product.id}`,
    lastModified: product.updatedAt,
    changeFrequency: "weekly",
    priority: 0.85,
    images: [product.imageUrl, ...(product.images || [])].filter(Boolean) as string[],
  }));

  // ── Blog post pages
  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "weekly",
    priority: 0.75,
    images: [post.imageUrl, ...(post.images || [])].filter(Boolean) as string[],
  }));

  // ── Announcement permalinks (deep-linked via /announcements?id=…)
  const announcementPages: MetadataRoute.Sitemap = announcements.map((a) => ({
    url: `${SITE_URL}/announcements?id=${a.id}`,
    lastModified: a.updatedAt,
    changeFrequency: "monthly",
    priority: 0.6,
    images: a.imageUrl ? [a.imageUrl] : undefined,
  }));

  return [
    ...staticPages,
    ...categoryPages,
    ...blogCategoryPages,
    ...productPages,
    ...blogPages,
    ...announcementPages,
  ];
}
