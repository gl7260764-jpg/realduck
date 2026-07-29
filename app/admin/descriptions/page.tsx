import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import prisma from "@/lib/prisma";
import DescriptionsManager from "./DescriptionsManager";

export const dynamic = "force-dynamic";

export default async function DescriptionsPage() {
  if (!(await isAuthenticated())) redirect("/admin/login");

  const rows = await prisma.product.findMany({
    select: {
      id: true, title: true, slug: true, category: true,
      imageUrl: true, description: true, metaDescription: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Products missing a description surface first so gaps are easy to fill.
  const products = rows
    .map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug || p.id,
      category: p.category,
      imageUrl: p.imageUrl,
      description: p.description || "",
      metaDescription: p.metaDescription || "",
    }))
    .sort((a, b) => Number(!!a.description) - Number(!!b.description));

  return <DescriptionsManager initialProducts={products} />;
}
