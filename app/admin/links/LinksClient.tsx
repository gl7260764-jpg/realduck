"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Link2, Plus, Copy, Check, Trash2, ExternalLink, TrendingUp,
  MousePointerClick, ShoppingBag, DollarSign, Loader2, AlertCircle,
  Instagram, Facebook, Send, Globe, Mail as MailIcon, Twitter,
} from "lucide-react";

interface Campaign {
  id: string;
  slug: string;
  name: string;
  destination: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  createdAt: string;
  shareUrl: string;
  stats: {
    clicks: number;
    uniqueSessions: number;
    orders: number;
    revenue: number;
    conversionRate: number;
  };
}

const SOURCE_PRESETS = [
  { label: "Instagram", value: "instagram", medium: "social", icon: Instagram, color: "from-pink-500 to-rose-500" },
  { label: "Facebook", value: "facebook", medium: "social", icon: Facebook, color: "from-blue-600 to-blue-700" },
  { label: "Telegram", value: "telegram", medium: "social", icon: Send, color: "from-sky-500 to-sky-600" },
  { label: "Snapchat", value: "snapchat", medium: "social", icon: Send, color: "from-yellow-400 to-yellow-500" },
  { label: "Twitter/X", value: "twitter", medium: "social", icon: Twitter, color: "from-slate-800 to-black" },
  { label: "TikTok", value: "tiktok", medium: "social", icon: Send, color: "from-pink-500 to-cyan-500" },
  { label: "Reddit", value: "reddit", medium: "social", icon: Globe, color: "from-orange-500 to-red-500" },
  { label: "Email", value: "newsletter", medium: "email", icon: MailIcon, color: "from-violet-500 to-purple-600" },
  { label: "Referral", value: "referral", medium: "referral", icon: ExternalLink, color: "from-emerald-500 to-green-600" },
];

