"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Link2, Plus, Copy, Check, Trash2, ExternalLink, TrendingUp,
  MousePointerClick, ShoppingBag, DollarSign, Loader2, AlertCircle,
  Instagram, Facebook, Send, Globe, Mail as MailIcon, Twitter,
  Users, ChevronDown, ChevronRight, UserPlus,
} from "lucide-react";

interface Promoter {
  id: string;
  slug: string;
  name: string;
  email: string | null;
  notes: string | null;
  defaultLink: string;
  campaigns: PromoterCampaign[];
  totals: { clicks: number; uniqueSessions: number; orders: number; revenue: number; campaignCount: number };
}
interface PromoterCampaign {
  id: string;
  slug: string;
  name: string;
  purpose: string | null;
  source: string;
  medium: string;
  destination: string;
  shareUrl: string;
  stats: { clicks: number; uniqueSessions: number; orders: number; revenue: number };
}

interface Campaign {
  id: string;
  slug: string;
  name: string;
  purpose: string | null;
  destination: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  promoter: { id: string; name: string; slug: string } | null;
  createdAt: string;
  shareUrl: string;
  stats: { clicks: number; uniqueSessions: number; orders: number; revenue: number; conversionRate: number };
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
];

const fmt = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function LinksClient() {
  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [expandedPromoters, setExpandedPromoters] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [pRes, cRes] = await Promise.all([
        fetch("/api/admin/promoters"),
        fetch("/api/admin/campaigns"),
      ]);
      const pData = await pRes.json();
      const cData = await cRes.json();
      if (!pRes.ok) throw new Error(pData.error || "Failed to load promoters");
      if (!cRes.ok) throw new Error(cData.error || "Failed to load links");
      setPromoters(pData.promoters || []);
      setCampaigns(cData.campaigns || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCopy = async (url: string, slug: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 1500);
    } catch {}
  };

  const togglePromoter = (id: string) => {
    setExpandedPromoters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const teamTotals = promoters.reduce(
    (acc, p) => ({
      clicks: acc.clicks + p.totals.clicks,
      sessions: acc.sessions + p.totals.uniqueSessions,
      orders: acc.orders + p.totals.orders,
      revenue: acc.revenue + p.totals.revenue,
    }),
    { clicks: 0, sessions: 0, orders: 0, revenue: 0 }
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Link2 className="w-7 h-7 text-blue-600" />
          Link Tracking
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Each team member has a personal link. Add more links per person and assign each one a purpose. Every order traces back to whoever drove the click.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      )}

      {/* Team totals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={MousePointerClick} label="Total Clicks" value={teamTotals.clicks.toLocaleString()} color="blue" />
        <StatCard icon={TrendingUp} label="Unique Sessions" value={teamTotals.sessions.toLocaleString()} color="violet" />
        <StatCard icon={ShoppingBag} label="Orders" value={teamTotals.orders.toLocaleString()} color="emerald" />
        <StatCard icon={DollarSign} label="Revenue" value={fmt(teamTotals.revenue)} color="amber" />
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}

      {!loading && (
        <>
          {/* ─── Promoters Section ─── */}
          <PromotersSection
            promoters={promoters}
            campaigns={campaigns}
            expanded={expandedPromoters}
            onToggle={togglePromoter}
            onCopy={handleCopy}
            copiedSlug={copiedSlug}
            onReload={load}
          />

          {/* ─── Standalone Links Section (no promoter assigned) ─── */}
          <StandaloneLinksSection
            campaigns={campaigns.filter((c) => !c.promoter)}
            promoters={promoters}
            onCopy={handleCopy}
            copiedSlug={copiedSlug}
            onReload={load}
          />
        </>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// PROMOTERS SECTION
// ════════════════════════════════════════════════════════════════════════

