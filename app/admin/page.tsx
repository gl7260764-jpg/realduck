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
  ShoppingBag,
  DollarSign,
  Users,
  Layers,
  Megaphone,
  FileText,
  Mail,
  Link2,
  Sparkles,
  Activity,
} from "lucide-react";

async function getStats() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalProducts,
    soldOutProducts,
    categories,
    todayViews,
    yesterdayViews,
    weekViews,
    todayOrders,
    yesterdayOrders,
    weekOrders,
    activeSubscribers,
    totalCampaigns,
    publishedBlogPosts,
    todayCheckoutOrders,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { isSoldOut: true } }),
    prisma.product.groupBy({ by: ["category"], _count: { category: true } }),
    prisma.pageView.count({ where: { createdAt: { gte: today } } }),
    prisma.pageView.count({ where: { createdAt: { gte: yesterday, lt: today } } }),
    prisma.pageView.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.checkoutOrder.count({ where: { createdAt: { gte: today } } }),
    prisma.checkoutOrder.count({ where: { createdAt: { gte: yesterday, lt: today } } }),
    prisma.checkoutOrder.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.newsletterSubscriber.count({ where: { active: true } }),
    prisma.campaign.count({ where: { archived: false } }),
    prisma.blogPost.count({ where: { published: true } }),
    prisma.checkoutOrder.findMany({
      where: { createdAt: { gte: today } },
      select: { items: true },
    }),
  ]);

  // Today's revenue
  let todayRevenue = 0;
  for (const order of todayCheckoutOrders) {
    const items = (order.items as Array<{ price?: string; quantity?: number }>) || [];
    for (const it of items) {
      const m = String(it.price || "").match(/\$?([\d,]+(?:\.\d+)?)/);
      if (m) todayRevenue += parseFloat(m[1].replace(/,/g, "")) * (it.quantity || 1);
    }
  }

  return {
    totalProducts,
    soldOutProducts,
    inStockProducts: totalProducts - soldOutProducts,
    categoriesCount: categories.length,
    todayViews,
    yesterdayViews,
    weekViews,
    todayOrders,
    yesterdayOrders,
    weekOrders,
    todayRevenue: Math.round(todayRevenue * 100) / 100,
    activeSubscribers,
    totalCampaigns,
    publishedBlogPosts,
  };
}

async function getRecentProducts() {
  return prisma.product.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
  });
}

async function getRecentOrders() {
  return prisma.checkoutOrder.findMany({
    take: 5,
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
      createdAt: true,
      items: true,
    },
  });
}

function deltaClass(today: number, yesterday: number) {
  if (yesterday === 0) return today > 0 ? "text-emerald-600" : "text-slate-400";
  const pct = ((today - yesterday) / yesterday) * 100;
  if (pct > 0) return "text-emerald-600";
  if (pct < 0) return "text-rose-500";
  return "text-slate-400";
}

