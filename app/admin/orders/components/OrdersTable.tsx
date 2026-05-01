"use client";

import { useState, useEffect } from "react";
import {
  Search, ChevronLeft, ChevronRight, Trash2, Package, MapPin, Mail,
  CreditCard, StickyNote, Loader2, RefreshCw, Send, Clock, User,
  ChevronDown, ChevronUp, Globe, Compass,
} from "lucide-react";
import CloudImage from "@/app/components/CloudImage";

interface OrderItem {
  id: string; title: string; category: string; imageUrl: string;
  price: string; quantity: number; deliveryType: string;
}

interface OrderAttribution {
  source: string;
  channel: "tracked-link" | "search" | "social" | "direct" | "internal" | "unknown";
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  campaignName: string | null;
  campaignSlug: string | null;
  promoterName: string | null;
  entryPage: string | null;
  refererDomain: string | null;
  pageViewCount: number;
  firstSeenAt: string | null;
  verdict: string;
}

interface Order {
  id: string; orderNumber: string; firstName: string; lastName: string;
  email: string; phone: string; address: string; apartment: string | null;
  city: string; state: string; zipCode: string; country: string;
  ipCountry: string | null; ipState: string | null; ipCity: string | null;
  ipZip: string | null; ipAddress: string | null;
  items: OrderItem[]; totalItems: number; paymentMethod: string;
  deliveryNotes: string | null; orderSource: string; status: string; createdAt: string;
  attribution?: OrderAttribution | null;
}

