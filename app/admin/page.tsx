import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  ArrowRight,
  Edit,
} from "lucide-react";

async function getStats() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const prevWeek = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [
    totalProducts,
    soldOutProducts,
    inStockProducts,
    todayViews,
    yesterdayViews,
    weekViews,
    prevWeekViews,
    weekUniqueRows,
    todayOrders,
    yesterdayOrders,
    weekOrders,
    prevWeekOrders,
    activeSubscribers,
    totalCampaigns,
    publishedBlogPosts,
    todayCheckoutOrders,
    weekCheckoutOrders,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { isSoldOut: true } }),
    prisma.product.count({ where: { isSoldOut: false } }),
    prisma.pageView.count({ where: { createdAt: { gte: today } } }),
    prisma.pageView.count({ where: { createdAt: { gte: yesterday, lt: today } } }),
    prisma.pageView.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.pageView.count({ where: { createdAt: { gte: prevWeek, lt: weekAgo } } }),
    prisma.pageView.findMany({
      where: { createdAt: { gte: weekAgo }, sessionId: { not: null } },
      distinct: ["sessionId"],
      select: { sessionId: true },
    }),
    prisma.checkoutOrder.count({ where: { createdAt: { gte: today } } }),
    prisma.checkoutOrder.count({ where: { createdAt: { gte: yesterday, lt: today } } }),
    prisma.checkoutOrder.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.checkoutOrder.count({ where: { createdAt: { gte: prevWeek, lt: weekAgo } } }),
    prisma.newsletterSubscriber.count({ where: { active: true } }),
    prisma.campaign.count({ where: { archived: false } }),
    prisma.blogPost.count({ where: { published: true } }),
    prisma.checkoutOrder.findMany({
      where: { createdAt: { gte: today } },
      select: { items: true },
    }),
    prisma.checkoutOrder.findMany({
      where: { createdAt: { gte: weekAgo } },
      select: { items: true },
    }),
  ]);

  function sumRevenue(orders: Array<{ items: unknown }>): number {
    let total = 0;
    for (const o of orders) {
      const items = (o.items as Array<{ price?: string; quantity?: number }>) || [];
      for (const it of items) {
        const m = String(it.price || "").match(/\$?([\d,]+(?:\.\d+)?)/);
        if (m) total += parseFloat(m[1].replace(/,/g, "")) * (it.quantity || 1);
      }
    }
    return total;
  }

  const todayRevenue = sumRevenue(todayCheckoutOrders);
  const weekRevenue = sumRevenue(weekCheckoutOrders);
  const conversionRate = weekViews > 0
    ? Number(((weekOrders / weekViews) * 100).toFixed(2))
    : 0;

  return {
    totalProducts, soldOutProducts, inStockProducts,
    todayViews, yesterdayViews, weekViews, prevWeekViews,
    weekUniqueVisitors: weekUniqueRows.length,
    todayOrders, yesterdayOrders, weekOrders, prevWeekOrders,
    todayRevenue: Math.round(todayRevenue * 100) / 100,
    weekRevenue: Math.round(weekRevenue * 100) / 100,
    activeSubscribers, totalCampaigns, publishedBlogPosts,
    conversionRate,
  };
}

async function getRecentProducts() {
  return prisma.product.findMany({
    take: 6,
    orderBy: { createdAt: "desc" },
  });
}

async function getRecentOrders() {
  return prisma.checkoutOrder.findMany({
    take: 8,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      firstName: true,
      lastName: true,
      ipCity: true,
      ipCountry: true,
      city: true,
      country: true,
      totalItems: true,
      paymentMethod: true,
      status: true,
      createdAt: true,
      items: true,
    },
  });
}

