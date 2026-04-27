"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Smartphone, Bell, Users, Gift, Globe, Monitor, Loader2, Clock, CheckCircle2 } from "lucide-react";

interface PwaData {
  stats: {
    totalInstalls: number;
    totalSubscribers: number;
    activeSubscribers: number;
    inactiveSubscribers: number;
    discountsUsed: number;
    discountsAvailable: number;
    activeInstalls7d: number;
    activeInstalls30d: number;
  };
  recentInstalls: Array<{ id: string; sessionId: string; device: string | null; browser: string | null; os: string | null; country: string | null; discountUsed: boolean; createdAt: string }>;
  recentSubscribers: Array<{ id: string; device: string | null; browser: string | null; os: string | null; country: string | null; createdAt: string }>;
  installsByDevice: Array<{ device: string; count: number }>;
  installsByCountry: Array<{ country: string; count: number }>;
  activeInstallsByCountry: Array<{ country: string; count: number }>;
  activeInstallsByDevice: Array<{ device: string; count: number }>;
}

function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return "Just now";
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function PwaTrackingPage() {
  const router = useRouter();
  const [data, setData] = useState<PwaData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/pwa")
      .then((r) => { if (r.status === 401) { router.push("/admin/login"); return null; } return r.json(); })
      .then((d) => { if (d && !d.error) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 text-gray-400 animate-spin" /></div>;
  if (!data) return <div className="text-center py-20 text-gray-500">Failed to load data</div>;

  const { stats } = data;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">PWA & Notifications</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Track app installs, push subscribers, and discount usage</p>
      </div>

      {/* Currently Installed — flagship metric */}
      <div className="mb-5 rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-emerald-50 border border-emerald-200 p-5 lg:p-6">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Still Installed</p>
            <div className="flex items-baseline gap-3 mt-1 flex-wrap">
              <p className="text-3xl lg:text-4xl font-bold text-gray-900">{stats.activeInstalls30d}</p>
              <p className="text-sm text-gray-500">devices opened the app in the last 30 days</p>
            </div>
            <p className="text-xs text-gray-500 mt-1.5">
              <span className="font-semibold text-gray-700">{stats.activeInstalls7d}</span> active in the last 7 days
              {" · "}
              <span className="font-semibold text-gray-700">{stats.totalInstalls}</span> all-time installs
              {stats.totalInstalls > 0 && (
                <span className="text-gray-400">
                  {" · retention: "}
                  <span className="font-semibold text-gray-700">{Math.round((stats.activeInstalls30d / stats.totalInstalls) * 100)}%</span>
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: "Installs", val: stats.totalInstalls, icon: Smartphone, bg: "bg-blue-50 text-blue-700" },
          { label: "Subscribers", val: stats.activeSubscribers, icon: Bell, bg: "bg-green-50 text-green-700" },
          { label: "Inactive", val: stats.inactiveSubscribers, icon: Bell, bg: "bg-gray-100 text-gray-500" },
          { label: "Total Subs", val: stats.totalSubscribers, icon: Users, bg: "bg-purple-50 text-purple-700" },
          { label: "Discounts Used", val: stats.discountsUsed, icon: Gift, bg: "bg-amber-50 text-amber-700" },
          { label: "Available", val: stats.discountsAvailable, icon: Gift, bg: "bg-emerald-50 text-emerald-700" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl p-3 lg:p-4 ${s.bg}`}>
            <s.icon className="w-5 h-5 mb-2 opacity-60" />
            <p className="text-xl lg:text-2xl font-bold">{s.val}</p>
            <p className="text-xs font-medium opacity-70">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Still Installed by Country (active 30d) */}
        {data.activeInstallsByCountry.length > 0 && (
          <div className="bg-white border border-emerald-200 rounded-xl p-4 lg:p-5">
            <h2 className="text-sm lg:text-base font-bold text-gray-900 mb-1 flex items-center gap-2"><Globe className="w-4 h-4 text-emerald-600" /> Still Installed by Country</h2>
            <p className="text-[11px] text-gray-500 mb-3">Devices that opened the app in the last 30 days</p>
            <div className="space-y-2">
              {data.activeInstallsByCountry.map((c) => (
                <div key={c.country} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{c.country}</span>
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs">{c.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Still Installed by Device (active 30d) */}
        {data.activeInstallsByDevice.length > 0 && (
          <div className="bg-white border border-emerald-200 rounded-xl p-4 lg:p-5">
            <h2 className="text-sm lg:text-base font-bold text-gray-900 mb-1 flex items-center gap-2"><Monitor className="w-4 h-4 text-emerald-600" /> Still Installed by Device</h2>
            <p className="text-[11px] text-gray-500 mb-3">Active devices in the last 30 days</p>
            <div className="space-y-2">
              {data.activeInstallsByDevice.map((d) => (
                <div key={d.device} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 capitalize">{d.device}</span>
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All-time installs by Device */}
        {data.installsByDevice.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 lg:p-5">
            <h2 className="text-sm lg:text-base font-bold text-gray-900 mb-1 flex items-center gap-2"><Monitor className="w-4 h-4" /> All-Time Installs by Device</h2>
            <p className="text-[11px] text-gray-500 mb-3">Lifetime — includes uninstalled</p>
            <div className="space-y-2">
              {data.installsByDevice.map((d) => (
                <div key={d.device} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 capitalize">{d.device}</span>
                  <span className="font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-xs">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All-time installs by Country */}
        {data.installsByCountry.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 lg:p-5">
            <h2 className="text-sm lg:text-base font-bold text-gray-900 mb-1 flex items-center gap-2"><Globe className="w-4 h-4" /> All-Time Installs by Country</h2>
            <p className="text-[11px] text-gray-500 mb-3">Lifetime — includes uninstalled</p>
            <div className="space-y-2">
              {data.installsByCountry.map((c) => (
                <div key={c.country} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{c.country}</span>
                  <span className="font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-xs">{c.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Installs */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 lg:p-5">
          <h2 className="text-sm lg:text-base font-bold text-gray-900 mb-3 flex items-center gap-2"><Smartphone className="w-4 h-4" /> Recent Installs</h2>
          {data.recentInstalls.length === 0 ? (
            <p className="text-sm text-gray-400">No installs yet</p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {data.recentInstalls.map((i) => (
                <div key={i.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs font-medium text-gray-900">{i.device} &middot; {i.browser} &middot; {i.os}</p>
                    <p className="text-[11px] text-gray-400">{i.country || "Unknown"} &middot; <Clock className="w-2.5 h-2.5 inline" /> {timeAgo(i.createdAt)}</p>
                  </div>
                  {i.discountUsed && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Used</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Subscribers */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 lg:p-5">
          <h2 className="text-sm lg:text-base font-bold text-gray-900 mb-3 flex items-center gap-2"><Bell className="w-4 h-4" /> Recent Subscribers</h2>
          {data.recentSubscribers.length === 0 ? (
            <p className="text-sm text-gray-400">No subscribers yet</p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {data.recentSubscribers.map((s) => (
                <div key={s.id} className="text-sm p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-900">{s.device} &middot; {s.browser} &middot; {s.os}</p>
                  <p className="text-[11px] text-gray-400">{s.country || "Unknown"} &middot; <Clock className="w-2.5 h-2.5 inline" /> {timeAgo(s.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
