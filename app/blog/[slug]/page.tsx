import { Metadata } from "next";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import BlogPostClient from "./BlogPostClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://realduckdistro.com";

export const revalidate = 600;

async function getPost(slug: string) {
  try {
    return await prisma.blogPost.findUnique({
      where: { slug, published: true },
    });
  } catch {
    return null;
  }
}

async function getRelatedPosts(category: string, currentId: string) {
  try {
    return await prisma.blogPost.findMany({
      where: { category: category as "EDUCATION" | "HOW_TO" | "IMPORTANCE" | "HEALTH_MEDICINAL", published: true, id: { not: currentId } },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: {
        id: true,
        slug: true,
        title: true,
        subtitle: true,
        category: true,
        excerpt: true,
        imageUrl: true,
        author: true,
        featured: true,
        tags: true,
        createdAt: true,
      },
    });
  } catch {
    return [];
  }
}

async function getProducts() {
  try {
    return await prisma.product.findMany({
      where: { isSoldOut: false },
      take: 6,
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, imageUrl: true, category: true, priceShip: true },
    });
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return { title: "Post Not Found | Real Duck Distro" };
  }

  // SEO overrides (admin-set) win over auto-generated values.
  const title = post.metaTitle?.trim() || `${post.title} | Real Duck Distro Blog`;
  const desc =
    post.metaDescription?.trim() ||
    post.excerpt ||
    post.content.substring(0, 160);
  const kw = post.metaKeywords?.trim()
    ? post.metaKeywords.split(",").map((k) => k.trim()).filter(Boolean)
    : [
        "cannabis blog",
        "cannabis guide",
        "cannabis education",
        post.category.toLowerCase().replace(/_/g, " "),
        ...(post.tags || []),
        "Real Duck Distro",
      ];
  const ogImage = post.ogImage?.trim() || post.imageUrl;

  return {
    title,
    description: desc,
    keywords: kw,
    authors: [{ name: post.author }],
    openGraph: {
      title: post.metaTitle?.trim() || post.title,
      description: desc,
      type: "article",
      url: `${SITE_URL}/blog/${post.slug}`,
      siteName: "Real Duck Distro",
      publishedTime: post.createdAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [post.author],
      section: post.category.toLowerCase().replace(/_/g, " "),
      tags: post.tags || [],
      images: ogImage ? [{ url: ogImage, alt: post.title }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: post.metaTitle?.trim() || post.title,
      description: desc,
      images: ogImage ? [ogImage] : [],
    },
    alternates: {
      canonical: `${SITE_URL}/blog/${post.slug}`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) notFound();

  const [relatedPosts, products] = await Promise.all([
    getRelatedPosts(post.category, post.id),
    getProducts(),
  ]);

  const plain = post.content.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  const wordCount = plain ? plain.split(/\s+/).length : 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    alternativeHeadline: post.subtitle || undefined,
    description: post.excerpt || plain.slice(0, 160),
    image: post.images?.length
      ? [post.imageUrl, ...post.images].filter(Boolean)
      : (post.imageUrl ? [post.imageUrl] : undefined),
    datePublished: post.createdAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    inLanguage: "en-US",
    articleSection: post.category.toLowerCase().replace(/_/g, " "),
    keywords: (post.tags || []).join(", ") || undefined,
    wordCount: wordCount || undefined,
    author: {
      "@type": "Organization",
      name: "Real Duck Distro Editorial Team",
      url: `${SITE_URL}/about`,
      knowsAbout: [
        "California cannabis cultivation",
        "Cannabis extracts and concentrates",
        "Strain genetics and terpene chemistry",
        "Disposable vape hardware",
        "Cannabis harm reduction",
        "Cannabis edibles and dosing",
      ],
    },
    publisher: {
      "@type": "Organization",
      name: "Real Duck Distro",
      url: `${SITE_URL}`,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/images/logo.jpg`,
        width: 1111,
        height: 874,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${post.slug}`,
    },
    url: `${SITE_URL}/blog/${post.slug}`,
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}` },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: `${SITE_URL}/blog/${post.slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <Navbar />
      <BlogPostClient
        post={{
          ...post,
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString(),
        }}
        relatedPosts={relatedPosts.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() }))}
        products={products}
      />
      <Footer />
    </>
  );
}
