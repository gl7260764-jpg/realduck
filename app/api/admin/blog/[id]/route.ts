import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";
import { pingIndexNow } from "@/lib/indexNow";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.realduckdistro.com";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const post = await prisma.blogPost.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    return NextResponse.json(post);
  } catch (error) {
    console.error("Error fetching blog post:", error);
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();

    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        title: body.title?.trim(),
        subtitle: body.subtitle?.trim() || null,
        category: body.category,
        content: body.content?.trim(),
        excerpt: body.excerpt?.trim() || body.content?.trim()?.substring(0, 160),
        imageUrl: body.imageUrl,
        images: body.images || [],
        author: body.author?.trim() || "Real Duck Distro",
        published: body.published,
        featured: body.featured,
        tags: body.tags || [],
        // SEO overrides — empty string clears the override.
        ...(body.metaTitle !== undefined && { metaTitle: body.metaTitle?.trim() || null }),
        ...(body.metaDescription !== undefined && { metaDescription: body.metaDescription?.trim() || null }),
        ...(body.metaKeywords !== undefined && { metaKeywords: body.metaKeywords?.trim() || null }),
        ...(body.ogImage !== undefined && { ogImage: body.ogImage?.trim() || null }),
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
    console.error("Error updating blog post:", error);
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.blogPost.findUnique({ where: { id }, select: { slug: true, title: true } });
    await prisma.blogPost.delete({ where: { id } });
    if (existing?.slug) {
      // Track for permanent 410 Gone responses (middleware reads this list).
      await prisma.deletedSlug.upsert({
        where: { slug: existing.slug },
        create: { slug: existing.slug, kind: "blog", title: existing.title },
        update: {},
      }).catch(() => {});
    }
    revalidatePath("/blog");
    if (existing?.slug) revalidatePath(`/blog/${existing.slug}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting blog post:", error);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