function fmtMoney(n: number, opts: { compact?: boolean } = {}) {
  if (opts.compact && n >= 1000) {
    return "$" + (n / 1000).toFixed(1) + "k";
  }
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function timeAgo(d: Date): string {
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const days = Math.floor(hr / 24);
  return `${days}d ago`;
}

function deltaPct(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? null : 0;
  return Number((((current - previous) / previous) * 100).toFixed(0));
}

export default async function AdminDashboard() {
  const authenticated = await isAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const [stats, recentProducts, recentOrders] = await Promise.all([
    getStats(),
    getRecentProducts(),
    getRecentOrders(),
  ]);

  const orderStatusFmt: Record<string, string> = {
    pending: "Pending", confirmed: "Confirmed", paid: "Paid",
    shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled",
  };

  return (
    <div className="admin-page">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-2">
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.14em]">Overview</p>
          <h1 className="text-[26px] sm:text-[28px] font-semibold text-slate-900 tracking-tight mt-1 leading-tight">Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/analytics" className="px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-lg transition-colors">
            View analytics
          </Link>
          <Link href="/admin/products/new" className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors">
            <Plus className="w-4 h-4" strokeWidth={2.2} />
            New product
          </Link>
        </div>
      </header>

      {/* ─── KPI strip ──────────────────────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200 rounded-xl overflow-hidden border border-slate-200">
        <Kpi
          label="Revenue"
          period="Past 7 days"
          value={fmtMoney(stats.weekRevenue, { compact: stats.weekRevenue >= 10000 })}
          subValue={fmtMoney(stats.todayRevenue) + " today"}
        />
        <Kpi
          label="Orders"
          period="Past 7 days"
          value={stats.weekOrders.toLocaleString()}
          subValue={`${stats.todayOrders} today`}
          delta={deltaPct(stats.weekOrders, stats.prevWeekOrders)}
        />
        <Kpi
          label="Visitors"
          period="Past 7 days"
          value={stats.weekUniqueVisitors.toLocaleString()}
          subValue={`${stats.todayViews} views today`}
          delta={deltaPct(stats.weekViews, stats.prevWeekViews)}
        />
        <Kpi
          label="Conversion"
          period="Past 7 days"
          value={`${stats.conversionRate}%`}
          subValue={`${stats.weekOrders} orders / ${stats.weekViews.toLocaleString()} views`}
        />
      </section>

      {/* ─── Two-col: Recent orders + Inventory ─────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent orders */}
        <div className="lg:col-span-2 admin-card overflow-hidden">
          <header className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
            <h2 className="text-[13px] font-semibold text-slate-900">Recent orders</h2>
            <Link href="/admin/orders" className="text-[12px] font-medium text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </header>
          {recentOrders.length === 0 ? (
            <EmptyState text="No orders yet" sub="Customer orders will appear here." />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] font-medium text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="text-left py-2.5 px-5">Customer</th>
                  <th className="text-left py-2.5 px-2 hidden sm:table-cell">Order</th>
                  <th className="text-left py-2.5 px-2 hidden lg:table-cell">Status</th>
                  <th className="text-right py-2.5 px-5">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => {
                  const items = (o.items as Array<{ price?: string; quantity?: number }>) || [];
                  let total = 0;
                  for (const it of items) {
                    const m = String(it.price || "").match(/\$?([\d,]+(?:\.\d+)?)/);
                    if (m) total += parseFloat(m[1].replace(/,/g, "")) * (it.quantity || 1);
                  }
                  return (
                    <tr key={o.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/40 transition-colors">
                      <td className="py-3 px-5">
                        <div className="text-sm text-slate-900 font-medium truncate">{o.firstName} {o.lastName}</div>
                        <div className="text-[11px] text-slate-500 truncate">{o.ipCity || o.city || "—"}{(o.ipCountry || o.country) ? `, ${o.ipCountry || o.country}` : ""} · {timeAgo(new Date(o.createdAt))}</div>
                      </td>
                      <td className="py-3 px-2 hidden sm:table-cell">
                        <div className="text-[12px] font-mono text-slate-600">#{o.orderNumber}</div>
                        <div className="text-[11px] text-slate-400 capitalize">{o.paymentMethod}</div>
                      </td>
                      <td className="py-3 px-2 hidden lg:table-cell">
                        <StatusPill status={o.status} label={orderStatusFmt[o.status] || o.status} />
                      </td>
                      <td className="py-3 px-5 text-right">
                        <div className="text-sm font-semibold text-slate-900 tabular-nums">{fmtMoney(total)}</div>
                        <div className="text-[11px] text-slate-400">{o.totalItems} item{o.totalItems === 1 ? "" : "s"}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Inventory snapshot */}
        <aside className="admin-card overflow-hidden">
          <header className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
            <h2 className="text-[13px] font-semibold text-slate-900">Inventory</h2>
            <Link href="/admin/products" className="text-[12px] font-medium text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 transition-colors">
              Manage <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </header>
          <div className="p-5 space-y-4">
            <InventoryRow label="In stock" value={stats.inStockProducts} total={stats.totalProducts} accent="bg-slate-900" />
            <InventoryRow label="Sold out" value={stats.soldOutProducts} total={stats.totalProducts} accent="bg-rose-500" />
            <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total</p>
                <p className="text-lg font-semibold text-slate-900 mt-0.5 tabular-nums">{stats.totalProducts}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Subscribers</p>
                <p className="text-lg font-semibold text-slate-900 mt-0.5 tabular-nums">{stats.activeSubscribers}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Posts</p>
                <p className="text-lg font-semibold text-slate-900 mt-0.5 tabular-nums">{stats.publishedBlogPosts}</p>
              </div>
            </div>
          </div>
        </aside>
      </section>

      {/* ─── Recent products ────────────────────────────────────── */}
      <section className="admin-card overflow-hidden">
        <header className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <h2 className="text-[13px] font-semibold text-slate-900">Recent products</h2>
          <Link href="/admin/products" className="text-[12px] font-medium text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 transition-colors">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </header>
        {recentProducts.length === 0 ? (
          <EmptyState text="No products yet">
            <Link href="/admin/products/new" className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors">
              <Plus className="w-4 h-4" strokeWidth={2.2} /> Add first product
            </Link>
          </EmptyState>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recentProducts.map((p) => (
              <li key={p.id} className="px-5 py-3 hover:bg-slate-50/40 transition-colors group">
                <Link href={`/admin/products/${p.id}/edit`} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 ring-1 ring-slate-200">
                    <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">{p.title}</p>
                    <p className="text-[11px] text-slate-500 capitalize">{p.category.toLowerCase().replace(/_/g, " ")}</p>
                  </div>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                    p.isSoldOut ? "bg-rose-50 text-rose-700 border border-rose-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                  }`}>
                    {p.isSoldOut ? "Sold out" : "In stock"}
                  </span>
                  <Edit className="w-4 h-4 text-slate-300 group-hover:text-slate-700 transition-colors flex-shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

    </div>
  );
}

// ─── Components ────────────────────────────────────────────────────

function Kpi({ label, period, value, subValue, delta }: {
  label: string;
  period: string;
  value: string;
  subValue: string;
  delta?: number | null;
}) {
  return (
    <div className="bg-white p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[12px] font-medium text-slate-500">{label}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{period}</p>
        </div>
        {delta !== undefined && delta !== null && (
          <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded ${
            delta > 0 ? "text-emerald-700 bg-emerald-50" :
            delta < 0 ? "text-rose-700 bg-rose-50" :
            "text-slate-500 bg-slate-100"
          }`}>
            {delta > 0 ? <ArrowUpRight className="w-3 h-3" /> : delta < 0 ? <ArrowDownRight className="w-3 h-3" /> : null}
            {delta > 0 ? "+" : ""}{delta}%
          </span>
        )}
      </div>
      <p className="text-[26px] sm:text-[28px] font-semibold text-slate-900 tracking-tight tabular-nums leading-none">{value}</p>
      <p className="text-[11px] text-slate-500 mt-2">{subValue}</p>
    </div>
  );
}

function InventoryRow({ label, value, total, accent }: { label: string; value: number; total: number; accent: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[12px] font-medium text-slate-700">{label}</span>
        <span className="text-[12px] text-slate-500 tabular-nums">{value} <span className="text-slate-400">({pct}%)</span></span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${accent} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function StatusPill({ status, label }: { status: string; label: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-100",
    confirmed: "bg-blue-50 text-blue-700 border-blue-100",
    paid: "bg-violet-50 text-violet-700 border-violet-100",
    shipped: "bg-indigo-50 text-indigo-700 border-indigo-100",
    delivered: "bg-emerald-50 text-emerald-700 border-emerald-100",
    cancelled: "bg-slate-100 text-slate-600 border-slate-200",
  };
  return (
    <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full border ${styles[status] || styles.pending}`}>
      {label}
    </span>
  );
}

function EmptyState({ text, sub, children }: { text: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="px-5 py-12 text-center">
      <p className="text-sm font-medium text-slate-900">{text}</p>
      {sub && <p className="text-[12px] text-slate-500 mt-1">{sub}</p>}
      {children}
    </div>
  );
}
