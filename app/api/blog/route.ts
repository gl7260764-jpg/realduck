import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const slug = searchParams.get("slug");
  const featured = searchParams.get("featured");

  try {
    if (slug) {
      const post = await prisma.blogPost.findUnique({
        where: { slug, published: true },
      });
      if (!post) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }
      return NextResponse.json(post);
    }

    const where: Record<string, unknown> = { published: true };
    if (category) where.category = category;
    if (featured === "true") where.featured = true;

    const posts = await prisma.blogPost.findMany({
      where,
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

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}
