"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from "recharts";
import {
  Eye,
  TrendingUp,
  Users,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Clock,
  MousePointerClick,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
  Chrome,
  FileText,
  ChevronDown,
  Layers,
  MapPin,
  BarChart3,
  Link2,
  Copy,
} from "lucide-react";
import Image from "next/image";

// ─── Types ───────────────────────────────────────────────

interface AnalyticsData {
  overview: {
    totalPageViews: number;
    todayPageViews: number;
    yesterdayPageViews: number;
    rangePageViews: number;
    totalProductViews: number;
    todayProductViews: number;
    rangeProductViews: number;
    uniqueVisitors: number;
    uniqueVisitorsToday: number;
    realtimeViews: number;
    avgViewsPerDay: number;
    conversionRate: number;
    growth: {
      pageViews: number;
      productViews: number;
      uniqueVisitors: number;
    };
  };
  viewsByPeriod: Array<{
    date: string;
    label: string;
    pageViews: number;
    productViews: number;
  }>;
  topProducts: Array<{
    id: string;
    title: string;
    category: string;
    imageUrl: string;
    priceLocal: string;
    isSoldOut: boolean;
    views: number;
  }>;

  deviceBreakdown: Array<{ device: string; count: number }>;
  browserBreakdown: Array<{ browser: string; count: number }>;
  osBreakdown: Array<{ os: string; count: number }>;
  referrers: Array<{ domain: string; count: number }>;
  trackedLinks: Array<{
    id: string;
    slug: string;
    name: string;
    source: string;
    medium: string;
    destination: string;
    clicks: number;
    uniqueSessions: number;
    orders: number;
    revenue: number;
  }>;
  countryBreakdown: Array<{ country: string; count: number }>;
  inventory: {
    totalProducts: number;
    soldOutProducts: number;
    inStockProducts: number;
    productsByCategory: Array<{ category: string; count: number }>;
  };
  orders: {
    totalOrders: number;
    rangeOrders: number;
    todayOrders: number;
    uniqueCustomers: number;
    growth: number;
    byCity: Array<{ city: string; count: number }>;
    byCountry: Array<{ country: string; count: number }>;
    topProducts: Array<{ title: string; orders: number; totalQuantity: number }>;
    recent: Array<{
      productTitle: string;
      category: string;
      price: string;
      deliveryType: string;
      quantity: number;
      country: string | null;
      state: string | null;
      city: string | null;
      zip: string | null;
      ip: string | null;
      device: string | null;
      sessionId: string;
      createdAt: string;
    }>;
    recentCheckout: Array<{
      orderNumber: string;
      firstName: string;
      lastName: string;
      email: string;
      country: string;
      state: string;
      city: string;
      ipCountry: string | null;
      ipState: string | null;
      ipCity: string | null;
      ipZip: string | null;
      ipAddress: string | null;
      totalItems: number;
      paymentMethod: string;
      orderSource: string;
      status: string;
      items: unknown;
      createdAt: string;
    }>;
  };
}

const CHART_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
];

const DEVICE_ICONS: Record<string, typeof Monitor> = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
};

type DateRange = "24h" | "7d" | "30d" | "90d";

// ─── Animated number counter ─────────────────────────────

function AnimatedNumber({ value, duration = 800 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    const start = prevValue.current;
    const diff = value - start;
    if (diff === 0) return;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
    prevValue.current = value;
  }, [value, duration]);

  return <>{display.toLocaleString()}</>;
}

// ─── Collapsible section ─────────────────────────────────