function deltaText(today: number, yesterday: number) {
  if (yesterday === 0) return today > 0 ? "+new" : "—";
  const pct = ((today - yesterday) / yesterday) * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${Math.round(pct)}%`;
}

function fmtMoney(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function timeAgo(d: Date): string {
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  return `${days}d ago`;
}

export default async function AdminDashboard() {
  const authenticated = await isAuthenticated();
  if (!authenticated) redirect("/admin/login");

  const [stats, recentProducts, recentOrders] = await Promise.all([
    getStats(),
    getRecentProducts(),
    getRecentOrders(),
  ]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="admin-page">
      {/* ─── Hero header ──────────────────────────────────────────── */}
      <div className="admin-page-header">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-1.5 text-[11px] font-bold text-violet-600 uppercase tracking-[0.14em] mb-1.5">
              <Sparkles className="w-3 h-3" /> {greeting}
            </p>
            <h1 className="admin-page-title">Dashboard</h1>
            <p className="admin-page-subtitle">
              Real-time pulse of your store. Updated {timeAgo(new Date())}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/analytics" className="admin-btn-secondary">
              <BarChart3 className="w-4 h-4" /> Analytics
            </Link>
            <Link href="/admin/products/new" className="admin-btn-primary">
              <Plus className="w-4 h-4" strokeWidth={2.5} /> Add Product
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Today snapshot — featured glassy hero ───────────────── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl shadow-slate-900/20 admin-fade-in">
        {/* Decorative gradient blobs */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-60 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(600px 200px at 10% 10%, rgba(139,92,246,0.25), transparent 60%), radial-gradient(700px 280px at 90% 90%, rgba(56,189,248,0.18), transparent 60%)",
          }}
        />
        <div className="relative p-5 sm:p-7 lg:p-8">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">Live · Today</p>
            </div>
            <Link href="/admin/analytics" className="text-xs font-semibold text-white/70 hover:text-white inline-flex items-center gap-1 transition-colors">
              Drill down <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <HeroStat
              icon={ShoppingBag}
              label="Orders"
              value={stats.todayOrders.toLocaleString()}
              delta={deltaText(stats.todayOrders, stats.yesterdayOrders)}
              deltaClass={deltaClass(stats.todayOrders, stats.yesterdayOrders).replace("text-", "text-")}
              accent="from-emerald-400/30 to-teal-500/20"
            />
            <HeroStat
              icon={DollarSign}
              label="Revenue"
              value={fmtMoney(stats.todayRevenue)}
              delta=""
              deltaClass="text-white/40"
              accent="from-amber-400/30 to-orange-500/20"
            />
            <HeroStat
              icon={Eye}
              label="Page Views"
              value={stats.todayViews.toLocaleString()}
              delta={deltaText(stats.todayViews, stats.yesterdayViews)}
              deltaClass={deltaClass(stats.todayViews, stats.yesterdayViews)}
              accent="from-blue-400/30 to-cyan-500/20"
            />
            <HeroStat
              icon={Activity}
              label="Week Total"
              value={stats.weekViews.toLocaleString()}
              delta={`${stats.weekOrders} orders`}
              deltaClass="text-white/60"
              accent="from-violet-400/30 to-purple-500/20"
            />
          </div>
        </div>
      </section>

      {/* ─── Inventory KPIs ──────────────────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 admin-stagger">
        <KpiCard label="Total Products" value={stats.totalProducts} icon={Package} accent="from-blue-500 to-indigo-600" tint="bg-blue-50" tintText="text-blue-700" />
        <KpiCard label="In Stock" value={stats.inStockProducts} icon={TrendingUp} accent="from-emerald-500 to-green-600" tint="bg-emerald-50" tintText="text-emerald-700" />
        <KpiCard label="Sold Out" value={stats.soldOutProducts} icon={AlertCircle} accent="from-rose-500 to-red-600" tint="bg-rose-50" tintText="text-rose-700" />
        <KpiCard label="Categories" value={stats.categoriesCount} icon={Layers} accent="from-violet-500 to-purple-600" tint="bg-violet-50" tintText="text-violet-700" />
      </section>

      {/* ─── Channels overview ───────────────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <ChannelCard href="/admin/newsletter" icon={Mail} label="Subscribers" value={stats.activeSubscribers} accent="from-sky-500 to-blue-600" />
        <ChannelCard href="/admin/links" icon={Link2} label="Tracked Links" value={stats.totalCampaigns} accent="from-indigo-500 to-violet-600" />
        <ChannelCard href="/admin/blog" icon={FileText} label="Blog Posts" value={stats.publishedBlogPosts} accent="from-rose-500 to-pink-600" />
        <ChannelCard href="/admin/announcements" icon={Megaphone} label="Announcements" value={stats.weekOrders > 0 ? "Live" : "Ready"} accent="from-fuchsia-500 to-purple-600" />
      </section>

      {/* ─── Two-column: Recent orders + Recent products ────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Recent orders */}
        <div className="admin-card lg:col-span-3 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
                <ShoppingBag className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Recent orders</h2>
            </div>
            <Link href="/admin/orders" className="text-sm text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <EmptyBox icon={ShoppingBag} text="No orders yet" sub="Orders will appear here as they come in" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentOrders.map((o) => {
                const items = (o.items as Array<{ price?: string; quantity?: number }>) || [];
                let total = 0;
                for (const it of items) {
                  const m = String(it.price || "").match(/\$?([\d,]+(?:\.\d+)?)/);
                  if (m) total += parseFloat(m[1].replace(/,/g, "")) * (it.quantity || 1);
                }
                return (
                  <li key={o.id} className="px-5 py-3.5 hover:bg-slate-50/60 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                        {(o.firstName?.[0] || "?")}{(o.lastName?.[0] || "")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-slate-900 truncate">{o.firstName} {o.lastName}</p>
                          <span className="text-[10px] font-mono text-slate-400">#{o.orderNumber}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">
                          {o.totalItems} item{o.totalItems === 1 ? "" : "s"} · {o.ipCity || o.city || "—"}, {o.ipCountry || o.country || "—"} · {timeAgo(new Date(o.createdAt))}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-slate-900 tabular-nums">{fmtMoney(total)}</p>
                        <p className="text-[10px] text-slate-400 capitalize">{o.paymentMethod}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Recent products */}
        <div className="admin-card lg:col-span-2 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-sm">
                <Package className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Recent products</h2>
            </div>
            <Link href="/admin/products" className="text-sm text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 transition-colors">
              All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {recentProducts.length === 0 ? (
            <EmptyBox icon={Package} text="No products yet">
              <Link href="/admin/products/new" className="admin-btn-primary mt-4 inline-flex">
                <Plus className="w-4 h-4" strokeWidth={2.5} /> Add first product
              </Link>
            </EmptyBox>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentProducts.map((p) => (
                <li key={p.id} className="px-5 py-3 hover:bg-slate-50/60 transition-colors group">
                  <Link href={`/admin/products/${p.id}/edit`} className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 ring-1 ring-slate-200">
                      <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">{p.title}</p>
                      <p className="text-[11px] text-slate-500 capitalize">{p.category.toLowerCase().replace(/_/g, " ")}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${
                        p.isSoldOut ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {p.isSoldOut ? "Sold Out" : "In Stock"}
                    </span>
                    <Edit className="w-4 h-4 text-slate-300 group-hover:text-slate-700 transition-colors flex-shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ─── Signature ──────────────────────────────────────────── */}
      <footer className="pt-6 pb-2 flex justify-center">
        <p className="text-[10px] font-bold tracking-[0.32em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-slate-400 via-violet-400 to-slate-400 select-none">
          CRAFTED By W1C3
        </p>
      </footer>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────

function HeroStat({
  icon: Icon, label, value, delta, deltaClass, accent,
}: {
  icon: typeof Eye;
  label: string;
  value: string;
  delta: string;
  deltaClass: string;
  accent: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-4 backdrop-blur-sm border border-white/[0.08] bg-white/[0.03] group hover:bg-white/[0.06] transition-colors">
      <div aria-hidden className={`absolute -inset-1 bg-gradient-to-br ${accent} opacity-0 group-hover:opacity-100 transition-opacity blur-xl pointer-events-none`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-2.5">
          <Icon className="w-4 h-4 text-white/60" strokeWidth={2.4} />
          {delta && <span className={`text-[10px] font-bold ${deltaClass.replace("text-emerald-600", "text-emerald-300").replace("text-rose-500", "text-rose-300").replace("text-slate-400", "text-white/40")}`}>{delta}</span>}
        </div>
        <p className="text-[11px] font-medium text-white/60 uppercase tracking-wider">{label}</p>
        <p className="text-2xl lg:text-3xl font-extrabold text-white mt-0.5 tracking-tight tabular-nums">{value}</p>
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, accent, tint, tintText }: {
  label: string; value: number; icon: typeof Package;
  accent: string; tint: string; tintText: string;
}) {
  return (
    <div className="admin-card admin-card-hover p-4 sm:p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center shadow-md`}>
          <Icon className="w-5 h-5 text-white" strokeWidth={2.4} />
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${tint} ${tintText}`}>now</span>
      </div>
      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5 tabular-nums">{value.toLocaleString()}</p>
    </div>
  );
}

function ChannelCard({ href, icon: Icon, label, value, accent }: {
  href: string; icon: typeof Mail; label: string; value: number | string; accent: string;
}) {
  return (
    <Link href={href} className="admin-card admin-card-hover p-4 sm:p-5 flex items-center gap-3 group">
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center shadow-md flex-shrink-0 group-hover:scale-105 transition-transform duration-300`}>
        <Icon className="w-5 h-5 text-white" strokeWidth={2.4} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-xl sm:text-2xl font-extrabold text-slate-900 tabular-nums truncate">{value}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
    </Link>
  );
}

function EmptyBox({ icon: Icon, text, sub, children }: {
  icon: typeof Package; text: string; sub?: string; children?: React.ReactNode;
}) {
  return (
    <div className="p-8 sm:p-10 text-center">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
        <Icon className="w-6 h-6 text-slate-400" />
      </div>
      <p className="text-sm font-semibold text-slate-900">{text}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      {children}
    </div>
  );
}
