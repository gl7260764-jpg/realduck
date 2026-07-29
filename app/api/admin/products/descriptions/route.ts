import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";
import { pingIndexNow } from "@/lib/indexNow";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://realduckdistro.com";

// Derive a clean SEO meta description from a product description:
// strip tags/markup, collapse whitespace, trim to ~155 chars on a word boundary.
function toMetaDescription(desc: string): string {
  const clean = desc.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (clean.length <= 155) return clean;
  const cut = clean.slice(0, 155);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 120 ? cut.slice(0, lastSpace) : cut).trim();
}

/**
 * Admin: save a product's unique description and AUTO-ASSIGN the SEO meta
 * description from it (so writing a good description enhances search results
 * with no extra step). Used by the /admin/descriptions manager.
 */
export async function PATCH(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id, description } = await req.json();
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Product id is required" }, { status: 400 });
    }
    const clean = typeof description === "string" ? description.trim() : "";
    const metaDescription = clean ? toMetaDescription(clean) : null;

    const product = await prisma.product.update({
      where: { id },
      data: { description: clean || null, metaDescription },
      select: { id: true, slug: true },
    });

    // Refresh the product page cache + nudge search engines to recrawl.
    try {
      revalidatePath(`/product/${product.slug || product.id}`);
      revalidatePath("/product/[id]", "page");
      await pingIndexNow([`${SITE_URL}/product/${product.slug || product.id}`]);
    } catch {
      /* best-effort */
    }

    return NextResponse.json({ ok: true, metaDescription });
  } catch (error) {
    console.error("Save description failed:", (error as Error).message);
    return NextResponse.json({ error: "Failed to save description" }, { status: 500 });
  }
}
