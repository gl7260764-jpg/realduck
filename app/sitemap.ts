import { MetadataRoute } from "next";
import prisma from "@/lib/prisma";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://realduckdistro.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Get all products for dynamic routes
  const products = await prisma.product.findMany({
    select: { id: true, slug: true, updatedAt: true, category: true },
    orderBy: { updatedAt: "desc" },
  });

  // Get unique categories
  const categories = [...new Set(products.map((p) => p.category))];

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
  ];

  // Category pages (filter URLs) with keyword-rich alternates
  const categoryNames: Record<string, string> = {
    FLOWER: "exotic-flower",
    EDIBLES: "edibles",
    CONCENTRATES: "concentrates",
    VAPES: "vapes",
    PREROLLS: "pre-rolls",
    ROSIN: "rosin",
    MUSHROOM: "mushrooms",
    DISPOSABLES: "disposables",
    GUMMIES: "gummies",
    OTHERS: "others",
  };

  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${SITE_URL}/?category=${category}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  // Product pages — use SEO-friendly slug when available
  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${SITE_URL}/product/${product.slug || product.id}`,
    lastModified: product.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Blog pages
  const blogPosts = await prisma.blogPost.findMany({
    where: { published: true },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  const blogPages: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
    ...blogPosts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];

  return [...staticPages, ...categoryPages, ...productPages, ...blogPages];
}