const CHANNEL_BADGE: Record<OrderAttribution["channel"], { label: string; bg: string; ring: string; dot: string }> = {
  "tracked-link": { label: "Tracked link", bg: "bg-emerald-50", ring: "border-emerald-200", dot: "bg-emerald-500" },
  search:         { label: "Search engine", bg: "bg-blue-50",    ring: "border-blue-200",    dot: "bg-blue-500" },
  social:         { label: "Social",        bg: "bg-purple-50",  ring: "border-purple-200",  dot: "bg-purple-500" },
  direct:         { label: "Direct",        bg: "bg-gray-50",    ring: "border-gray-200",    dot: "bg-gray-500" },
  internal:       { label: "Internal",      bg: "bg-amber-50",   ring: "border-amber-200",   dot: "bg-amber-500" },
  unknown:        { label: "Unknown",       bg: "bg-gray-50",    ring: "border-gray-200",    dot: "bg-gray-400" },
};

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending", color: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-400" },
  { value: "confirmed", label: "Confirmed", color: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-400" },
  { value: "shipped", label: "Shipped", color: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-400" },
  { value: "delivered", label: "Delivered", color: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-400" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-400" },
];

const PAY_LABEL: Record<string, string> = {
  cash: "Cash", zelle: "Zelle", cashapp: "CashApp", chime: "Chime", crypto: "Crypto", pending: "Pending",
};

const PER_PAGE = 15;

function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function calcTotal(items: OrderItem[]): string {
  let total = 0; let has = false;
  for (const item of items) {
    const m = item.price?.match(/\$?([\d,]+(?:\.\d+)?)/);
    if (m) { total += parseFloat(m[1].replace(",", "")) * (item.quantity || 1); has = true; }
  }
  return has ? `$${total.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}` : "TBD";
}

function StatusDot({ status }: { status: string }) {
  const opt = STATUS_OPTIONS.find((s) => s.value === status);
  return <span className={`w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-full flex-shrink-0 ${opt?.dot || "bg-gray-300"}`} />;
}

export default function OrdersTable() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try { const res = await fetch("/api/admin/orders"); if (res.ok) setOrders(await res.json()); } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleStatus = async (id: string, status: string) => {
    setUpdatingStatus(id);
    try {
      const res = await fetch("/api/admin/orders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
      if (res.ok) setOrders((p) => p.map((o) => o.id === id ? { ...o, status } : o));
    } catch {}
    setUpdatingStatus(null);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/orders?id=${id}`, { method: "DELETE" });
      if (res.ok) { setOrders((p) => p.filter((o) => o.id !== id)); setDeleteId(null); if (expandedId === id) setExpandedId(null); }
    } catch {}
  };

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    const match = !q || o.orderNumber.toLowerCase().includes(q) || `${o.firstName} ${o.lastName}`.toLowerCase().includes(q) || o.email.toLowerCase().includes(q) || o.city.toLowerCase().includes(q) || o.country.toLowerCase().includes(q);
    return match && (statusFilter === "all" || o.status === statusFilter);
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    confirmed: orders.filter((o) => o.status === "confirmed").length,
    shipped: orders.filter((o) => o.status === "shipped").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3 mb-5 lg:mb-6">
        {[
          { label: "All Orders", val: stats.total, bg: "bg-slate-900 text-white", filter: "all" },
          { label: "Pending", val: stats.pending, bg: "bg-amber-50 text-amber-700 border border-amber-200", filter: "pending" },
          { label: "Confirmed", val: stats.confirmed, bg: "bg-blue-50 text-blue-700 border border-blue-200", filter: "confirmed" },
          { label: "Shipped", val: stats.shipped, bg: "bg-purple-50 text-purple-700 border border-purple-200", filter: "shipped" },
          { label: "Delivered", val: stats.delivered, bg: "bg-green-50 text-green-700 border border-green-200", filter: "delivered" },
        ].map((s) => (
          <button
            key={s.filter}
            onClick={() => { setStatusFilter(s.filter); setPage(1); }}
            className={`rounded-xl px-3 py-3 lg:py-4 text-left transition-all ${
              statusFilter === s.filter ? `${s.bg} ring-2 ring-offset-1 ring-gray-300 shadow-sm` : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}
          >
            <p className="text-lg sm:text-xl lg:text-2xl font-bold">{s.val}</p>
            <p className="text-xs sm:text-sm font-medium opacity-80 mt-0.5">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-2 sm:gap-3 mb-4 lg:mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search name, email, order #, city, country..."
            className="w-full pl-10 lg:pl-12 pr-4 py-2.5 lg:py-3 border border-gray-200 rounded-xl text-sm lg:text-base focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all"
          />
        </div>
        <button onClick={fetchOrders} className="px-3 lg:px-4 border border-gray-200 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
          <RefreshCw className="w-4 h-4 lg:w-5 lg:h-5" />
        </button>
      </div>

      {/* Orders List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 text-center py-16 lg:py-20">
          <Package className="w-12 h-12 lg:w-14 lg:h-14 text-gray-200 mx-auto mb-3" />
          <p className="text-sm lg:text-base text-gray-400">No orders found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {paged.map((order, idx) => {
            const items = order.items as OrderItem[];
            const isExpanded = expandedId === order.id;
            const total = calcTotal(items);
            const isTg = order.orderSource === "telegram";
            const badge = STATUS_OPTIONS.find((s) => s.value === order.status);

            return (
              <div key={order.id} className={idx > 0 ? "border-t border-gray-100" : ""}>
                {/* Row */}
                <div className="px-4 py-3 lg:px-5 lg:py-4 cursor-pointer hover:bg-gray-50/60 transition-colors" onClick={() => setExpandedId(isExpanded ? null : order.id)}>
                  <div className="flex items-center gap-3 lg:gap-4">
                    <StatusDot status={order.status} />

                    {/* Name + Location */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm lg:text-base font-semibold text-gray-900 truncate">
                          {order.firstName} {order.lastName}
                        </span>
                        <span className="text-xs lg:text-sm text-gray-400 font-mono hidden sm:inline">#{order.orderNumber.slice(-8)}</span>
                        {isTg && <Send className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs lg:text-sm text-gray-400">
                        <Globe className="w-3 h-3 lg:w-3.5 lg:h-3.5 flex-shrink-0" />
                        <span className="truncate">
                          {order.ipCity || order.city}
                          {(order.ipState || order.state) ? `, ${order.ipState || order.state}` : ""}
                          {(order.ipCountry || order.country) ? `, ${order.ipCountry || order.country}` : ""}
                        </span>
                      </div>
                    </div>

                    {/* Total + Items */}
                    <div className="text-right flex-shrink-0 hidden sm:block">
                      <p className="text-sm lg:text-base font-bold text-gray-900">{total}</p>
                      <p className="text-xs lg:text-sm text-gray-400">{order.totalItems} item{order.totalItems !== 1 ? "s" : ""}</p>
                    </div>

                    {/* Status Badge */}
                    <span className={`hidden md:inline-flex px-2.5 py-1 rounded-full text-xs lg:text-sm font-semibold border flex-shrink-0 ${badge?.color || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                      {badge?.label || order.status}
                    </span>

                    {/* Payment */}
                    <span className="text-xs lg:text-sm font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg flex-shrink-0 hidden lg:inline">
                      {PAY_LABEL[order.paymentMethod] || order.paymentMethod}
                    </span>

                    {/* Time */}
                    <span className="text-xs lg:text-sm text-gray-400 flex-shrink-0 min-w-[50px] lg:min-w-[60px] text-right">{timeAgo(order.createdAt)}</span>

                    {isExpanded ? <ChevronUp className="w-4 h-4 lg:w-5 lg:h-5 text-gray-300 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 lg:w-5 lg:h-5 text-gray-300 flex-shrink-0" />}
                  </div>
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div className="bg-gray-50/80 px-4 pb-4 lg:px-5 lg:pb-5 space-y-3 lg:space-y-4">

                    {/* Info Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 lg:gap-3">
                      <div className="bg-white rounded-xl p-3 lg:p-4 border border-gray-100">
                        <div className="flex items-center gap-1.5 text-xs lg:text-sm text-gray-400 mb-1.5"><User className="w-3.5 h-3.5" /> Contact</div>
                        <p className="text-sm lg:text-base font-medium text-gray-900 truncate">{order.email}</p>
                        <p className="text-xs lg:text-sm text-gray-500 mt-0.5">{order.phone}</p>
                      </div>
                      <div className="bg-white rounded-xl p-3 lg:p-4 border border-gray-100">
                        <div className="flex items-center gap-1.5 text-xs lg:text-sm text-gray-400 mb-1.5"><Globe className="w-3.5 h-3.5" /> IP Location</div>
                        {order.ipCity || order.ipState || order.ipCountry ? (
                          <>
                            <p className="text-sm lg:text-base font-medium text-gray-900">
                              {[order.ipCity, order.ipState].filter(Boolean).join(", ")}
                            </p>
                            <p className="text-xs lg:text-sm text-gray-500 mt-0.5">
                              {order.ipCountry}{order.ipZip ? ` ${order.ipZip}` : ""}
                            </p>
                            {order.ipAddress && <p className="text-[10px] lg:text-xs text-gray-300 mt-0.5 font-mono">{order.ipAddress}</p>}
                          </>
                        ) : (
                          <p className="text-xs lg:text-sm text-gray-400 italic">Not available</p>
                        )}
                      </div>
                      <div className="bg-white rounded-xl p-3 lg:p-4 border border-gray-100">
                        <div className="flex items-center gap-1.5 text-xs lg:text-sm text-gray-400 mb-1.5"><CreditCard className="w-3.5 h-3.5" /> Payment</div>
                        <p className="text-sm lg:text-base font-medium text-gray-900">{PAY_LABEL[order.paymentMethod] || order.paymentMethod}</p>
                        <p className="text-xs lg:text-sm text-gray-500 mt-0.5">via {order.orderSource}</p>
                      </div>
                      <div className="bg-white rounded-xl p-3 lg:p-4 border border-gray-100">
                        <div className="flex items-center gap-1.5 text-xs lg:text-sm text-gray-400 mb-1.5"><Clock className="w-3.5 h-3.5" /> Date</div>
                        <p className="text-sm lg:text-base font-medium text-gray-900">{new Date(order.createdAt).toLocaleDateString()}</p>
                        <p className="text-xs lg:text-sm text-gray-500 mt-0.5">{new Date(order.createdAt).toLocaleTimeString()}</p>
                      </div>
                    </div>

                    {/* Source attribution — auto-traced from sessionId */}
                    {order.attribution && (
                      (() => {
                        const a = order.attribution;
                        const badge = CHANNEL_BADGE[a.channel] || CHANNEL_BADGE.unknown;
                        return (
                          <div className={`rounded-xl p-3 lg:p-4 border ${badge.bg} ${badge.ring}`}>
                            <div className="flex items-start gap-2.5">
                              <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                                <Compass className="w-4 h-4 text-slate-700" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs lg:text-sm font-semibold text-slate-900">Order source</span>
                                  <span className={`inline-flex items-center gap-1 text-[10px] lg:text-xs px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-700`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                                    {badge.label}
                                  </span>
                                  <span className="text-[11px] lg:text-xs font-medium text-slate-700">{a.source}</span>
                                </div>
                                <p className="text-xs lg:text-sm text-gray-700 mt-1.5 leading-relaxed">{a.verdict}</p>
                                {(a.utmSource || a.entryPage) && (
                                  <div className="mt-2 flex flex-wrap gap-1.5">
                                    {a.utmSource && (
                                      <span className="text-[10px] lg:text-xs px-1.5 py-0.5 rounded bg-white border border-gray-200 text-gray-600 font-mono">
                                        utm_source={a.utmSource}
                                      </span>
                                    )}
                                    {a.utmMedium && (
                                      <span className="text-[10px] lg:text-xs px-1.5 py-0.5 rounded bg-white border border-gray-200 text-gray-600 font-mono">
                                        utm_medium={a.utmMedium}
                                      </span>
                                    )}
                                    {a.utmCampaign && (
                                      <span className="text-[10px] lg:text-xs px-1.5 py-0.5 rounded bg-white border border-gray-200 text-gray-600 font-mono">
                                        utm_campaign={a.utmCampaign}
                                      </span>
                                    )}
                                    {a.campaignSlug && (
                                      <span className="text-[10px] lg:text-xs px-1.5 py-0.5 rounded bg-white border border-gray-200 text-gray-600 font-mono">
                                        /r/{a.campaignSlug}
                                      </span>
                                    )}
                                    {a.entryPage && (
                                      <span className="text-[10px] lg:text-xs px-1.5 py-0.5 rounded bg-white border border-gray-200 text-gray-600 font-mono truncate max-w-[260px]">
                                        landed: {a.entryPage}
                                      </span>
                                    )}
                                    {a.pageViewCount > 0 && (
                                      <span className="text-[10px] lg:text-xs px-1.5 py-0.5 rounded bg-white border border-gray-200 text-gray-600">
                                        {a.pageViewCount} page view{a.pageViewCount === 1 ? "" : "s"}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()
                    )}

                    {/* Items */}
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                      {items.map((item, i) => (
                        <div key={i} className={`flex items-center gap-3 lg:gap-4 px-3 py-2.5 lg:px-4 lg:py-3 ${i > 0 ? "border-t border-gray-50" : ""}`}>
                          <div className="relative w-10 h-10 lg:w-12 lg:h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            <CloudImage src={item.imageUrl} alt={item.title} fill sizes="48px" className="object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm lg:text-base font-medium text-gray-900 truncate">{item.title}</p>
                            <p className="text-xs lg:text-sm text-gray-400">{item.category}</p>
                          </div>
                          <span className="text-xs lg:text-sm text-gray-500 flex-shrink-0">{item.quantity}x</span>
                          <span className="text-sm lg:text-base font-bold text-gray-900 flex-shrink-0">{item.price}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between px-3 py-2.5 lg:px-4 lg:py-3 bg-gray-50 border-t border-gray-100">
                        <span className="text-xs lg:text-sm text-gray-500">{order.totalItems} items total</span>
                        <span className="text-base lg:text-lg font-bold text-slate-900">{total}</span>
                      </div>
                    </div>

                    {/* Notes */}
                    {order.deliveryNotes && (
                      <div className="bg-amber-50 rounded-xl p-3 lg:p-4 border border-amber-100">
                        <p className="text-xs lg:text-sm text-amber-700 flex items-center gap-1.5">
                          <StickyNote className="w-3.5 h-3.5 flex-shrink-0" /> {order.deliveryNotes}
                        </p>
                      </div>
                    )}

                    {/* Status Buttons + Delete */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex gap-1.5 lg:gap-2 flex-wrap">
                        {STATUS_OPTIONS.map((s) => (
                          <button
                            key={s.value}
                            onClick={() => handleStatus(order.id, s.value)}
                            disabled={updatingStatus === order.id}
                            className={`px-3 py-1.5 lg:px-4 lg:py-2 rounded-lg text-xs lg:text-sm font-semibold border transition-all ${
                              order.status === s.value
                                ? `${s.color} ring-2 ring-offset-1`
                                : "border-gray-200 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            } ${updatingStatus === order.id ? "opacity-40" : ""}`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteId(order.id); }}
                        className="p-2 lg:p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 lg:w-5 lg:h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 lg:mt-5 text-sm lg:text-base text-gray-400">
          <span>{(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}</span>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 hover:bg-white hover:shadow-sm rounded-lg disabled:opacity-30 border border-transparent hover:border-gray-200"><ChevronLeft className="w-4 h-4 lg:w-5 lg:h-5" /></button>
            <span className="text-sm lg:text-base font-medium text-gray-600 px-3">{page} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 hover:bg-white hover:shadow-sm rounded-lg disabled:opacity-30 border border-transparent hover:border-gray-200"><ChevronRight className="w-4 h-4 lg:w-5 lg:h-5" /></button>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 lg:p-8 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 lg:w-14 lg:h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 lg:w-7 lg:h-7 text-red-600" />
            </div>
            <p className="text-base lg:text-lg font-semibold text-gray-900 mb-1">Delete this order?</p>
            <p className="text-sm lg:text-base text-gray-500 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 lg:py-3 border border-gray-200 rounded-xl text-sm lg:text-base font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 lg:py-3 bg-red-600 text-white rounded-xl text-sm lg:text-base font-medium hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
