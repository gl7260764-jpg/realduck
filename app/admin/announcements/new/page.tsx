"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Eye, CalendarClock, Bell } from "lucide-react";
import FileUpload from "../../components/FileUpload";

type LinkMode = "announcements" | "product" | "custom";
interface LiteProduct { id: string; slug: string | null; title: string; category: string; }

export default function NewAnnouncementPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [scheduleMode, setScheduleMode] = useState(false);
  const [form, setForm] = useState({
    title: "", message: "", content: "", imageUrl: "", link: "",
    published: true, scheduledAt: "",
  });
  const [linkMode, setLinkMode] = useState<LinkMode>("announcements");
  const [products, setProducts] = useState<LiteProduct[]>([]);
  const [productQuery, setProductQuery] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");

  useEffect(() => {
    fetch("/api/admin/products")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => Array.isArray(d) ? setProducts(d.map((p) => ({ id: p.id, slug: p.slug, title: p.title, category: p.category }))) : null)
      .catch(() => {});
  }, []);

  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    if (!q) return products.slice(0, 20);
    return products.filter((p) => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)).slice(0, 20);
  }, [products, productQuery]);

  // Keep form.link in sync with the chosen mode
  useEffect(() => {
    if (linkMode === "announcements") {
      setForm((f) => ({ ...f, link: "" })); // server defaults null link → /announcements
    } else if (linkMode === "product") {
      const p = products.find((p) => p.id === selectedProductId);
      if (p) setForm((f) => ({ ...f, link: `/product/${p.slug || p.id}` }));
      else setForm((f) => ({ ...f, link: "" }));
    }
    // "custom" leaves form.link untouched so the user can type
  }, [linkMode, selectedProductId, products]);

  const cls = "w-full px-4 py-3 text-sm sm:text-base border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition-all";

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError("Title is required"); return; }
    if (!form.message.trim()) { setError("Message is required"); return; }
    if (scheduleMode && !form.scheduledAt) { setError("Select a schedule date and time"); return; }

    setSaving(true); setError("");
    try {
      const payload = {
        ...form,
        content: form.content || form.message,
        scheduledAt: scheduleMode && form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
        // If scheduled, don't publish or push now — the cron handles it on schedule
        published: scheduleMode ? false : form.published,
        // Posting = notifying. Push automatically when publishing now.
        sendPush: scheduleMode ? false : form.published,
      };

      const res = await fetch("/api/admin/announcements", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.status === 401) { router.push("/admin/login"); return; }
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      router.push("/admin/announcements");
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to save"); }
    setSaving(false);
  };

  // Minimum datetime = now + 1 minute
  const minDatetime = new Date(Date.now() + 60000).toISOString().slice(0, 16);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/announcements" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-gray-600" /></Link>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">New Announcement</h1>
      </div>

      <div className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 space-y-4">
          <div>
            <label className="block text-sm sm:text-base font-semibold text-gray-900 mb-1.5">Title *</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Announcement title" className={cls} />
          </div>
          <div>
            <label className="block text-sm sm:text-base font-semibold text-gray-900 mb-1.5">Short Message * <span className="font-normal text-gray-400">(shown in notification)</span></label>
            <input type="text" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Brief preview for push notification" className={cls} maxLength={200} />
          </div>
          <div>
            <label className="block text-sm sm:text-base font-semibold text-gray-900 mb-1.5">Full Content</label>
            <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Full announcement content (shown on announcements page)" rows={6} className={`${cls} resize-y`} />
          </div>
          <div>
            <label className="block text-sm sm:text-base font-semibold text-gray-900 mb-1.5">Image <span className="font-normal text-gray-400">(optional — shown in the notification on Android &amp; desktop)</span></label>
            <FileUpload
              value={form.imageUrl}
              onChange={(url) => setForm({ ...form, imageUrl: url })}
              type="image"
              hideUrlInput
            />
          </div>
          <div>
            <label className="block text-sm sm:text-base font-semibold text-gray-900 mb-1.5">When the notification is tapped, open…</label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {([
                { id: "announcements", label: "Announcements" },
                { id: "product", label: "A product" },
                { id: "custom", label: "Custom URL" },
              ] as { id: LinkMode; label: string }[]).map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setLinkMode(opt.id)}
                  className={`py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                    linkMode === opt.id
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {linkMode === "announcements" && (
              <p className="text-xs text-gray-500">Tap opens <span className="font-mono text-gray-700">/announcements</span> — the full announcement feed.</p>
            )}

            {linkMode === "product" && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                  placeholder="Search products by name or category…"
                  className={cls}
                />
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100">
                  {filteredProducts.length === 0 && (
                    <p className="px-4 py-6 text-center text-sm text-gray-400">{products.length === 0 ? "Loading products…" : "No matches"}</p>
                  )}
                  {filteredProducts.map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => setSelectedProductId(p.id)}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between gap-3 transition-colors ${
                        selectedProductId === p.id ? "bg-slate-900 text-white" : "hover:bg-gray-50 text-gray-800"
                      }`}
                    >
                      <span className="truncate">{p.title}</span>
                      <span className={`text-[10px] uppercase tracking-wide flex-shrink-0 ${selectedProductId === p.id ? "text-white/60" : "text-gray-400"}`}>{p.category}</span>
                    </button>
                  ))}
                </div>
                {form.link && selectedProductId && (
                  <p className="text-xs text-gray-500">Tap opens <span className="font-mono text-gray-700">{form.link}</span></p>
                )}
              </div>
            )}

            {linkMode === "custom" && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                  placeholder="/shop, /category/edibles, https://…"
                  className={cls}
                />
                <p className="text-xs text-gray-500">Any internal path (starts with <span className="font-mono">/</span>) or a full URL.</p>
              </div>
            )}
          </div>
        </div>

        {/* Publish / Schedule */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 space-y-4">
          {/* Mode Toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setScheduleMode(false)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${!scheduleMode ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
            >
              <Eye className="w-4 h-4" /> Publish Now
            </button>
            <button
              type="button"
              onClick={() => setScheduleMode(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${scheduleMode ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
            >
              <CalendarClock className="w-4 h-4" /> Schedule
            </button>
          </div>

          {/* Publish Now Options */}
          {!scheduleMode && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
              <Bell className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Publish &amp; Notify Everyone</p>
                <p className="text-xs text-gray-600 mt-0.5">
                  Publishing will immediately send a push notification to every subscriber — it appears on their lock screen like a WhatsApp message.
                </p>
              </div>
            </div>
          )}

          {/* Schedule Options */}
          {scheduleMode && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                <CalendarClock className="w-4 h-4 inline mr-1.5" />
                Go Live Date & Time *
              </label>
              <input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                min={minDatetime}
                className={cls}
              />
              <p className="text-xs text-gray-500 mt-1.5">
                The announcement will auto-publish and send push notifications to all subscribers at this time.
              </p>
            </div>
          )}
        </div>

        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 text-center">{error}</div>}

        <div className="flex flex-col sm:flex-row gap-3 pb-8">
          <button onClick={handleSubmit} disabled={saving} className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white text-sm sm:text-base font-medium rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-all">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : scheduleMode ? "Schedule Announcement" : "Publish & Notify"}
          </button>
          <Link href="/admin/announcements" className="text-center px-6 py-3 text-gray-600 text-sm font-medium hover:text-gray-900">Cancel</Link>
        </div>
      </div>
    </div>
  );
}
