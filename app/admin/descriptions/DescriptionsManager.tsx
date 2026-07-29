"use client";

import { useMemo, useState } from "react";
import { Search, Check, Loader2, ExternalLink, AlignLeft } from "lucide-react";

interface ProductRow {
  id: string;
  title: string;
  slug: string;
  category: string;
  imageUrl: string;
  description: string;
  metaDescription: string;
}

// Same derivation the API uses — shown live so the admin sees the auto SEO meta.
function toMeta(desc: string): string {
  const clean = desc.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (clean.length <= 155) return clean;
  const cut = clean.slice(0, 155);
  const last = cut.lastIndexOf(" ");
  return (last > 120 ? cut.slice(0, last) : cut).trim();
}

export default function DescriptionsManager({ initialProducts }: { initialProducts: ProductRow[] }) {
  const [products, setProducts] = useState<ProductRow[]>(initialProducts);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [savedId, setSavedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [onlyMissing, setOnlyMissing] = useState(false);

  const missingCount = products.filter((p) => !p.description).length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (onlyMissing && p.description) return false;
      if (!q) return true;
      return p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    });
  }, [products, query, onlyMissing]);

  const draftFor = (p: ProductRow) => (p.id in drafts ? drafts[p.id] : p.description);
  const isDirty = (p: ProductRow) => draftFor(p).trim() !== p.description.trim();

  const save = async (p: ProductRow) => {
    const description = draftFor(p).trim();
    setSaving((s) => ({ ...s, [p.id]: true }));
    try {
      const res = await fetch("/api/admin/products/descriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id, description }),
      });
      if (!res.ok) throw new Error("save failed");
      const data = await res.json();
      setProducts((prev) =>
        prev.map((x) =>
          x.id === p.id ? { ...x, description, metaDescription: data.metaDescription || "" } : x,
        ),
      );
      setDrafts((d) => {
        const n = { ...d };
        delete n[p.id];
        return n;
      });
      setSavedId(p.id);
      setTimeout(() => setSavedId((cur) => (cur === p.id ? null : cur)), 2500);
    } catch {
      alert("Failed to save. Please try again.");
    } finally {
      setSaving((s) => ({ ...s, [p.id]: false }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
            <AlignLeft className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Product Descriptions</h1>
            <p className="text-xs text-slate-500">
              Write a unique description per product — the SEO meta description is auto-assigned from it.
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
            {products.length} products
          </span>
          <span className={`rounded-full px-2.5 py-1 font-medium ${missingCount ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
            {missingCount ? `${missingCount} missing a description` : "All have descriptions"}
          </span>
        </div>
      </header>

      <div className="sticky top-0 z-10 -mx-4 mb-4 bg-slate-50/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products…"
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
            />
          </div>
          <label className="flex select-none items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600">
            <input type="checkbox" checked={onlyMissing} onChange={(e) => setOnlyMissing(e.target.checked)} className="accent-slate-900" />
            Only missing
          </label>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((p) => {
          const draft = draftFor(p);
          const dirty = isDirty(p);
          const meta = toMeta(draft);
          return (
            <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-2.5 flex items-start gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.imageUrl} alt="" width={44} height={44} className="h-11 w-11 shrink-0 rounded-lg object-cover" loading="lazy" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-slate-900">{p.title}</p>
                    {!p.description && (
                      <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">No description</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">{p.category}</p>
                </div>
                <a href={`/product/${p.slug}`} target="_blank" rel="noopener noreferrer" className="shrink-0 text-slate-400 hover:text-slate-700" title="View product">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              <textarea
                value={draft}
                onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: e.target.value }))}
                rows={4}
                placeholder="Write a unique, specific description — strain effects, potency, size, taste, why it's premium…"
                className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 outline-none focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10"
              />

              <div className="mt-2 flex items-end justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Auto SEO meta ({meta.length}/155)</p>
                  <p className="truncate text-[11px] text-slate-500">{meta || "—"}</p>
                </div>
                <button
                  onClick={() => save(p)}
                  disabled={!dirty || saving[p.id]}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {saving[p.id] ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Saving</>
                  ) : savedId === p.id ? (
                    <><Check className="h-4 w-4" /> Saved</>
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-slate-400">No products match.</p>
        )}
      </div>
    </div>
  );
}
