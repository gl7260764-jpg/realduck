import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { dailyShuffle } from "@/lib/dailyShuffle";

export const dynamic = "force-dynamic";

// GET all products (public API)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const where = {
      ...(category && category !== "all" ? { category: category as any } : {}),
      ...(search
        ? {
            title: {
              contains: search,
              mode: "insensitive" as const,
            },
          }
        : {}),
    };

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    // When showing all products (no filter), apply daily shuffle for fresh content
    if (!category && !search) {
      const flowerProducts = dailyShuffle(products.filter((p) => p.category === "FLOWER"));
      const otherProducts = dailyShuffle(products.filter((p) => p.category !== "FLOWER"));
      const featuredFlower = flowerProducts.slice(0, 6);
      const restFlower = flowerProducts.slice(6);
      const remaining = dailyShuffle([...restFlower, ...otherProducts]);
      return NextResponse.json([...featuredFlower, ...remaining]);
    }

    // When filtering by category, also apply daily shuffle within that category
    if (category && category !== "all") {
      return NextResponse.json(dailyShuffle(products));
    }

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
