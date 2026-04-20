"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Send, Eye } from "lucide-react";
import FileUpload from "../../../components/FileUpload";

export default function EditAnnouncementPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "", message: "", content: "", imageUrl: "", link: "",
    published: false, sendPush: false,
  });

  useEffect(() => {
    fetch(`/api/admin/announcements/${params.id}`)
      .then((r) => { if (r.status === 401) { router.push("/admin/login"); return null; } if (!r.ok) { router.push("/admin/announcements"); return null; } return r.json(); })
      .then((d) => { if (d) setForm({ title: d.title, message: d.message, content: d.content, imageUrl: d.imageUrl || "", link: d.link || "", published: d.published, sendPush: false }); })
      .catch(() => router.push("/admin/announcements"))
      .finally(() => setLoading(false));
  }, [params.id, router]);

  const cls = "w-full px-4 py-3 text-sm sm:text-base border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition-all";

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError("Title is required"); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch(`/api/admin/announcements/${params.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      router.push("/admin/announcements");
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 text-gray-400 animate-spin" /></div>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/announcements" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-gray-600" /></Link>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Edit Announcement</h1>
      </div>

      <div className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Title *</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={cls} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Short Message *</label>
            <input type="text" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={cls} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Full Content</label>
            <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={6} className={`${cls} resize-y`} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Image <span className="font-normal text-gray-400">(optional)</span></label>
            <FileUpload
              value={form.imageUrl}
              onChange={(url) => setForm({ ...form, imageUrl: url })}
              type="image"
              hideUrlInput
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Link</label>
            <input type="text" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} className={cls} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-slate-900" />
            <span className="text-sm font-semibold text-gray-900 flex items-center gap-1.5"><Eye className="w-4 h-4" /> Published</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.sendPush} onChange={(e) => setForm({ ...form, sendPush: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-blue-500" />
            <span className="text-sm font-semibold text-gray-900 flex items-center gap-1.5"><Send className="w-4 h-4" /> Re-send Push</span>
          </label>
        </div>

        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 text-center">{error}</div>}

        <div className="flex flex-col sm:flex-row gap-3 pb-8">
          <button onClick={handleSubmit} disabled={saving} className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : "Update"}
          </button>
          <Link href="/admin/announcements" className="text-center px-6 py-3 text-gray-600 text-sm font-medium hover:text-gray-900">Cancel</Link>
        </div>
      </div>
    </div>
  );
}
