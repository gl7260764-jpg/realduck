import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Plus } from "lucide-react";
import ProductsTable from "./components/ProductsTable";

async function getProducts() {
  return prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export default async function ProductsPage() {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    redirect("/admin/login");
  }

  const products = await getProducts();

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="admin-page-title">Products</h1>
            <p className="admin-page-subtitle">
              {products.length === 0
                ? "No products yet — create your first one"
                : `${products.length} product${products.length === 1 ? "" : "s"} in your catalog`}
            </p>
          </div>
          <Link
            href="/admin/products/new"
            className="admin-btn-primary self-start sm:self-end"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* Products Table */}
      <ProductsTable initialProducts={products} />
    </div>
  );
}
