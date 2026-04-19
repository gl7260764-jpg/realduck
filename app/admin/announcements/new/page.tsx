"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Send, Eye, CalendarClock } from "lucide-react";

export default function NewAnnouncementPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [scheduleMode, setScheduleMode] = useState(false);
  const [form, setForm] = useState({
    title: "", message: "", content: "", imageUrl: "", link: "",
    published: false, sendPush: false, scheduledAt: "",
  });

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
        // If scheduled, don't publish or push now
        published: scheduleMode ? false : form.published,
        sendPush: scheduleMode ? false : form.sendPush,
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
            <label className="block text-sm sm:text-base font-semibold text-gray-900 mb-1.5">Image URL <span className="font-normal text-gray-400">(optional)</span></label>
            <input type="text" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." className={cls} />
          </div>
          <div>
            <label className="block text-sm sm:text-base font-semibold text-gray-900 mb-1.5">Link <span className="font-normal text-gray-400">(optional)</span></label>
            <input type="text" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="/announcements" className={cls} />
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
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-slate-900" />
                <div>
                  <span className="text-sm font-semibold text-gray-900 flex items-center gap-1.5"><Eye className="w-4 h-4" /> Publish</span>
                  <p className="text-xs text-gray-500">Make visible immediately</p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.sendPush} onChange={(e) => setForm({ ...form, sendPush: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-blue-500" />
                <div>
                  <span className="text-sm font-semibold text-gray-900 flex items-center gap-1.5"><Send className="w-4 h-4" /> Send Push</span>
                  <p className="text-xs text-gray-500">Notify all subscribers now</p>
                </div>
              </label>
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
            {saving ? "Saving..." : scheduleMode ? "Schedule Announcement" : "Create Announcement"}
          </button>
          <Link href="/admin/announcements" className="text-center px-6 py-3 text-gray-600 text-sm font-medium hover:text-gray-900">Cancel</Link>
        </div>
      </div>
    </div>
  );
}