function CollapsibleSection({
  title,
  icon: Icon,
  defaultOpen = false,
  badge,
  children,
}: {
  title: string;
  icon: typeof Eye;
  defaultOpen?: boolean;
  badge?: string | number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(defaultOpen ? undefined : 0);

  useEffect(() => {
    if (!contentRef.current) return;
    if (open) {
      setHeight(contentRef.current.scrollHeight);
      const timer = setTimeout(() => setHeight(undefined), 300);
      return () => clearTimeout(timer);
    } else {
      setHeight(contentRef.current.scrollHeight);
      requestAnimationFrame(() => setHeight(0));
    }
  }, [open]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-shadow duration-200 hover:shadow-md">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 sm:p-5 text-left group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-gray-100 transition-colors">
            <Icon className="w-4 h-4 text-gray-600" />
          </div>
          <span className="font-semibold text-gray-900 text-sm sm:text-base">{title}</span>
          {badge !== undefined && (
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
              {badge}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        ref={contentRef}
        className="transition-[height] duration-300 ease-in-out overflow-hidden"
        style={{ height: height !== undefined ? `${height}px` : "auto" }}
      >
        <div className="px-4 sm:px-5 pb-4 sm:pb-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Growth badge ────────────────────────────────────────

function GrowthBadge({ value }: { value: number }) {
  if (value === 0) return null;
  const isPositive = value > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] sm:text-xs font-semibold px-1.5 py-0.5 rounded-full transition-all duration-300 ${
        isPositive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
      }`}
    >
      {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(value)}%
    </span>
  );
}

// ─── Stat card ───────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  growth,
  color,
  subtext,
  delay = 0,
}: {
  icon: typeof Eye;
  label: string;
  value: string | number;
  growth?: number;
  color: string;
  subtext?: string;
  delay?: number;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const colorMap: Record<string, { bg: string; text: string; ring: string }> = {
    blue: { bg: "bg-blue-50", text: "text-blue-600", ring: "ring-blue-100" },
    green: { bg: "bg-emerald-50", text: "text-emerald-600", ring: "ring-emerald-100" },
    purple: { bg: "bg-violet-50", text: "text-violet-600", ring: "ring-violet-100" },
    orange: { bg: "bg-amber-50", text: "text-amber-600", ring: "ring-amber-100" },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 p-3.5 sm:p-5 cursor-default
        hover:shadow-lg hover:-translate-y-0.5 hover:border-gray-300
        active:scale-[0.98]
        transition-all duration-300 ease-out
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={`p-2 sm:p-2.5 rounded-xl ${c.bg} ring-1 ${c.ring}`}>
          <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${c.text}`} />
        </div>
        {growth !== undefined && <GrowthBadge value={growth} />}
      </div>
      <div className="mt-2.5 sm:mt-3">
        <p className="text-xl sm:text-2xl font-bold text-gray-900 tabular-nums">
          {typeof value === "number" ? <AnimatedNumber value={value} /> : value}
        </p>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5 font-medium">{label}</p>
        {subtext && (
          <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">{subtext}</p>
        )}
      </div>
    </div>
  );
}

// ─── Progress bar item ───────────────────────────────────

function ProgressItem({
  icon: Icon,
  label,
  value,
  pct,
  color,
  delay = 0,
}: {
  icon: typeof Monitor;
  label: string;
  value: number;
  pct: number;
  color: string;
  delay?: number;
}) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div className="group cursor-default">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 transition-colors" />
          <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">{value.toLocaleString()}</span>
          <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded font-medium">
            {pct.toFixed(1)}%
          </span>
        </div>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className="h-2 rounded-full transition-all duration-700 ease-out group-hover:brightness-110"
          style={{
            width: animated ? `${Math.max(pct, 2)}%` : "0%",
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<DateRange>("7d");
  const [refreshing, setRefreshing] = useState(false);
  const [rangeOpen, setRangeOpen] = useState(false);

  const fetchData = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) setRefreshing(true);
      try {
        const res = await fetch(`/api/admin/analytics?range=${range}`);
        if (!res.ok) {
          if (res.status === 401) {
            window.location.href = "/admin/login";
            return;
          }
          throw new Error("Failed to fetch");
        }
        const json = await res.json();
        if (json.overview) setData(json);
      } catch (err) {
        console.error("Error fetching analytics:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [range]
  );

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const interval = setInterval(() => fetchData(), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ─── Loading skeleton ────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded-lg w-40" />
        <div className="h-20 bg-gray-200 rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-xl" />
          ))}
        </div>
        <div className="h-72 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16 text-gray-500">
        <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="font-medium">Failed to load analytics</p>
        <button
          onClick={() => fetchData(true)}
          className="mt-3 text-sm text-blue-600 hover:text-blue-700 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  const rangeLabels: Record<DateRange, string> = {
    "24h": "24 Hours",
    "7d": "7 Days",
    "30d": "30 Days",
    "90d": "90 Days",
  };

  const deviceTotal = data.deviceBreakdown.reduce((s, d) => s + d.count, 0);
  const browserTotal = data.browserBreakdown.reduce((s, b) => s + b.count, 0);
  const osTotal = data.osBreakdown.reduce((s, o) => s + o.count, 0);
  const referrerTotal = data.referrers.reduce((s, r) => s + r.count, 0);
  const countryTotal = data.countryBreakdown?.reduce((s, c) => s + c.count, 0) || 0;

  return (
    <div className="space-y-4 sm:space-y-5 pb-8 max-w-[1400px] mx-auto">
      {/* ─── Header ─────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-0.5 hidden sm:block">
            Store performance & visitor insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg
              transition-all duration-200 active:scale-90 disabled:opacity-40"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>

          {/* Range selector - dropdown on mobile, pills on desktop */}
          <div className="relative sm:hidden">
            <button
              onClick={() => setRangeOpen(!rangeOpen)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 active:scale-95 transition-transform"
            >
              {rangeLabels[range]}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${rangeOpen ? "rotate-180" : ""}`} />
            </button>
            {rangeOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setRangeOpen(false)} />
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-20 py-1 min-w-[130px] animate-in fade-in slide-in-from-top-2 duration-200">
                  {(["24h", "7d", "30d", "90d"] as DateRange[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => { setRange(r); setRangeOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        range === r
                          ? "bg-slate-900 text-white font-medium"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      Last {rangeLabels[r]}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="hidden sm:flex bg-gray-100 rounded-lg p-1">
            {(["24h", "7d", "30d", "90d"] as DateRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                  range === r
                    ? "bg-white text-gray-900 shadow-sm scale-[1.02]"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Live banner ────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-xl p-4 sm:p-5 relative overflow-hidden group">
        {/* Subtle animated glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Activity className="w-5 h-5 text-green-400" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full animate-ping" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full" />
            </div>
            <div>
              <p className="text-white font-bold text-base sm:text-lg tabular-nums">
                <AnimatedNumber value={data.overview.realtimeViews} /> <span className="text-white/60 font-normal text-sm">active now</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 sm:gap-6 text-sm">
            <div className="text-center">
              <p className="text-white/40 text-[10px] uppercase tracking-wider font-medium">Today</p>
              <p className="text-white font-bold tabular-nums">
                <AnimatedNumber value={data.overview.todayPageViews} />
              </p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-white/40 text-[10px] uppercase tracking-wider font-medium">Yesterday</p>
              <p className="text-white font-bold tabular-nums">
                <AnimatedNumber value={data.overview.yesterdayPageViews} />
              </p>
            </div>
            <div className="w-px h-8 bg-white/10 hidden sm:block" />
            <div className="text-center hidden sm:block">
              <p className="text-white/40 text-[10px] uppercase tracking-wider font-medium">All Time</p>
              <p className="text-white font-bold tabular-nums">
                <AnimatedNumber value={data.overview.totalPageViews} />
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Stats grid ─────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-4">
        <StatCard
          icon={Eye}
          label="Page Views"
          value={data.overview.rangePageViews}
          growth={data.overview.growth.pageViews}
          color="blue"
          subtext={`Last ${rangeLabels[range]}`}
          delay={0}
        />
        <StatCard
          icon={Users}
          label="Unique Visitors"
          value={data.overview.uniqueVisitors}
          growth={data.overview.growth.uniqueVisitors}
          color="green"
          subtext={`${data.overview.uniqueVisitorsToday} today`}
          delay={80}
        />
        <StatCard
          icon={MousePointerClick}
          label="Product Views"
          value={data.overview.rangeProductViews}
          growth={data.overview.growth.productViews}
          color="purple"
          subtext={`${data.overview.todayProductViews} today`}
          delay={160}
        />
        <StatCard
          icon={ShoppingBag}
          label="Orders"
          value={data.orders?.rangeOrders || 0}
          growth={data.orders?.growth || 0}
          color="orange"
          subtext={`${data.orders?.todayOrders || 0} today`}
          delay={240}
        />
        <StatCard
          icon={TrendingUp}
          label="Conversion"
          value={`${data.overview.conversionRate}%`}
          color="blue"
          subtext={`${data.orders?.uniqueCustomers || 0} customers`}
          delay={320}
        />
      </div>

      {/* ─── Traffic chart ──────────────────────────── */}
      <CollapsibleSection
        title={range === "24h" ? "Hourly Traffic" : "Traffic Over Time"}
        icon={BarChart3}
        defaultOpen={true}
        badge={`${rangeLabels[range]}`}
      >
        <div className="h-52 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.viewsByPeriod}>
              <defs>
                <linearGradient id="gpv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gprv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={{ stroke: "#e5e7eb" }}
                interval={range === "90d" ? 6 : range === "30d" ? 3 : "preserveStartEnd"}
              />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} width={30} />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 10px 30px -5px rgb(0 0 0 / 0.15)",
                  fontSize: "12px",
                  padding: "10px 14px",
                }}
              />
              <Area type="monotone" dataKey="pageViews" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#gpv)" name="Page Views" animationDuration={1000} />
              <Area type="monotone" dataKey="productViews" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#gprv)" name="Product Views" animationDuration={1200} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-5 mt-3 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-[3px] rounded bg-blue-500" />
            Page Views
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-[3px] rounded bg-emerald-500" />
            Product Views
          </div>
        </div>
      </CollapsibleSection>

      {/* ─── Tech breakdown grid ────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        {/* Devices */}
        <CollapsibleSection title="Devices" icon={Smartphone} defaultOpen={true} badge={deviceTotal || undefined}>
          {data.deviceBreakdown.length > 0 ? (
            <div className="space-y-4">
              <div className="h-36 sm:h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.deviceBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius="55%"
                      outerRadius="85%"
                      paddingAngle={3}
                      dataKey="count"
                      nameKey="device"
                      animationBegin={200}
                      animationDuration={800}
                    >
                      {data.deviceBreakdown.map((_entry, index) => (
                        <Cell key={`c-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 8px 24px -4px rgb(0 0 0 / 0.12)", fontSize: "12px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {data.deviceBreakdown.map((d, i) => {
                  const Icon = DEVICE_ICONS[d.device] || Monitor;
                  const pct = deviceTotal > 0 ? (d.count / deviceTotal) * 100 : 0;
                  return (
                    <div key={d.device} className="flex items-center justify-between group cursor-default hover:bg-gray-50 -mx-2 px-2 py-1 rounded-lg transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm" style={{ backgroundColor: CHART_COLORS[i] }} />
                        <Icon className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm text-gray-700 capitalize font-medium">{d.device}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900 tabular-nums">{d.count.toLocaleString()}</span>
                        <span className="text-[10px] text-gray-400 font-medium">{pct.toFixed(0)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <EmptyState text="No device data yet" />
          )}
        </CollapsibleSection>

        {/* Browsers */}
        <CollapsibleSection title="Browsers" icon={Chrome} defaultOpen={true} badge={browserTotal || undefined}>
          {data.browserBreakdown.length > 0 ? (
            <div className="space-y-3">
              {data.browserBreakdown.slice(0, 5).map((b, i) => {
                const pct = browserTotal > 0 ? (b.count / browserTotal) * 100 : 0;
                return (
                  <ProgressItem
                    key={b.browser}
                    icon={Chrome}
                    label={b.browser}
                    value={b.count}
                    pct={pct}
                    color={CHART_COLORS[i % CHART_COLORS.length]}
                    delay={i * 100}
                  />
                );
              })}
            </div>
          ) : (
            <EmptyState text="No browser data yet" />
          )}
        </CollapsibleSection>

        {/* OS */}
        <CollapsibleSection title="Operating Systems" icon={Monitor} defaultOpen={true} badge={osTotal || undefined}>
          {data.osBreakdown.length > 0 ? (
            <div className="space-y-3">
              {data.osBreakdown.slice(0, 5).map((o, i) => {
                const pct = osTotal > 0 ? (o.count / osTotal) * 100 : 0;
                return (
                  <ProgressItem
                    key={o.os}
                    icon={Layers}
                    label={o.os}
                    value={o.count}
                    pct={pct}
                    color={CHART_COLORS[i % CHART_COLORS.length]}
                    delay={i * 100}
                  />
                );
              })}
            </div>
          ) : (
            <EmptyState text="No OS data yet" />
          )}
        </CollapsibleSection>
      </div>

      {/* ─── Geography & sources ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* Countries */}
        <CollapsibleSection title="Visitors by Country" icon={MapPin} badge={countryTotal || undefined}>
          {data.countryBreakdown && data.countryBreakdown.length > 0 ? (
            <div className="space-y-2">
              {data.countryBreakdown.map((c, i) => {
                const pct = countryTotal > 0 ? (c.count / countryTotal) * 100 : 0;
                return (
                  <div
                    key={c.country}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 transition-colors cursor-default group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Globe className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                      <span className="text-sm font-medium text-gray-700">{c.country}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-100 rounded-full h-1.5 hidden sm:block">
                        <div className="h-1.5 rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-sm font-bold text-gray-900 tabular-nums w-8 text-right">{c.count}</span>
                      <span className="text-[10px] text-gray-400 font-medium w-10 text-right">{pct.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={Globe} text="No country data yet" subtext="Geo data appears with real visitors" />
          )}
        </CollapsibleSection>

        {/* Referrers */}
        <CollapsibleSection title="Traffic Sources" icon={ExternalLink} badge={referrerTotal || undefined}>
          {data.referrers.length > 0 ? (
            <div className="space-y-3">
              {data.referrers.map((ref, i) => {
                const pct = referrerTotal > 0 ? (ref.count / referrerTotal) * 100 : 0;
                return (
                  <ProgressItem
                    key={ref.domain}
                    icon={ExternalLink}
                    label={ref.domain}
                    value={ref.count}
                    pct={pct}
                    color="#3b82f6"
                    delay={i * 80}
                  />
                );
              })}
            </div>
          ) : (
            <EmptyState icon={Globe} text="No referrer data yet" subtext="Data appears as visitors arrive from other sites" />
          )}
        </CollapsibleSection>

        {/* Tracked links / campaigns */}
        <CollapsibleSection
          title="Tracked Links"
          icon={Link2}
          badge={data.trackedLinks?.length || undefined}
        >
          {data.trackedLinks && data.trackedLinks.length > 0 ? (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    <th className="text-left py-2 px-3 sm:px-4">Link</th>
                    <th className="text-right py-2 px-2">Clicks</th>
                    <th className="text-right py-2 px-2 hidden sm:table-cell">Sessions</th>
                    <th className="text-right py-2 px-2">Orders</th>
                    <th className="text-right py-2 px-3 sm:px-4">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.trackedLinks.map((link) => (
                    <tr key={link.id} className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
                      <td className="py-3 px-3 sm:px-4">
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="font-semibold text-gray-900 text-sm truncate max-w-[180px] sm:max-w-none">{link.name}</span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold uppercase">{link.source}</span>
                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px]">{link.medium}</span>
                            <code className="text-[10px] text-gray-400 font-mono truncate hidden sm:inline">/r/{link.slug}</code>
                          </div>
                        </div>
                      </td>
                      <td className="text-right py-3 px-2 font-semibold text-gray-900 tabular-nums">
                        {link.clicks.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-2 text-gray-700 tabular-nums hidden sm:table-cell">
                        {link.uniqueSessions.toLocaleString()}
                      </td>
                      <td className={`text-right py-3 px-2 tabular-nums font-semibold ${link.orders > 0 ? "text-emerald-700" : "text-gray-400"}`}>
                        {link.orders.toLocaleString()}
                      </td>
                      <td className={`text-right py-3 px-3 sm:px-4 font-bold tabular-nums ${link.revenue > 0 ? "text-emerald-700" : "text-gray-400"}`}>
                        ${link.revenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[11px] text-gray-400 mt-3 px-3 sm:px-0">
                Showing only links with clicks in this date range. Manage links → <a href="/admin/links" className="text-blue-600 hover:underline">Link Tracking</a>
              </p>
            </div>
          ) : (
            <EmptyState
              icon={Link2}
              text="No tracked link clicks yet"
              subtext="Create short links in /admin/links and share them — clicks and revenue from each link will appear here."
            />
          )}
        </CollapsibleSection>
      </div>

      {/* ─── Inventory ─────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4">
        <CollapsibleSection title="Inventory" icon={ShoppingBag} badge={data.inventory.totalProducts}>
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
            {[
              { n: data.inventory.totalProducts, label: "Total", bg: "bg-gray-50", text: "text-gray-900" },
              { n: data.inventory.inStockProducts, label: "In Stock", bg: "bg-emerald-50", text: "text-emerald-600" },
              { n: data.inventory.soldOutProducts, label: "Sold Out", bg: "bg-red-50", text: "text-red-600" },
            ].map((s) => (
              <div
                key={s.label}
                className={`text-center p-2.5 sm:p-3 ${s.bg} rounded-xl hover:scale-[1.03] transition-transform cursor-default`}
              >
                <p className={`text-xl sm:text-2xl font-bold ${s.text} tabular-nums`}>
                  <AnimatedNumber value={s.n} />
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500 font-medium mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          {data.inventory.productsByCategory.length > 0 && (
            <div className="space-y-2.5">
              {data.inventory.productsByCategory.map((cat, i) => {
                const pct = data.inventory.totalProducts > 0 ? (cat.count / data.inventory.totalProducts) * 100 : 0;
                return (
                  <ProgressItem
                    key={cat.category}
                    icon={Layers}
                    label={cat.category}
                    value={cat.count}
                    pct={pct}
                    color={CHART_COLORS[i % CHART_COLORS.length]}
                    delay={i * 80}
                  />
                );
              })}
            </div>
          )}
        </CollapsibleSection>
      </div>

      {/* ─── Top products ─────────────────────────── */}

      {/* ─── Top products ───────────────────────────── */}
      <CollapsibleSection title="Top Viewed Products" icon={ShoppingBag} badge={data.topProducts.length || undefined}>
        {data.topProducts.length > 0 ? (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2.5 px-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">#</th>
                    <th className="text-left py-2.5 px-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Product</th>
                    <th className="text-left py-2.5 px-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Category</th>
                    <th className="text-left py-2.5 px-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Price</th>
                    <th className="text-left py-2.5 px-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Status</th>
                    <th className="text-right py-2.5 px-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Views</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topProducts.map((product, index) => (
                    <tr
                      key={product.id}
                      className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors cursor-default group"
                    >
                      <td className="py-2.5 px-3">
                        <span className={`text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                          index === 0 ? "bg-amber-100 text-amber-700" :
                          index === 1 ? "bg-gray-100 text-gray-500" :
                          index === 2 ? "bg-orange-100 text-orange-600" : "text-gray-400"
                        }`}>{index + 1}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 ring-1 ring-gray-200 group-hover:ring-blue-200 transition-all group-hover:scale-105">
                            <Image src={product.imageUrl} alt={product.title} fill className="object-cover" />
                          </div>
                          <span className="text-sm font-medium text-gray-900 truncate max-w-[180px]">{product.title}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">{product.category}</span>
                      </td>
                      <td className="py-2.5 px-3 hidden md:table-cell">
                        <span className="text-sm text-gray-600 tabular-nums">${product.priceLocal}</span>
                      </td>
                      <td className="py-2.5 px-3 hidden md:table-cell">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          product.isSoldOut ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-600"
                        }`}>
                          {product.isSoldOut ? "Sold Out" : "In Stock"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="text-sm font-bold text-gray-900 tabular-nums">{product.views.toLocaleString()}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden space-y-2">
              {data.topProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-all active:scale-[0.98] cursor-default"
                >
                  <span className={`text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    index === 0 ? "bg-amber-100 text-amber-700" :
                    index === 1 ? "bg-gray-100 text-gray-500" :
                    index === 2 ? "bg-orange-100 text-orange-600" : "text-gray-400"
                  }`}>{index + 1}</span>
                  <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 ring-1 ring-gray-200">
                    <Image src={product.imageUrl} alt={product.title} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{product.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-gray-400">{product.category}</span>
                      <span className={`text-[10px] font-semibold ${product.isSoldOut ? "text-red-500" : "text-emerald-500"}`}>
                        {product.isSoldOut ? "Sold Out" : "In Stock"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900 tabular-nums">{product.views}</p>
                    <p className="text-[10px] text-gray-400">views</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <EmptyState icon={ShoppingBag} text="No product views yet" subtext="Views appear once visitors browse products" />
        )}
      </CollapsibleSection>

      {/* ─── Orders Section ───────────────────────────── */}
      <CollapsibleSection
        title="Orders"
        icon={ShoppingBag}
        defaultOpen={true}
        badge={data.orders?.rangeOrders || undefined}
      >
        {data.orders && data.orders.rangeOrders > 0 ? (
          <>
            {/* Orders stats row */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-orange-50 rounded-lg p-3 text-center">
                <p className="text-xs text-orange-600 font-medium">Total Orders</p>
                <p className="text-lg font-bold text-orange-700">{data.orders.totalOrders}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-xs text-green-600 font-medium">This Period</p>
                <p className="text-lg font-bold text-green-700">{data.orders.rangeOrders}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-xs text-blue-600 font-medium">Unique Customers</p>
                <p className="text-lg font-bold text-blue-700">{data.orders.uniqueCustomers}</p>
              </div>
            </div>

            {/* Top ordered products */}
            {data.orders.topProducts.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Most Ordered Products</p>
                <div className="space-y-2">
                  {data.orders.topProducts.map((p, i) => {
                    const maxQty = data.orders.topProducts[0]?.totalQuantity || 1;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-400 w-5 text-right">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-gray-900 truncate">{p.title}</p>
                            <span className="text-xs font-semibold text-gray-600 ml-2 flex-shrink-0">
                              {p.totalQuantity} qty · {p.orders} orders
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div
                              className="bg-orange-400 h-1.5 rounded-full transition-all duration-700"
                              style={{ width: `${(p.totalQuantity / maxQty) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Orders by location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {data.orders.byCountry.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Orders by Country</p>
                  <div className="space-y-1.5">
                    {data.orders.byCountry.map((c, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{c.country}</span>
                        <span className="font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-xs">{c.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {data.orders.byCity.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Orders by City</p>
                  <div className="space-y-1.5">
                    {data.orders.byCity.map((c, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{c.city}</span>
                        <span className="font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-xs">{c.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Recent Checkout Orders */}
            {data.orders.recentCheckout && data.orders.recentCheckout.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Recent Checkout Orders</p>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {data.orders.recentCheckout.map((order, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg text-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${order.orderSource === "telegram" ? "bg-sky-100" : "bg-orange-100"}`}>
                            <ShoppingBag className={`w-4 h-4 ${order.orderSource === "telegram" ? "text-sky-600" : "text-orange-600"}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 text-xs truncate">
                              {order.firstName} {order.lastName}
                              <span className="font-normal text-gray-400 ml-1.5">#{order.orderNumber}</span>
                            </p>
                            <p className="text-[11px] text-gray-500 truncate">{order.email}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end flex-shrink-0">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            order.status === "delivered" ? "bg-green-100 text-green-700" :
                            order.status === "shipped" ? "bg-blue-100 text-blue-700" :
                            order.status === "confirmed" ? "bg-amber-100 text-amber-700" :
                            "bg-gray-100 text-gray-600"
                          }`}>
                            {order.status}
                          </span>
                          <span className="text-[10px] text-gray-400 mt-0.5">
                            {getTimeAgo(new Date(order.createdAt))}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-2 text-[11px] text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {order.ipCity || order.city}, {order.ipState || order.state}, {order.ipCountry || order.country}{order.ipZip ? ` ${order.ipZip}` : ""}
                        </span>
                        <span>·</span>
                        <span>{order.totalItems} item{order.totalItems !== 1 ? "s" : ""}</span>
                        <span>·</span>
                        <span className="capitalize">{order.paymentMethod}</span>
                        <span>·</span>
                        <span className={order.orderSource === "telegram" ? "text-sky-600" : "text-orange-600"}>
                          via {order.orderSource}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Cart Orders (tracking) */}
            {data.orders.recent.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Recent Cart Activity</p>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {data.orders.recent.map((order, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg text-sm">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ShoppingBag className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate text-xs">{order.productTitle}</p>
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-0.5 text-[11px] text-gray-500">
                          <span>{order.price} · {order.quantity}x</span>
                          <span className={order.deliveryType === "local" ? "text-green-600" : "text-blue-600"}>
                            {order.deliveryType === "local" ? "Local" : "Shipped"}
                          </span>
                          {(order.city || order.country) && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {[order.city, order.state, order.country].filter(Boolean).join(", ")}
                            </span>
                          )}
                          {order.device && <span>{order.device}</span>}
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-400 flex-shrink-0">
                        {getTimeAgo(new Date(order.createdAt))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <EmptyState icon={ShoppingBag} text="No orders yet" subtext="Orders appear when customers checkout via Telegram" />
        )}
      </CollapsibleSection>
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────

function EmptyState({
  icon: Icon = FileText,
  text,
  subtext,
}: {
  icon?: typeof FileText;
  text: string;
  subtext?: string;
}) {
  return (
    <div className="text-center py-6 sm:py-8">
      <Icon className="w-8 h-8 mx-auto mb-2 text-gray-200" />
      <p className="text-sm text-gray-400 font-medium">{text}</p>
      {subtext && <p className="text-xs text-gray-300 mt-1">{subtext}</p>}
    </div>
  );
}

// ─── Time ago ────────────────────────────────────────────

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}
