import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getHiddenCategories } from "@/lib/categoryVisibility";

export const revalidate = 60;

/**
 * Tiny slug-only endpoint used by client components that hold product
 * references outside the server render (e.g. RecentlyViewed reads from
 * localStorage). Lets them drop anything that has since sold out or had its
 * category hidden, without shipping full product rows to the browser.
 */
export async function GET() {
  try {
    const hidden = await getHiddenCategories();
    const products = await prisma.product.findMany({
      where: {
        isSoldOut: false,
        ...(hidden.length ? { NOT: { category: { in: hidden as never } } } : {}),
      },
      select: { slug: true },
    });

    return NextResponse.json({
      slugs: products.map((p) => p.slug).filter(Boolean),
    });
  } catch (error) {
    console.error("Error fetching available slugs:", error);
    return NextResponse.json({ error: "Failed to fetch slugs" }, { status: 500 });
  }
}
