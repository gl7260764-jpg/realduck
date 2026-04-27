import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";
import { pingIndexNow } from "@/lib/indexNow";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://realduckdistro.com";

export async function GET() {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const posts = await prisma.blogPost.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 80);
}

export async function POST(request: NextRequest) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!body.title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (!body.content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }
    if (!body.category) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }

    let slug = body.slug?.trim() || generateSlug(body.title);

    // Ensure slug is unique
    const existing = await prisma.blogPost.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const post = await prisma.blogPost.create({
      data: {
        slug,
        title: body.title.trim(),
        subtitle: body.subtitle?.trim() || null,
        category: body.category,
        content: body.content.trim(),
        excerpt: body.excerpt?.trim() || body.content.trim().substring(0, 160),
        imageUrl: body.imageUrl || "",
        images: body.images || [],
        author: body.author?.trim() || "Real Duck Distro",
        published: body.published ?? false,
        featured: body.featured ?? false,
        tags: body.tags || [],
      },
    });

    if (post.published) {
      pingIndexNow([
        `${SITE_URL}/blog/${post.slug}`,
        `${SITE_URL}/blog`,
        `${SITE_URL}/sitemap.xml`,
      ]).catch(() => {});
    }

    revalidatePath("/blog");
    revalidatePath(`/blog/${post.slug}`);

    return NextResponse.json(post);
  } catch (error) {
    console.error("Error creating blog post:", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
