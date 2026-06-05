"use client";

// CRAFTED By W1C3
// Compose & send newsletter campaigns through Brevo, plus sent-campaign history.
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  Loader2,
  Users,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
} from "lucide-react";

interface Campaign {
  id: string;
  subject: string;
  status: string;
  recipientCount: number;
  brevoCampaignId: number | null;
  error: string | null;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
}

interface CampaignsResponse {
  campaigns: Campaign[];
  subscriberCount: number;
  brevoConfigured: boolean;
}

function fmtDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; icon: React.ReactNode; label: string }> = {
    sent: { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle2 className="w-3 h-3" />, label: "Sent" },
    scheduled: { cls: "bg-blue-50 text-blue-700 border-blue-200", icon: <Clock className="w-3 h-3" />, label: "Scheduled" },
    failed: { cls: "bg-rose-50 text-rose-700 border-rose-200", icon: <XCircle className="w-3 h-3" />, label: "Failed" },
    draft: { cls: "bg-slate-50 text-slate-600 border-slate-200", icon: <Clock className="w-3 h-3" />, label: "Draft" },
  };
  const s = map[status] || map.draft;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${s.cls}`}>
      {s.icon}
      {s.label}
    </span>
  );
}

export default function AdminCampaignsPage() {
  const router = useRouter();
  const [data, setData] = useState<CampaignsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/newsletter/campaigns");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      setData((await res.json()) as CampaignsResponse);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function syncSubscribers() {
    setSyncing(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/newsletter/sync-brevo", { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        setMsg({ type: "ok", text: `Synced ${json.synced} of ${json.total} subscribers to Brevo.` });
      } else {
        setMsg({ type: "err", text: json.error || "Sync failed." });
      }
    } catch {
      setMsg({ type: "err", text: "Sync failed. Please try again." });
    } finally {
      setSyncing(false);
    }
  }

  async function send() {
    if (!subject.trim() || !content.trim()) {
      setMsg({ type: "err", text: "Subject and content are required." });
      return;
    }
    const scheduled = Boolean(scheduledAt);
    const verb = scheduled ? "schedule" : "send to all active subscribers";
    if (!window.confirm(`This will ${verb} this campaign now. Continue?`)) return;

    setSending(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/newsletter/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, content, scheduledAt: scheduledAt || undefined }),
      });
      const json = await res.json();
      if (res.ok) {
        setMsg({ type: "ok", text: scheduled ? "Campaign scheduled." : "Campaign sent!" });
        setSubject("");
        setContent("");
        setScheduledAt("");
        load();
      } else {
        setMsg({ type: "err", text: json.error || "Failed to send." });
      }
    } catch {
      setMsg({ type: "err", text: "Failed to send. Please try again." });
    } finally {
      setSending(false);
    }
  }

  const subscriberCount = data?.subscriberCount ?? 0;
  const brevoConfigured = data?.brevoConfigured ?? false;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Send className="w-5 h-5 text-rose-500" />
            Email Campaigns
          </h1>
          <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            {subscriberCount} active subscriber{subscriberCount === 1 ? "" : "s"}
          </p>
        </div>
        <button
          type="button"
          onClick={syncSubscribers}
          disabled={syncing || !brevoConfigured}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"
        >
          {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Sync subscribers to Brevo
        </button>
      </div>

      {!brevoConfigured && (
        <div className="flex items-start gap-2 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            Brevo isn&apos;t connected yet. Add your API key in{" "}
            <a href="/admin/settings" className="font-semibold underline">Settings</a> to send campaigns.
          </span>
        </div>
      )}

      {msg && (
        <div
          className={`p-3.5 rounded-xl text-sm font-medium border ${
            msg.type === "ok"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Composer */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={200}
            placeholder="New drop just landed 🌿"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400/40 focus:border-rose-400"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-600">
              Content <span className="font-normal text-slate-400">(HTML supported — wrapped in branded template)</span>
            </label>
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              <Eye className="w-3.5 h-3.5" />
              {showPreview ? "Hide" : "Show"} preview
            </button>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            placeholder={"<h2>Hey there 👋</h2>\n<p>We just restocked your favorites...</p>\n<p><a href=\"https://realduckdistro.com\">Shop now</a></p>"}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rose-400/40 focus:border-rose-400"
          />
        </div>

        {showPreview && content.trim() && (
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-3 py-1.5 bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
              Preview
            </div>
            <div className="p-4 bg-white prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
          </div>
        )}

        <div className="flex flex-wrap items-end gap-4 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Schedule (optional)</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400/40 focus:border-rose-400"
            />
          </div>
          <button
            type="button"
            onClick={send}
            disabled={sending || !brevoConfigured}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 disabled:opacity-50 shadow-sm transition"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {scheduledAt ? "Schedule campaign" : `Send to ${subscriberCount} subscriber${subscriberCount === 1 ? "" : "s"}`}
          </button>
        </div>
      </div>

      {/* History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-800">Campaign history</h2>
        </div>
        {loading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        ) : !data || data.campaigns.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">No campaigns sent yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-100">
                  <th className="px-5 py-2.5 font-semibold">Subject</th>
                  <th className="px-3 py-2.5 font-semibold">Status</th>
                  <th className="px-3 py-2.5 font-semibold">Recipients</th>
                  <th className="px-3 py-2.5 font-semibold">When</th>
                </tr>
              </thead>
              <tbody>
                {data.campaigns.map((c) => (
                  <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                    <td className="px-5 py-3 font-medium text-slate-800 max-w-xs truncate" title={c.subject}>
                      {c.subject}
                      {c.error && <div className="text-[11px] text-rose-500 font-normal truncate">{c.error}</div>}
                    </td>
                    <td className="px-3 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-3 py-3 text-slate-600">{c.recipientCount}</td>
                    <td className="px-3 py-3 text-slate-500 whitespace-nowrap">
                      {c.status === "scheduled" ? fmtDate(c.scheduledAt) : fmtDate(c.sentAt || c.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