function PromotersSection({
  promoters, campaigns, expanded, onToggle, onCopy, copiedSlug, onReload,
}: {
  promoters: Promoter[];
  campaigns: Campaign[];
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onCopy: (url: string, slug: string) => void;
  copiedSlug: string | null;
  onReload: () => Promise<void>;
}) {
  const [showAddPromoter, setShowAddPromoter] = useState(false);
  const [showAddLinkFor, setShowAddLinkFor] = useState<string | null>(null);

  return (
    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <Users className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Team members</h2>
            <p className="text-xs text-gray-500">Each member gets a personal link they can share anywhere</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddPromoter(!showAddPromoter)}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap"
        >
          <UserPlus className="w-4 h-4" /> Add member
        </button>
      </div>

      {showAddPromoter && (
        <AddPromoterForm
          onSave={async () => { await onReload(); setShowAddPromoter(false); }}
          onCancel={() => setShowAddPromoter(false)}
        />
      )}

      {promoters.length === 0 && !showAddPromoter && (
        <EmptyPromoters onAdd={() => setShowAddPromoter(true)} />
      )}

      <div className="divide-y divide-gray-100">
        {promoters.map((p) => (
          <PromoterRow
            key={p.id}
            promoter={p}
            isExpanded={expanded.has(p.id)}
            onToggle={() => onToggle(p.id)}
            onCopy={onCopy}
            copiedSlug={copiedSlug}
            onAddLink={() => setShowAddLinkFor(p.id)}
            onReload={onReload}
            showAddLink={showAddLinkFor === p.id}
            onCancelAddLink={() => setShowAddLinkFor(null)}
          />
        ))}
      </div>
    </section>
  );
}

