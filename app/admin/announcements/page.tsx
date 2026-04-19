"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Megaphone, Trash2, Edit2, Eye, EyeOff, Loader2, Send, Bell, Clock, CalendarClock } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  message: string;
  published: boolean;
  pushed: boolean;
  pushSentAt: string | null;
  scheduledAt: string | null;
  createdAt: string;
}

function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return "Just now";
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function AdminAnnouncementsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [pushing, setPushing] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/announcements")
      .then((r) => { if (r.status === 401) { router.push("/admin/login"); return null; } return r.json(); })
      .then((d) => { if (d) setItems(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
      if (res.ok) setItems((p) => p.filter((a) => a.id !== id));
    } catch {}
    setDeleting(null);
  };

  const togglePublish = async (a: Announcement) => {
    try {
      const res = await fetch(`/api/admin/announcements/${a.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !a.published }),
      });
      if (res.ok) setItems((p) => p.map((x) => x.id === a.id ? { ...x, published: !x.published } : x));
    } catch {}
  };

  const sendPush = async (a: Announcement) => {
    if (!confirm(`Send push notification for "${a.title}" to all subscribers?`)) return;
    setPushing(a.id);
    try {
      const res = await fetch(`/api/admin/announcements/${a.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sendPush: true }),
      });
      if (res.ok) {
        setItems((p) => p.map((x) => x.id === a.id ? { ...x, pushed: true, pushSentAt: new Date().toISOString() } : x));
      }
    } catch {}
    setPushing(null);
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 text-gray-400 animate-spin" /></div>;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-5 lg:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{items.length} total</p>
        </div>
        <Link href="/admin/announcements/new" className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors">
          <Plus className="w-4 h-4" /> New
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
          <Megaphone className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-sm text-gray-500 mb-4">No announcements yet</p>
          <Link href="/admin/announcements/new" className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg">
            <Plus className="w-4 h-4" /> Create first announcement
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <div key={a.id} className="bg-white border border-gray-200 rounded-xl p-4 lg:p-5">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${a.published ? "bg-green-100" : "bg-gray-100"}`}>
                  <Bell className={`w-5 h-5 ${a.published ? "text-green-600" : "text-gray-400"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm lg:text-base font-semibold text-gray-900">{a.title}</h3>
                  <p className="text-xs lg:text-sm text-gray-500 mt-0.5 line-clamp-1">{a.message}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-[11px] text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(a.createdAt)}</span>
                    {a.scheduledAt && !a.published ? (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 flex items-center gap-1">
                        <CalendarClock className="w-2.5 h-2.5" />
                        {new Date(a.scheduledAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })} at {new Date(a.scheduledAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </span>
                    ) : (
                      <button onClick={() => togglePublish(a)} className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${a.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {a.published ? "Published" : "Draft"}
                      </button>
                    )}
                    {a.pushed && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
                        <Send className="w-2.5 h-2.5" /> Pushed
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!a.pushed && a.published && (
                    <button onClick={() => sendPush(a)} disabled={pushing === a.id} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50" title="Send push notification">
                      {pushing === a.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  )}
                  <Link href={`/admin/announcements/${a.id}/edit`} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </Link>
                  <button onClick={() => handleDelete(a.id)} disabled={deleting === a.id} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50">
                    {deleting === a.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
