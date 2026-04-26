"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus, Copy, Check, Trash2, ExternalLink, Loader2, AlertCircle,
  Instagram, Facebook, Send, Globe, Mail as MailIcon, Twitter,
  Users, ChevronDown, ChevronRight, UserPlus, ArrowRight, Link2,
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
  { label: "Instagram", value: "instagram", medium: "social", icon: Instagram },
  { label: "Facebook", value: "facebook", medium: "social", icon: Facebook },
  { label: "Telegram", value: "telegram", medium: "social", icon: Send },
  { label: "Snapchat", value: "snapchat", medium: "social", icon: Send },
  { label: "Twitter/X", value: "twitter", medium: "social", icon: Twitter },
  { label: "TikTok", value: "tiktok", medium: "social", icon: Send },
  { label: "Reddit", value: "reddit", medium: "social", icon: Globe },
  { label: "Email", value: "newsletter", medium: "email", icon: MailIcon },
];

const fmt = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtCompact = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : fmt(n);

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

  const standaloneCampaigns = campaigns.filter((c) => !c.promoter);

  return (
    <div className="admin-page">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-2">
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.14em]">Attribution</p>
          <h1 className="text-[26px] sm:text-[28px] font-semibold text-slate-900 tracking-tight mt-1 leading-tight">Link tracking</h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate trackable short links for each team member. Every order traces back to whoever drove the click.
          </p>
        </div>
      </header>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* ─── KPI strip ──────────────────────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200 rounded-xl overflow-hidden border border-slate-200">
        <Kpi label="Total clicks" value={teamTotals.clicks.toLocaleString()} sub="all team links" />
        <Kpi label="Unique sessions" value={teamTotals.sessions.toLocaleString()} sub="distinct visitors" />
        <Kpi label="Attributed orders" value={teamTotals.orders.toLocaleString()} sub="through tracked links" highlight={teamTotals.orders > 0} />
        <Kpi label="Revenue" value={fmtCompact(teamTotals.revenue)} sub="attributed total" highlight={teamTotals.revenue > 0} />
      </section>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
        </div>
      )}

      {!loading && (
        <>
          {/* ─── Team members section ─── */}
          <PromotersSection
            promoters={promoters}
            expanded={expandedPromoters}
            onToggle={togglePromoter}
            onCopy={handleCopy}
            copiedSlug={copiedSlug}
            onReload={load}
          />

          {/* ─── Standalone links section ─── */}
          <StandaloneLinksSection
            campaigns={standaloneCampaigns}
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
  promoters, expanded, onToggle, onCopy, copiedSlug, onReload,
}: {
  promoters: Promoter[];
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onCopy: (url: string, slug: string) => void;
  copiedSlug: string | null;
  onReload: () => Promise<void>;
}) {
  const [showAddPromoter, setShowAddPromoter] = useState(false);
  const [showAddLinkFor, setShowAddLinkFor] = useState<string | null>(null);

  return (
    <section className="admin-card overflow-hidden">
      <header className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
        <div className="flex items-center gap-2.5 min-w-0">
          <Users className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <div className="min-w-0">
            <h2 className="text-[13px] font-semibold text-slate-900">Team members</h2>
            <p className="text-[11px] text-slate-500 mt-0.5 hidden sm:block">Each member gets a personal link they can share anywhere.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowAddPromoter(!showAddPromoter)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" strokeWidth={2.4} /> Add member
        </button>
      </header>

      {showAddPromoter && (
        <AddPromoterForm
          onSave={async () => { await onReload(); setShowAddPromoter(false); }}
          onCancel={() => setShowAddPromoter(false)}
        />
      )}

      {promoters.length === 0 && !showAddPromoter ? (
        <EmptyPromoters onAdd={() => setShowAddPromoter(true)} />
      ) : (
        <ul className="divide-y divide-slate-100">
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
        </ul>
      )}
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

  const initials = promoter.name.split(/\s+/).map(s => s[0]).slice(0, 2).join("").toUpperCase();
  const isDefaultCopied = copiedSlug === `default-${promoter.slug}`;

  return (
    <li>
      {/* Row */}
      <div className="px-5 py-3.5 hover:bg-slate-50/40 transition-colors">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggle}
            aria-label={isExpanded ? "Collapse" : "Expand"}
            className="flex-shrink-0 text-slate-300 hover:text-slate-700 transition-colors p-0.5"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold flex items-center justify-center flex-shrink-0 ring-1 ring-slate-200">
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-sm font-semibold text-slate-900 truncate">{promoter.name}</p>
              <span className="text-[10px] font-medium text-slate-500 px-1.5 py-0.5 bg-slate-100 rounded">
                {promoter.totals.campaignCount} link{promoter.totals.campaignCount === 1 ? "" : "s"}
              </span>
            </div>
            <code className="text-[11px] font-mono text-slate-500 truncate block">{promoter.defaultLink}</code>
          </div>

          {/* Inline copy button for personal link */}
          <button
            type="button"
            onClick={() => onCopy(promoter.defaultLink, `default-${promoter.slug}`)}
            aria-label={isDefaultCopied ? "Copied" : "Copy personal link"}
            className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors flex-shrink-0 ${
              isDefaultCopied
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            {isDefaultCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {isDefaultCopied ? "Copied" : "Copy"}
          </button>

          {/* Stats */}
          <div className="hidden lg:grid grid-cols-4 gap-4 flex-shrink-0 min-w-[280px]">
            <Stat value={promoter.totals.clicks.toLocaleString()} label="clicks" />
            <Stat value={promoter.totals.uniqueSessions.toLocaleString()} label="sessions" />
            <Stat value={promoter.totals.orders.toLocaleString()} label="orders" highlight={promoter.totals.orders > 0} />
            <Stat value={fmtCompact(promoter.totals.revenue)} label="revenue" highlight={promoter.totals.revenue > 0} />
          </div>

          <button
            type="button"
            onClick={handleArchive}
            disabled={archiving}
            aria-label={`Archive ${promoter.name}`}
            title={`Archive ${promoter.name}`}
            className="text-slate-300 hover:text-rose-500 p-2 -m-2 transition-colors flex-shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mobile copy button + stats */}
        <div className="lg:hidden mt-3 grid grid-cols-4 gap-2">
          <Stat value={promoter.totals.clicks.toLocaleString()} label="clicks" />
          <Stat value={promoter.totals.uniqueSessions.toLocaleString()} label="sessions" />
          <Stat value={promoter.totals.orders.toLocaleString()} label="orders" highlight={promoter.totals.orders > 0} />
          <Stat value={fmtCompact(promoter.totals.revenue)} label="revenue" highlight={promoter.totals.revenue > 0} />
        </div>
        <button
          type="button"
          onClick={() => onCopy(promoter.defaultLink, `default-${promoter.slug}`)}
          aria-label={isDefaultCopied ? "Copied" : "Copy personal link"}
          className={`sm:hidden mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-[12px] font-medium transition-colors ${
            isDefaultCopied
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-white text-slate-700 border border-slate-200"
          }`}
        >
          {isDefaultCopied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy personal link</>}
        </button>
      </div>

      {/* Expanded: per-link breakdown */}
      {isExpanded && (
        <div className="bg-slate-50/60 px-5 py-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">All links assigned to {promoter.name}</p>
            <button
              type="button"
              onClick={onAddLink}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-md text-[11px] font-medium transition-colors"
            >
              <Plus className="w-3 h-3" /> Add link
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

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-medium text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="text-left py-2 px-3">Link</th>
                  <th className="text-right py-2 px-2">Clicks</th>
                  <th className="text-right py-2 px-2 hidden sm:table-cell">Sessions</th>
                  <th className="text-right py-2 px-2">Orders</th>
                  <th className="text-right py-2 px-3">Revenue</th>
                  <th className="py-2 px-2"></th>
                </tr>
              </thead>
              <tbody>
                {promoter.campaigns.map((c) => (
                  <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                    <td className="py-2.5 px-3">
                      <div className="text-[12px] font-medium text-slate-900 truncate">{c.name}</div>
                      {c.purpose && <div className="text-[10px] text-slate-500 italic">{c.purpose}</div>}
                      <code className="text-[10px] text-slate-400 font-mono truncate block">/r/{c.slug}</code>
                    </td>
                    <td className="text-right py-2.5 px-2 text-[12px] text-slate-700 tabular-nums">{c.stats.clicks.toLocaleString()}</td>
                    <td className="text-right py-2.5 px-2 text-[12px] text-slate-600 tabular-nums hidden sm:table-cell">{c.stats.uniqueSessions.toLocaleString()}</td>
                    <td className={`text-right py-2.5 px-2 text-[12px] tabular-nums font-medium ${c.stats.orders > 0 ? "text-emerald-700" : "text-slate-400"}`}>{c.stats.orders.toLocaleString()}</td>
                    <td className={`text-right py-2.5 px-3 text-[12px] tabular-nums font-semibold ${c.stats.revenue > 0 ? "text-emerald-700" : "text-slate-400"}`}>{fmtCompact(c.stats.revenue)}</td>
                    <td className="py-2.5 px-2 text-right">
                      <button
                        type="button"
                        onClick={() => onCopy(c.shareUrl, c.slug)}
                        aria-label="Copy link"
                        className={`inline-flex items-center justify-center w-6 h-6 rounded transition-colors ${
                          copiedSlug === c.slug
                            ? "bg-emerald-50 text-emerald-700"
                            : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        }`}
                      >
                        {copiedSlug === c.slug ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </li>
  );
}

function EmptyPromoters({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="px-5 py-12 text-center">
      <p className="text-sm font-medium text-slate-900 mb-1">No team members yet</p>
      <p className="text-[12px] text-slate-500 mb-5">Add the people who promote your site. Each gets a personal link they can share anywhere.</p>
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
      >
        <UserPlus className="w-4 h-4" strokeWidth={2.4} /> Add first member
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
    <form onSubmit={submit} className="bg-slate-50/80 border-y border-slate-200 px-5 py-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Field label="Name" required>
        <Input value={name} onChange={setName} placeholder="John Smith" />
      </Field>
      <Field label="Short ID (link slug)">
        <Input value={slug} onChange={setSlug} placeholder="auto from name" mono />
      </Field>
      <Field label="Email (optional)">
        <Input value={email} onChange={setEmail} placeholder="john@example.com" type="email" />
      </Field>
      {err && (
        <div className="sm:col-span-3 flex items-center gap-2 p-2.5 bg-rose-50 border border-rose-200 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
          <p className="text-[12px] text-rose-700">{err}</p>
        </div>
      )}
      <div className="sm:col-span-3 flex items-center justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 text-[12px] text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
        <button type="submit" disabled={submitting} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-md transition-colors">
          {submitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Adding…</> : <><UserPlus className="w-3.5 h-3.5" /> Add member</>}
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
    <section className="admin-card overflow-hidden">
      <header className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link2 className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <div className="min-w-0">
            <h2 className="text-[13px] font-semibold text-slate-900">Standalone links</h2>
            <p className="text-[11px] text-slate-500 mt-0.5 hidden sm:block">Links not assigned to a team member — brand campaigns, ads, partnerships.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2.4} /> New link
        </button>
      </header>

      {showForm && (
        <AddLinkForm
          promoters={promoters}
          onSave={async () => { await onReload(); setShowForm(false); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {campaigns.length === 0 && !showForm ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm font-medium text-slate-900">No standalone links yet</p>
          <p className="text-[12px] text-slate-500 mt-1">Create one above, or assign all your links to team members.</p>
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] font-medium text-slate-500 uppercase tracking-wider border-b border-slate-100">
              <th className="text-left py-2.5 px-5">Link</th>
              <th className="text-left py-2.5 px-2 hidden md:table-cell">Source</th>
              <th className="text-right py-2.5 px-2">Clicks</th>
              <th className="text-right py-2.5 px-2 hidden sm:table-cell">Sessions</th>
              <th className="text-right py-2.5 px-2">Orders</th>
              <th className="text-right py-2.5 px-2">Revenue</th>
              <th className="py-2.5 px-5"></th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <CampaignRow
                key={c.id}
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
          </tbody>
        </table>
      )}
    </section>
  );
}

function CampaignRow({ campaign, copied, onCopy, onArchive }: {
  campaign: Campaign; copied: boolean; onCopy: () => void; onArchive: () => Promise<void>;
}) {
  return (
    <tr className="border-b border-slate-50 last:border-0 hover:bg-slate-50/40 transition-colors">
      <td className="py-3 px-5">
        <div className="text-sm font-medium text-slate-900 truncate">{campaign.name}</div>
        {campaign.purpose && <div className="text-[11px] text-slate-500 italic truncate">{campaign.purpose}</div>}
        <code className="text-[10px] text-slate-400 font-mono truncate block">{campaign.shareUrl}</code>
      </td>
      <td className="py-3 px-2 hidden md:table-cell">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-slate-700">{campaign.utmSource}</span>
          <span className="text-[10px] text-slate-400">·</span>
          <span className="text-[11px] text-slate-500">{campaign.utmMedium}</span>
        </div>
      </td>
      <td className="text-right py-3 px-2 text-[13px] text-slate-700 tabular-nums">{campaign.stats.clicks.toLocaleString()}</td>
      <td className="text-right py-3 px-2 text-[13px] text-slate-600 tabular-nums hidden sm:table-cell">{campaign.stats.uniqueSessions.toLocaleString()}</td>
      <td className={`text-right py-3 px-2 text-[13px] tabular-nums font-medium ${campaign.stats.orders > 0 ? "text-emerald-700" : "text-slate-400"}`}>{campaign.stats.orders.toLocaleString()}</td>
      <td className={`text-right py-3 px-2 text-[13px] tabular-nums font-semibold ${campaign.stats.revenue > 0 ? "text-emerald-700" : "text-slate-400"}`}>{fmtCompact(campaign.stats.revenue)}</td>
      <td className="py-3 px-5">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={onCopy}
            aria-label={copied ? "Copied" : "Copy link"}
            className={`inline-flex items-center justify-center w-7 h-7 rounded transition-colors ${
              copied ? "bg-emerald-50 text-emerald-700" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={onArchive}
            aria-label={`Archive ${campaign.name}`}
            title={`Archive ${campaign.name}`}
            className="inline-flex items-center justify-center w-7 h-7 rounded text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
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
    <div className="bg-slate-50/80 border-y border-slate-200 px-5 py-4">
      {/* Source presets */}
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Quick source preset</p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {SOURCE_PRESETS.map((p) => {
          const Icon = p.icon;
          const active = utmSource === p.value;
          return (
            <button
              type="button"
              key={p.value}
              onClick={() => applyPreset(p)}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                active
                  ? "bg-slate-900 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              <Icon className="w-3 h-3" /> {p.label}
            </button>
          );
        })}
      </div>

      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {!hidePromoterDropdown && promoters && promoters.length > 0 && (
          <Field label="Assign to team member">
            <select
              value={promoterId}
              onChange={(e) => setPromoterId(e.target.value)}
              className="w-full px-3 py-2 text-[13px] bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-colors"
            >
              <option value="">— Standalone (no member) —</option>
              {promoters.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Link name (your reference)" required>
          <Input value={name} onChange={setName} placeholder="e.g. John's Instagram bio link" />
        </Field>
        <Field label="Purpose">
          <Input value={purpose} onChange={setPurpose} placeholder="e.g. Instagram bio, Friday email blast" />
        </Field>
        <Field label="Short slug (auto if empty)">
          <Input value={slug} onChange={setSlug} placeholder="ig-bio" mono />
        </Field>
        <Field label="Destination on site" required>
          <Input value={destination} onChange={setDestination} placeholder="/  or  /product/raspberry-airheadz" mono />
        </Field>
        <Field label="UTM source" required>
          <Input value={utmSource} onChange={setUtmSource} placeholder="instagram" mono />
        </Field>
        <Field label="UTM medium" required>
          <Input value={utmMedium} onChange={setUtmMedium} placeholder="social" mono />
        </Field>
        <Field label="UTM campaign (optional)">
          <Input value={utmCampaign} onChange={setUtmCampaign} placeholder="raspberry-launch" mono />
        </Field>
        <Field label="UTM content (optional)">
          <Input value={utmContent} onChange={setUtmContent} placeholder="story-link" mono />
        </Field>

        {err && (
          <div className="sm:col-span-2 flex items-center gap-2 p-2.5 bg-rose-50 border border-rose-200 rounded-lg">
            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
            <p className="text-[12px] text-rose-700">{err}</p>
          </div>
        )}

        <div className="sm:col-span-2 flex items-center justify-end gap-2">
          <button type="button" onClick={onCancel} className="px-3 py-1.5 text-[12px] text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
          <button type="submit" disabled={submitting} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-md transition-colors">
            {submitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating…</> : <><Plus className="w-3.5 h-3.5" /> Create link</>}
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
      <label className="block text-[11px] font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, mono, type }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
  type?: string;
}) {
  return (
    <input
      type={type || "text"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3 py-2 text-[13px] bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-colors ${mono ? "font-mono" : ""}`}
    />
  );
}

function Kpi({ label, value, sub, highlight }: {
  label: string; value: string; sub: string; highlight?: boolean;
}) {
  return (
    <div className="bg-white p-5">
      <p className="text-[12px] font-medium text-slate-500">{label}</p>
      <p className={`text-[26px] sm:text-[28px] font-semibold tracking-tight tabular-nums leading-none mt-1 ${highlight ? "text-emerald-700" : "text-slate-900"}`}>{value}</p>
      <p className="text-[11px] text-slate-500 mt-2">{sub}</p>
    </div>
  );
}

function Stat({ value, label, highlight }: { value: string; label: string; highlight?: boolean }) {
  return (
    <div className="text-center sm:text-right">
      <div className={`text-[13px] font-semibold tabular-nums ${highlight ? "text-emerald-700" : "text-slate-900"}`}>{value}</div>
      <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{label}</div>
    </div>
  );
}

// Suppress unused import if a future cleanup removes references
void ExternalLink;
void ArrowRight;
