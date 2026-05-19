"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { ALL_CATEGORIES } from "@/lib/categoryVisibility";

const LABEL: Record<string, string> = {
  FLOWER: "Flower",
  TOP_SHELF: "Top Shelf",
  EDIBLES: "Edibles",
  CONCENTRATES: "Concentrates",
  PREROLLS: "Pre-Rolls",
  MUSHROOM: "Mushroom",
  DISPOSABLES: "Disposables",
  PILLS: "Pills",
  COKE: "Coke",
  OTHERS: "Others",
};

/**
 * Compact one-line category visibility toggle. Each chip is a category;
 * click to flip visible/hidden. Auto-saves on click (optimistic update,
 * reverts on error). Lives at the top of /admin/products.
 */
export default function CategoryVisibilityToggle() {
  const [hidden, setHidden] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/category-visibility")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.hidden)) setHidden(data.hidden);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  async function toggle(cat: string) {
    if (pending) return;
    const next = hidden.includes(cat) ? hidden.filter((c) => c !== cat) : [...hidden, cat];
    const prev = hidden;
    setHidden(next); // optimistic
    setPending(cat);
    setError(null);
    try {
      const res = await fetch("/api/admin/category-visibility", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hidden: next }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Save failed");
    } catch (e) {
      setHidden(prev); // revert
      setError((e as Error).message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setPending(null);
    }
  }

  if (!loaded) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading category visibility…
      </div>
    );
  }

  const visibleCount = ALL_CATEGORIES.length - hidden.length;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Eye className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Category visibility</p>
          <span className="text-[11px] text-slate-400">·</span>
          <span className="text-[11px] text-slate-500">
            {visibleCount}/{ALL_CATEGORIES.length} live
          </span>
        </div>
        {error && <span className="text-[11px] text-red-600 truncate">{error}</span>}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {ALL_CATEGORIES.map((cat) => {
          const isHidden = hidden.includes(cat);
          const isPending = pending === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => toggle(cat)}
              disabled={!!pending}
              title={isHidden ? `${LABEL[cat]} is hidden from the site — click to show` : `${LABEL[cat]} is live — click to hide`}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11.5px] font-medium border transition-all disabled:cursor-wait ${
                isHidden
                  ? "bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200"
                  : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              {isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : isHidden ? (
                <EyeOff className="w-3 h-3" />
              ) : (
                <Eye className="w-3 h-3" />
              )}
              {LABEL[cat] || cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}
