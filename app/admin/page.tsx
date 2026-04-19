import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import {
  Package,
  TrendingUp,
  AlertCircle,
  Plus,
  ArrowRight,
  Eye,
  BarChart3,
  Edit,
} from "lucide-react";

async function getStats() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [totalProducts, soldOutProducts, categories, todayViews] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { isSoldOut: true } }),
    prisma.product.groupBy({
      by: ["category"],
      _count: { category: true },
    }),
    prisma.pageView.count({ where: { createdAt: { gte: today } } }),
  ]);

  return {
    totalProducts,
    soldOutProducts,
    inStockProducts: totalProducts - soldOutProducts,
    categoriesCount: categories.length,
    todayViews,
  };
}

async function getRecentProducts() {
  return prisma.product.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
  });
}

export default async function AdminDashboard() {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    redirect("/admin/login");
  }

  const [stats, recentProducts] = await Promise.all([
    getStats(),
    getRecentProducts(),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Welcome back! Here&apos;s an overview of your store.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-500 truncate">Total Products</p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900">
                {stats.totalProducts}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-500">In Stock</p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900">
                {stats.inStockProducts}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-500">Sold Out</p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900">
                {stats.soldOutProducts}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-500">Categories</p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900">
                {stats.categoriesCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Analytics */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-lg p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2.5 sm:p-3 bg-white/10 rounded-lg">
              <Eye className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-white/70 text-xs sm:text-sm">Today&apos;s Page Views</p>
              <p className="text-2xl sm:text-3xl font-semibold">{stats.todayViews}</p>
            </div>
          </div>
          <Link
            href="/admin/analytics"
            className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto"
          >
            <BarChart3 className="w-4 h-4" />
            View Analytics
          </Link>
        </div>
      </div>

      {/* Recent Products */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Recent Products</h2>
          <Link
            href="/admin/products"
            className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors"
          >
            View all
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {recentProducts.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <Package className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No products yet</p>
            <Link
              href="/admin/products/new"
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add your first product
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {recentProducts.map((product) => (
              <div key={product.id} className="px-4 sm:px-6 py-4">
                <div className="flex items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{product.title}</p>
                      <p className="text-xs sm:text-sm text-gray-500">{product.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                    <span
                      className={`px-2 sm:px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                        product.isSoldOut
                          ? "bg-red-50 text-red-600"
                          : "bg-green-50 text-green-600"
                      }`}
                    >
                      {product.isSoldOut ? "Sold Out" : "In Stock"}
                    </span>
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="text-sm text-gray-500 hover:text-gray-900 transition-colors hidden sm:inline"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors sm:hidden"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
