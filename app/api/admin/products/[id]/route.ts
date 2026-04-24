import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";
import { Category } from "@prisma/client";
import { slugify } from "@/lib/slug";
import { pingIndexNow } from "@/lib/indexNow";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://realduckdistro.com";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET a single product
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// UPDATE a product
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      title,
      description,
      category,
      indoor,
      rating,
      priceLocal,
      priceShip,
      isSoldOut,
      imageUrl,
      images,
      videoUrl,
    } = body;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Validate category if provided
    if (category && !Object.values(Category).includes(category)) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

    // Regenerate slug if title changed
    let newSlug: string | undefined;
    if (title && title !== existingProduct.title) {
      const baseSlug = slugify(title) || "product";
      let slug = baseSlug;
      let counter = 1;
      while (true) {
        const conflict = await prisma.product.findUnique({ where: { slug } });
        if (!conflict || conflict.id === id) break;
        counter++;
        slug = `${baseSlug}-${counter}`;
        if (counter > 100) break;
      }
      newSlug = slug;
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(newSlug && { slug: newSlug }),
        ...(description !== undefined && { description }),
        ...(category && { category: category as Category }),
        ...(indoor !== undefined && { indoor }),
        ...(rating && { rating }),
        ...(priceLocal && { priceLocal }),
        ...(priceShip && { priceShip }),
        ...(isSoldOut !== undefined && { isSoldOut }),
        ...(imageUrl && { imageUrl }),
        ...(images !== undefined && { images: Array.isArray(images) ? images : [] }),
        ...(videoUrl !== undefined && { videoUrl: videoUrl || null }),
      },
    });

    pingIndexNow([
      `${SITE_URL}/product/${product.slug || product.id}`,
      `${SITE_URL}/`,
      `${SITE_URL}/sitemap.xml`,
    ]).catch(() => {});

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE a product
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