function PromoterRow({
  promoter, isExpanded, onToggle, onCopy, copiedSlug, onAddLink, onReload,
  showAddLink, onCancelAddLink,
}: {
  promoter: Promoter;
  isExpanded: boolean;
  onToggle: () => void;
  onCopy: (url: string, slug: string) => void;
  copiedSlug: string | null;
  onAddLink: () => void;
  onReload: () => Promise<void>;
  showAddLink: boolean;
  onCancelAddLink: () => void;
}) {
  const [archiving, setArchiving] = useState(false);

  const handleArchive = async () => {
    if (!confirm(`Archive ${promoter.name}? All their links will stop redirecting (history is preserved).`)) return;
    setArchiving(true);
    try {
      await fetch(`/api/admin/promoters/${promoter.id}`, { method: "DELETE" });
      await onReload();
    } finally {
      setArchiving(false);
    }
  };

  return (
    <div>
      {/* Row header */}
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggle}
            aria-label={isExpanded ? "Collapse promoter" : "Expand promoter"}
            className="flex-shrink-0 text-gray-400 hover:text-gray-700"
          >
            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {promoter.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-gray-900 truncate">{promoter.name}</h3>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold uppercase">
                {promoter.totals.campaignCount} link{promoter.totals.campaignCount === 1 ? "" : "s"}
              </span>
            </div>
            {promoter.email && <p className="text-[11px] text-gray-400 truncate">{promoter.email}</p>}
          </div>
          <button
            type="button"
            onClick={handleArchive}
            disabled={archiving}
            aria-label={`Archive ${promoter.name}`}
            title={`Archive ${promoter.name}`}
            className="text-gray-400 hover:text-red-500 p-2 -m-2 transition-colors flex-shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Personal default link */}
        <div className="flex items-center gap-2 mt-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/60 rounded-xl">
          <div>
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Personal link</p>
            <code className="text-xs sm:text-sm font-mono text-slate-800 block truncate max-w-[180px] sm:max-w-none">{promoter.defaultLink}</code>
          </div>
          <button
            onClick={() => onCopy(promoter.defaultLink, `default-${promoter.slug}`)}
            className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              copiedSlug === `default-${promoter.slug}` ? "bg-emerald-500 text-white" : "bg-slate-900 hover:bg-slate-800 text-white"
            }`}
          >
            {copiedSlug === `default-${promoter.slug}` ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
          </button>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-4 gap-2 mt-3">
          <MiniStat label="Clicks" value={promoter.totals.clicks.toLocaleString()} />
          <MiniStat label="Sessions" value={promoter.totals.uniqueSessions.toLocaleString()} />
          <MiniStat label="Orders" value={promoter.totals.orders.toLocaleString()} highlight={promoter.totals.orders > 0} />
          <MiniStat label="Revenue" value={fmt(promoter.totals.revenue)} highlight={promoter.totals.revenue > 0} />
        </div>
      </div>

      {/* Expanded: per-link breakdown */}
      {isExpanded && (
        <div className="bg-gray-50/60 px-4 sm:px-5 py-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">All links assigned to {promoter.name}</p>
            <button
              type="button"
              onClick={onAddLink}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-gray-300 hover:border-slate-900 text-slate-900 rounded-lg text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" /> Add link
            </button>
          </div>

          {showAddLink && (
            <AddLinkForm
              defaultPromoterId={promoter.id}
              onSave={async () => { await onReload(); onCancelAddLink(); }}
              onCancel={onCancelAddLink}
              hidePromoterDropdown
            />
          )}

          <div className="space-y-2">
            {promoter.campaigns.map((c) => (
              <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-3">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-semibold text-sm text-gray-900 truncate">{c.name}</span>
                      <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[9px] font-bold uppercase">{c.source}</span>
                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[9px]">{c.medium}</span>
                    </div>
                    {c.purpose && <p className="text-[11px] text-gray-500 italic">{c.purpose}</p>}
                    <p className="text-[11px] text-gray-400 font-mono truncate">→ {c.destination}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg mb-2">
                  <code className="flex-1 text-[11px] sm:text-xs font-mono text-slate-700 truncate">{c.shareUrl}</code>
                  <button
                    onClick={() => onCopy(c.shareUrl, c.slug)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold whitespace-nowrap ${
                      copiedSlug === c.slug ? "bg-emerald-500 text-white" : "bg-slate-900 hover:bg-slate-800 text-white"
                    }`}
                  >
                    {copiedSlug === c.slug ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-1.5 text-center">
                  <MiniInline label="Clicks" value={c.stats.clicks.toLocaleString()} />
                  <MiniInline label="Sessions" value={c.stats.uniqueSessions.toLocaleString()} />
                  <MiniInline label="Orders" value={c.stats.orders.toLocaleString()} highlight={c.stats.orders > 0} />
                  <MiniInline label="Revenue" value={fmt(c.stats.revenue)} highlight={c.stats.revenue > 0} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyPromoters({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="text-center py-10 px-6">
      <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
      <h3 className="font-bold text-gray-900 mb-1">No team members yet</h3>
      <p className="text-sm text-gray-500 mb-4">Add the people who promote your site. Each gets a personal link.</p>
      <button onClick={onAdd} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-semibold text-sm">
        <UserPlus className="w-4 h-4" /> Add first member
      </button>
    </div>
  );
}

function AddPromoterForm({ onSave, onCancel }: { onSave: () => Promise<void>; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setErr("");
    try {
      const res = await fetch("/api/admin/promoters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), slug: slug.trim() || undefined, email: email.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add");
      setName(""); setSlug(""); setEmail("");
      await onSave();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-blue-50/40 border-y border-blue-100 p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Field label="Name" required>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Smith" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none" />
      </Field>
      <Field label="Short ID (link slug)">
        <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto from name (e.g. john)" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-mono focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none" />
      </Field>
      <Field label="Email (optional)">
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none" />
      </Field>
      {err && (
        <div className="sm:col-span-3 flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <p className="text-xs text-red-700">{err}</p>
        </div>
      )}
      <div className="sm:col-span-3 flex items-center justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
        <button type="submit" disabled={submitting} className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-lg text-sm font-semibold">
          {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding…</> : <><UserPlus className="w-4 h-4" /> Add member</>}
        </button>
      </div>
    </form>
  );
}

// ════════════════════════════════════════════════════════════════════════
// STANDALONE LINKS SECTION (links not assigned to any promoter)
// ════════════════════════════════════════════════════════════════════════

function StandaloneLinksSection({
  campaigns, promoters, onCopy, copiedSlug, onReload,
}: {
  campaigns: Campaign[];
  promoters: Promoter[];
  onCopy: (url: string, slug: string) => void;
  copiedSlug: string | null;
  onReload: () => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
            <Link2 className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Standalone links</h2>
            <p className="text-xs text-gray-500">Links not assigned to a team member (e.g. brand campaigns, ads)</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> New link
        </button>
      </div>

      {showForm && (
        <AddLinkForm
          promoters={promoters}
          onSave={async () => { await onReload(); setShowForm(false); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {campaigns.length === 0 && !showForm ? (
        <div className="py-10 px-6 text-center text-sm text-gray-500">
          No standalone links yet. Use the button above to create one — or assign all your links to team members above.
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {campaigns.map((c) => (
            <CampaignRow key={c.id}
              campaign={c}
              copied={copiedSlug === c.slug}
              onCopy={() => onCopy(c.shareUrl, c.slug)}
              onArchive={async () => {
                if (!confirm("Archive this link? Its history is preserved but the URL stops redirecting.")) return;
                await fetch(`/api/admin/campaigns/${c.id}`, { method: "DELETE" });
                await onReload();
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════
// SHARED FORM: add a new link (used both standalone and per-promoter)
// ════════════════════════════════════════════════════════════════════════

function AddLinkForm({
  promoters, defaultPromoterId, hidePromoterDropdown, onSave, onCancel,
}: {
  promoters?: Promoter[];
  defaultPromoterId?: string;
  hidePromoterDropdown?: boolean;
  onSave: () => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [slug, setSlug] = useState("");
  const [destination, setDestination] = useState("/");
  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("social");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [utmContent, setUtmContent] = useState("");
  const [promoterId, setPromoterId] = useState(defaultPromoterId || "");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const applyPreset = (p: typeof SOURCE_PRESETS[number]) => {
    setUtmSource(p.value);
    setUtmMedium(p.medium);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setErr("");
    try {
      const res = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim() || undefined,
          purpose: purpose.trim() || undefined,
          destination: destination.trim() || "/",
          utmSource: utmSource.trim().toLowerCase(),
          utmMedium: utmMedium.trim().toLowerCase(),
          utmCampaign: utmCampaign.trim().toLowerCase() || undefined,
          utmContent: utmContent.trim().toLowerCase() || undefined,
          promoterId: promoterId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create");
      setName(""); setPurpose(""); setSlug(""); setDestination("/");
      setUtmSource(""); setUtmMedium("social"); setUtmCampaign(""); setUtmContent("");
      await onSave();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 border-y border-gray-200 p-4 sm:p-5">
      {/* Quick source presets */}
      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Quick source preset</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {SOURCE_PRESETS.map((p) => {
          const Icon = p.icon;
          const active = utmSource === p.value;
          return (
            <button key={p.value} type="button" onClick={() => applyPreset(p)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold ${
                active ? `bg-gradient-to-r ${p.color} text-white border-transparent` : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
              }`}>
              <Icon className="w-3 h-3" /> {p.label}
            </button>
          );
        })}
      </div>

      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {!hidePromoterDropdown && promoters && promoters.length > 0 && (
          <Field label="Assign to team member (optional)">
            <select value={promoterId} onChange={(e) => setPromoterId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none">
              <option value="">— Standalone (no member) —</option>
              {promoters.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </Field>
        )}

        <Field label="Link name (your reference)" required>
          <input value={name} onChange={(e) => setName(e.target.value)}
            placeholder="e.g. John's Instagram bio link"
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none" />
        </Field>

        <Field label="Purpose (where will this be used?)">
          <input value={purpose} onChange={(e) => setPurpose(e.target.value)}
            placeholder="e.g. Instagram bio link, Friday email blast"
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none" />
        </Field>

        <Field label="Short slug (auto if empty)">
          <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="ig-bio"
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-mono focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none" />
        </Field>

        <Field label="Destination on site" required>
          <input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="/  or  /product/raspberry-airheadz"
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-mono focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none" />
        </Field>

        <Field label="UTM source" required>
          <input value={utmSource} onChange={(e) => setUtmSource(e.target.value)} placeholder="instagram"
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-mono focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none" />
        </Field>

        <Field label="UTM medium" required>
          <input value={utmMedium} onChange={(e) => setUtmMedium(e.target.value)} placeholder="social"
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-mono focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none" />
        </Field>

        <Field label="UTM campaign (optional)">
          <input value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)} placeholder="raspberry-launch"
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-mono focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none" />
        </Field>

        <Field label="UTM content (optional)">
          <input value={utmContent} onChange={(e) => setUtmContent(e.target.value)} placeholder="story-link"
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-mono focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none" />
        </Field>

        {err && (
          <div className="sm:col-span-2 flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-xs text-red-700">{err}</p>
          </div>
        )}

        <div className="sm:col-span-2 flex items-center justify-end gap-2">
          <button type="button" onClick={onCancel} className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
          <button type="submit" disabled={submitting} className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-lg text-sm font-semibold">
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : <><Plus className="w-4 h-4" /> Create link</>}
          </button>
        </div>
      </form>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════

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

function MiniStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`p-2.5 rounded-lg text-center ${highlight ? "bg-emerald-50 border border-emerald-200" : "bg-gray-50"}`}>
      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
      <p className={`text-sm sm:text-base font-bold ${highlight ? "text-emerald-700" : "text-gray-900"}`}>{value}</p>
    </div>
  );
}

function MiniInline({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`p-1.5 rounded text-center ${highlight ? "bg-emerald-50" : "bg-gray-50"}`}>
      <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
      <p className={`text-xs font-bold ${highlight ? "text-emerald-700" : "text-gray-900"}`}>{value}</p>
    </div>
  );
}

function CampaignRow({ campaign, copied, onCopy, onArchive }: {
  campaign: Campaign; copied: boolean; onCopy: () => void; onArchive: () => Promise<void>;
}) {
  return (
    <div className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-bold text-gray-900 truncate">{campaign.name}</h3>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold uppercase">{campaign.utmSource}</span>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[10px]">{campaign.utmMedium}</span>
          </div>
          {campaign.purpose && <p className="text-xs text-gray-500 italic mb-1">{campaign.purpose}</p>}
          <p className="text-xs text-gray-400 font-mono truncate">→ {campaign.destination}</p>
        </div>
        <button
          type="button"
          onClick={onArchive}
          aria-label={`Archive link ${campaign.name}`}
          title={`Archive ${campaign.name}`}
          className="text-gray-400 hover:text-red-500 p-2 -m-2 transition-colors flex-shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl mb-3">
        <code className="flex-1 text-xs sm:text-sm font-mono text-slate-700 truncate">{campaign.shareUrl}</code>
        <button
          type="button"
          onClick={onCopy}
          aria-label={copied ? "Copied to clipboard" : "Copy link"}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            copied ? "bg-emerald-500 text-white" : "bg-slate-900 hover:bg-slate-800 text-white"
          }`}>
          {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <MiniStat label="Clicks" value={campaign.stats.clicks.toLocaleString()} />
        <MiniStat label="Sessions" value={campaign.stats.uniqueSessions.toLocaleString()} />
        <MiniStat label="Orders" value={campaign.stats.orders.toLocaleString()} highlight={campaign.stats.orders > 0} />
        <MiniStat label="Revenue" value={fmt(campaign.stats.revenue)} highlight={campaign.stats.revenue > 0} />
      </div>
    </div>
  );
}