function fmt(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function LinksClient() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [destination, setDestination] = useState("/");
  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("social");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [utmContent, setUtmContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/campaigns");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setCampaigns(data.campaigns || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const applyPreset = (preset: typeof SOURCE_PRESETS[number]) => {
    setUtmSource(preset.value);
    setUtmMedium(preset.medium);
    if (!name) setName(`${preset.label} — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim() || undefined,
          destination: destination.trim() || "/",
          utmSource: utmSource.trim().toLowerCase(),
          utmMedium: utmMedium.trim().toLowerCase(),
          utmCampaign: utmCampaign.trim().toLowerCase() || undefined,
          utmContent: utmContent.trim().toLowerCase() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create");
      // Reset
      setName(""); setSlug(""); setDestination("/"); setUtmSource("");
      setUtmMedium("social"); setUtmCampaign(""); setUtmContent("");
      setShowForm(false);
      await load();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm("Archive this link? Existing click + revenue data will be preserved but the short link will stop redirecting.")) return;
    try {
      await fetch(`/api/admin/campaigns/${id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleCopy = async (url: string, slug: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 1500);
    } catch {}
  };

  const totals = campaigns.reduce(
    (acc, c) => ({
      clicks: acc.clicks + c.stats.clicks,
      sessions: acc.sessions + c.stats.uniqueSessions,
      orders: acc.orders + c.stats.orders,
      revenue: acc.revenue + c.stats.revenue,
    }),
    { clicks: 0, sessions: 0, orders: 0, revenue: 0 }
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Link2 className="w-7 h-7 text-blue-600" />
            Link Tracking
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Generate trackable short links for your social posts. See exactly which channel drives clicks, signups, and revenue.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-sm shadow-sm whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> New Link
        </button>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard icon={MousePointerClick} label="Total Clicks" value={totals.clicks.toLocaleString()} color="blue" />
        <StatCard icon={TrendingUp} label="Unique Sessions" value={totals.sessions.toLocaleString()} color="violet" />
        <StatCard icon={ShoppingBag} label="Orders" value={totals.orders.toLocaleString()} color="emerald" />
        <StatCard icon={DollarSign} label="Revenue" value={fmt(totals.revenue)} color="amber" />
      </div>

      {/* New link form */}
      {showForm && (
        <div className="mb-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Create new tracked link</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-700 text-sm">Cancel</button>
          </div>

          {/* Quick source presets */}
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Quick start</p>
          <div className="flex flex-wrap gap-2 mb-5">
            {SOURCE_PRESETS.map((p) => {
              const Icon = p.icon;
              const active = utmSource === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                    active
                      ? `bg-gradient-to-r ${p.color} text-white border-transparent shadow-md`
                      : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {p.label}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Link name (for your reference only)" required>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Instagram Bio Link — Sept 2024"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition-all" />
            </Field>

            <Field label="Short slug (optional — auto if empty)">
              <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)}
                placeholder="ig-bio"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition-all" />
              <p className="text-[11px] text-gray-400 mt-1">Becomes /r/&lt;slug&gt; on your domain</p>
            </Field>

            <Field label="Destination on your site" required>
              <input type="text" value={destination} onChange={(e) => setDestination(e.target.value)}
                placeholder="/  or  /product/raspberry-airheadz"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition-all" />
              <p className="text-[11px] text-gray-400 mt-1">Path only — visitors land here after clicking</p>
            </Field>

            <Field label="UTM source" required>
              <input type="text" value={utmSource} onChange={(e) => setUtmSource(e.target.value)}
                placeholder="instagram"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition-all" />
            </Field>

            <Field label="UTM medium" required>
              <input type="text" value={utmMedium} onChange={(e) => setUtmMedium(e.target.value)}
                placeholder="social"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition-all" />
              <p className="text-[11px] text-gray-400 mt-1">social, email, referral, cpc</p>
            </Field>

            <Field label="UTM campaign (optional)">
              <input type="text" value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)}
                placeholder="raspberry-launch"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition-all" />
            </Field>

            <Field label="UTM content (optional)">
              <input type="text" value={utmContent} onChange={(e) => setUtmContent(e.target.value)}
                placeholder="story-link"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition-all" />
              <p className="text-[11px] text-gray-400 mt-1">Use to A/B test variants of the same campaign</p>
            </Field>

            {formError && (
              <div className="sm:col-span-2 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <p className="text-sm text-red-700">{formError}</p>
              </div>
            )}

            <div className="sm:col-span-2 flex justify-end">
              <button type="submit" disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-xl font-semibold text-sm">
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : <><Plus className="w-4 h-4" /> Create link</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16 px-6 bg-white rounded-2xl border border-dashed border-gray-300">
          <Link2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900 mb-1">No tracked links yet</h3>
          <p className="text-sm text-gray-500 mb-5">Create your first link to start tracking which channels drive paying customers.</p>
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-semibold text-sm">
            <Plus className="w-4 h-4" /> Create your first link
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <CampaignRow key={c.id}
              campaign={c}
              copied={copiedSlug === c.slug}
              onCopy={() => handleCopy(c.shareUrl, c.slug)}
              onArchive={() => handleArchive(c.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── helpers ────────────────────────────────────────────────────────────

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: typeof MousePointerClick; label: string; value: string;
  color: "blue" | "violet" | "emerald" | "amber";
}) {
  const colors = {
    blue: "from-blue-500 to-blue-600",
    violet: "from-violet-500 to-purple-600",
    emerald: "from-emerald-500 to-green-600",
    amber: "from-amber-500 to-orange-500",
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center shadow-sm mb-3`}>
        <Icon className="w-4.5 h-4.5 text-white" />
      </div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
    </div>
  );
}

function CampaignRow({ campaign, copied, onCopy, onArchive }: {
  campaign: Campaign; copied: boolean; onCopy: () => void; onArchive: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-gray-900 truncate">{campaign.name}</h3>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                {campaign.utmSource}
              </span>
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[10px] font-medium">
                {campaign.utmMedium}
              </span>
            </div>
            <p className="text-xs text-gray-500 font-mono truncate">→ {campaign.destination}</p>
          </div>
          <button onClick={onArchive} className="text-gray-400 hover:text-red-500 p-2 -m-2 transition-colors flex-shrink-0">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Share URL */}
        <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl mb-3">
          <code className="flex-1 text-xs sm:text-sm font-mono text-slate-700 truncate">{campaign.shareUrl}</code>
          <button onClick={onCopy}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              copied ? "bg-emerald-500 text-white" : "bg-slate-900 hover:bg-slate-800 text-white"
            }`}>
            {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
          </button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-2">
          <MiniStat label="Clicks" value={campaign.stats.clicks.toLocaleString()} />
          <MiniStat label="Sessions" value={campaign.stats.uniqueSessions.toLocaleString()} />
          <MiniStat label="Orders" value={campaign.stats.orders.toLocaleString()} highlight={campaign.stats.orders > 0} />
          <MiniStat label="Revenue" value={fmt(campaign.stats.revenue)} highlight={campaign.stats.revenue > 0} />
        </div>

        {campaign.stats.uniqueSessions > 0 && (
          <p className="text-[11px] text-gray-400 mt-2 text-center">
            Conversion rate: <strong className="text-gray-700">{campaign.stats.conversionRate}%</strong>
            {" · "}
            <span>{campaign.stats.orders} orders from {campaign.stats.uniqueSessions} unique sessions</span>
          </p>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`p-2.5 rounded-lg text-center ${highlight ? "bg-emerald-50 border border-emerald-200" : "bg-gray-50"}`}>
      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
      <p className={`text-sm sm:text-base font-bold ${highlight ? "text-emerald-700" : "text-gray-900"}`}>{value}</p>
    </div>
  );
}
