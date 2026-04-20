"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Loader2,
  Search,
  Trash2,
  Download,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  Globe,
  Smartphone,
  Laptop,
  Tablet,
} from "lucide-react";

interface Subscriber {
  id: string;
  email: string;
  active: boolean;
  source: string | null;
  country: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  confirmedAt: string | null;
  createdAt: string;
}

interface ListResponse {
  items: Subscriber[];
  total: number;
  activeCount: number;
  page: number;
  perPage: number;
  totalPages: number;
}

function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function DeviceIcon({ device }: { device: string | null }) {
  if (device === "mobile") return <Smartphone className="w-3 h-3" />;
  if (device === "tablet") return <Tablet className="w-3 h-3" />;
  return <Laptop className="w-3 h-3" />;
}

export default function AdminNewsletterPage() {
  const router = useRouter();
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | "active" | "inactive">("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    params.set("page", String(page));
    try {
      const res = await fetch(`/api/admin/newsletter?${params.toString()}`);
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const json = (await res.json()) as ListResponse;
      setData(json);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [q, status, page, router]);

  useEffect(() => {
    load();
  }, [load]);

  const total = data?.total ?? 0;
  const activeCount = data?.activeCount ?? 0;

  async function toggleActive(s: Subscriber) {
    setBusyId(s.id);
    try {
      const res = await fetch(`/api/admin/newsletter/${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !s.active }),
      });
      if (res.ok) {
        setData((d) =>
          d ? { ...d, items: d.items.map((x) => (x.id === s.id ? { ...x, active: !x.active } : x)) } : d
        );
      }
    } catch {
      /* ignore */
    } finally {
      setBusyId(null);
    }
  }

  async function remove(s: Subscriber) {
    if (!confirm(`Permanently delete ${s.email}?`)) return;
    setBusyId(s.id);
    try {
      const res = await fetch(`/api/admin/newsletter/${s.id}`, { method: "DELETE" });
      if (res.ok) {
        setData((d) =>
          d ? { ...d, items: d.items.filter((x) => x.id !== s.id), total: Math.max(0, d.total - 1) } : d
        );
      }
    } catch {
      /* ignore */
    } finally {
      setBusyId(null);
    }
  }

  function exportCsv() {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    params.set("format", "csv");
    window.location.href = `/api/admin/newsletter?${params.toString()}`;
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-3 mb-5 lg:mb-6 flex-col sm:flex-row">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Newsletter Subscribers</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            {total.toLocaleString()} total · {activeCount.toLocaleString()} active
          </p>
        </div>
        <button
          onClick={exportCsv}
          disabled={total === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium uppercase tracking-wide">
            <Mail className="w-3.5 h-3.5" /> Total
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{total.toLocaleString()}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium uppercase tracking-wide">
            <UserCheck className="w-3.5 h-3.5" /> Active
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{activeCount.toLocaleString()}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 text-xs text-gray-400 font-medium uppercase tracking-wide">
            <UserX className="w-3.5 h-3.5" /> Inactive
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {Math.max(0, total - activeCount).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 mb-4 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
            placeholder="Search by email…"
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:bg-white focus:border-gray-300"
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value as "" | "active" | "inactive");
          }}
          className="h-10 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:bg-white"
        >
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* List */}
      {loading && !data ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
          <Mail className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-sm text-gray-500">
            {q || status ? "No subscribers match this filter." : "No subscribers yet."}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3">Location / Device</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.items.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900 break-all">{s.email}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            s.active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {s.active ? "Active" : "Unsubscribed"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 capitalize">{s.source || "—"}</td>
                      <td className="px-4 py-3 text-gray-500">
                        <div className="flex items-center gap-3 flex-wrap">
                          {s.country && (
                            <span className="inline-flex items-center gap-1 text-xs">
                              <Globe className="w-3 h-3" /> {s.country}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 text-xs">
                            <DeviceIcon device={s.device} />
                            {[s.browser, s.os].filter(Boolean).join(" · ") || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{timeAgo(s.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => toggleActive(s)}
                            disabled={busyId === s.id}
                            title={s.active ? "Mark unsubscribed" : "Reactivate"}
                            className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                              s.active
                                ? "text-gray-400 hover:text-amber-600 hover:bg-amber-50"
                                : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"
                            }`}
                          >
                            {busyId === s.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : s.active ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => remove(s)}
                            disabled={busyId === s.id}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {data.items.map((s) => (
                <div key={s.id} className="p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm break-all">{s.email}</div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                          s.active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {s.active ? "Active" : "Unsubscribed"}
                      </span>
                      <span className="text-[11px] text-gray-400">{timeAgo(s.createdAt)}</span>
                      {s.country && <span className="text-[11px] text-gray-400">· {s.country}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => toggleActive(s)}
                      disabled={busyId === s.id}
                      className={`p-2 rounded-lg ${
                        s.active ? "text-gray-400 hover:text-amber-600" : "text-gray-400 hover:text-emerald-600"
                      }`}
                    >
                      {busyId === s.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : s.active ? (
                        <UserX className="w-4 h-4" />
                      ) : (
                        <UserCheck className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => remove(s)}
                      disabled={busyId === s.id}
                      className="p-2 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-xs text-gray-500">
                Page {data.page} of {data.totalPages}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={data.page <= 1}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={data.page >= data.totalPages}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
