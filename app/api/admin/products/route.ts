import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";
import { Category } from "@prisma/client";
import { slugify } from "@/lib/slug";

// GET all products
export async function GET() {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// CREATE a new product
export async function POST(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Validate required fields
    if (!title || !category || !priceLocal || !priceShip || !imageUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate category enum
    if (!Object.values(Category).includes(category)) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

    // Generate unique slug from title
    const baseSlug = slugify(title) || "product";
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.product.findUnique({ where: { slug } })) {
      counter++;
      slug = `${baseSlug}-${counter}`;
      if (counter > 100) break;
    }

    const product = await prisma.product.create({
      data: {
        slug,
        title,
        description: description || null,
        category: category as Category,
        indoor: indoor ?? true,
        rating: rating || "10/10",
        priceLocal,
        priceShip,
        isSoldOut: isSoldOut ?? false,
        imageUrl,
        images: Array.isArray(images) ? images : [],
        videoUrl: videoUrl || null,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
