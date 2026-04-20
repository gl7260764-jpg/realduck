"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Send, Eye } from "lucide-react";
import FileUpload from "../../../components/FileUpload";

type LinkMode = "announcements" | "product" | "custom";
interface LiteProduct { id: string; slug: string | null; title: string; category: string; }

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

  useEffect(() => {
    fetch(`/api/admin/announcements/${params.id}`)
      .then((r) => { if (r.status === 401) { router.push("/admin/login"); return null; } if (!r.ok) { router.push("/admin/announcements"); return null; } return r.json(); })
      .then((d) => {
        if (!d) return;
        const link = d.link || "";
        setForm({ title: d.title, message: d.message, content: d.content, imageUrl: d.imageUrl || "", link, published: d.published, sendPush: false });
        // Infer linkMode from current link
        if (!link) setLinkMode("announcements");
        else if (link.startsWith("/product/")) setLinkMode("product");
        else setLinkMode("custom");
      })
      .catch(() => router.push("/admin/announcements"))
      .finally(() => setLoading(false));
  }, [params.id, router]);

  // When the link is a product link, match it to a product in the list once products load
  useEffect(() => {
    if (linkMode !== "product" || selectedProductId || products.length === 0 || !form.link) return;
    const slugOrId = form.link.replace(/^\/product\//, "");
    const match = products.find((p) => (p.slug || p.id) === slugOrId);
    if (match) setSelectedProductId(match.id);
  }, [products, form.link, linkMode, selectedProductId]);

  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    if (!q) return products.slice(0, 20);
    return products.filter((p) => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)).slice(0, 20);
  }, [products, productQuery]);

  // Keep form.link in sync with the chosen mode / selected product
  useEffect(() => {
    if (linkMode === "announcements") {
      setForm((f) => (f.link === "" ? f : { ...f, link: "" }));
    } else if (linkMode === "product") {
      const p = products.find((p) => p.id === selectedProductId);
      if (p) {
        const next = `/product/${p.slug || p.id}`;
        setForm((f) => (f.link === next ? f : { ...f, link: next }));
      }
    }
  }, [linkMode, selectedProductId, products]);

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
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">When the notification is tapped, open…</label>
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
              <p className="text-xs text-gray-500">Tap opens <span className="font-mono text-gray-700">/announcements</span>.</p>
            )}

            {linkMode === "product" && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                  placeholder="Search products…"
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
                <p className="text-xs text-gray-500">Any internal path or full URL.</p>
              </div>
            )}
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
