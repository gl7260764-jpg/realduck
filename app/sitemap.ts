import { MetadataRoute } from "next";
import prisma from "@/lib/prisma";
import { PRODUCT_FAQS } from "@/lib/productFAQs";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.realduckdistro.com";

/**
 * Sitemap — built dynamically from the DB.
 *
 * Priorities are tiered (not uniform) so Google can identify the most
 * important pages at a glance:
 *
 *   1.0   Homepage
 *   0.95  Priority products (those with curated FAQ data — top SEO targets)
 *   0.9   Blog index, category pages
 *   0.85  Featured blog posts
 *   0.8   Standard products
 *   0.75  Standard blog posts
 *   0.65  Blog category filters
 *   0.6   Announcements / sold-out products
 *   0.3   Utility pages
 *
 * Every product/blog entry includes image-sitemap entries so they appear
 * in Google Images search. Deleted-slug URLs are implicitly excluded
 * because their rows no longer exist in the DB.
 */

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const [products, blogPosts, announcements] = await Promise.all([
    prisma.product.findMany({
      select: {
        id: true, slug: true, title: true, imageUrl: true, images: true,
        updatedAt: true, category: true, isSoldOut: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.blogPost.findMany({
      where: { published: true },
      select: { slug: true, title: true, imageUrl: true, images: true, updatedAt: true, category: true, featured: true },
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

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/announcements`, lastModified: now, changeFrequency: "daily", priority: 0.6 },
    { url: `${SITE_URL}/orders`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  const categoryPages: MetadataRoute.Sitemap = productCategories.map((category) => ({
    url: `${SITE_URL}/?category=${category}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.9,
  }));

  const blogCategoryPages: MetadataRoute.Sitemap = blogCategories.map((cat) => ({
    url: `${SITE_URL}/blog?category=${cat}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.65,
  }));

  // Priority products = those with curated FAQ data (top SEO targets).
  const priorityProductSlugs = new Set(Object.keys(PRODUCT_FAQS));
  const productPages: MetadataRoute.Sitemap = products.map((product) => {
    const slug = product.slug || product.id;
    const isPriority = product.slug ? priorityProductSlugs.has(product.slug) : false;
    return {
      url: `${SITE_URL}/product/${slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly",
      priority: isPriority ? 0.95 : product.isSoldOut ? 0.6 : 0.8,
      images: [product.imageUrl, ...(product.images || [])].filter(Boolean) as string[],
    };
  });

  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "weekly",
    priority: post.featured ? 0.85 : 0.75,
    images: [post.imageUrl, ...(post.images || [])].filter(Boolean) as string[],
  }));

  const announcementPages: MetadataRoute.Sitemap = announcements.map((a) => ({
    url: `${SITE_URL}/announcements?id=${a.id}`,
    lastModified: a.updatedAt,
    changeFrequency: "monthly",
    priority: 0.5,
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
