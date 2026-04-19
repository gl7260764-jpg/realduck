import { Metadata } from "next";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import BlogPostClient from "./BlogPostClient";

export const dynamic = "force-dynamic";

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

  return {
    title: `${post.title} | Real Duck Distro Blog`,
    description: post.excerpt || post.content.substring(0, 160),
    openGraph: {
      title: post.title,
      description: post.excerpt || post.content.substring(0, 160),
      type: "article",
      publishedTime: post.createdAt.toISOString(),
      authors: [post.author],
      images: post.imageUrl ? [post.imageUrl] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt || post.content.substring(0, 160),
      images: post.imageUrl ? [post.imageUrl] : [],
    },
    alternates: {
      canonical: `https://realduckdistro.com/blog/${post.slug}`,
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || post.content.substring(0, 160),
    image: post.imageUrl,
    datePublished: post.createdAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      "@type": "Person",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: "Real Duck Distro",
      url: "https://realduckdistro.com",
    },
    mainEntityOfPage: `https://realduckdistro.com/blog/${post.slug}`,
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://realduckdistro.com" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "https://realduckdistro.com/blog" },
      { "@type": "ListItem", position: 3, name: post.title, item: `https://realduckdistro.com/blog/${post.slug}` },
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
