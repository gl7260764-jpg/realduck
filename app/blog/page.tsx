import { Metadata } from "next";
import prisma from "@/lib/prisma";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BlogClient from "./BlogClient";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Blog | Real Duck Distro - Cannabis Education, Health & Guides",
  description:
    "Explore cannabis education, how-to guides, health benefits, and industry insights from Real Duck Distro. Learn about strains, consumption methods, medicinal uses, and more.",
  openGraph: {
    title: "Real Duck Distro Blog - Cannabis Education & Guides",
    description:
      "Your trusted source for cannabis education, health insights, how-to guides, and industry knowledge.",
    type: "website",
  },
  alternates: {
    canonical: "https://realduckdistro.com/blog",
  },
};

async function getBlogPosts() {
  try {
    return await prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
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

export default async function BlogPage() {
  const posts = await getBlogPosts();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Real Duck Distro Blog",
    description: "Cannabis education, guides, health benefits, and industry insights.",
    url: "https://realduckdistro.com/blog",
    publisher: {
      "@type": "Organization",
      name: "Real Duck Distro",
      url: "https://realduckdistro.com",
    },
    blogPost: posts.slice(0, 10).map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      url: `https://realduckdistro.com/blog/${post.slug}`,
      datePublished: post.createdAt,
      author: { "@type": "Person", name: post.author },
      image: post.imageUrl,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <BlogClient posts={posts.map(p => ({ ...p, createdAt: p.createdAt.toISOString() }))} />
      <Footer />
    </>
  );
}
