"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CloudImage from "./CloudImage";
import { optimizeImage } from "@/lib/cloudinary";

interface ViewedProduct {
  slug: string;
  title: string;
  imageUrl: string;
  category: string;
  priceShip?: string;
  viewedAt: number;
}

const STORAGE_KEY = "rdd_recently_viewed";
const MAX_VIEWED = 12;

/**
 * Small, fast localStorage-based recently-viewed tracker.
 * Records every product the user opens, keeps the most recent 12,
 * exports both the recorder hook and the renderer component.
 *
 * Boosts engagement two ways:
 *  • Encourages return-to-cart by surfacing what they almost bought
 *  • Increases pages-per-session by giving them a one-click path back
 */

export function recordRecentlyViewed(p: Omit<ViewedProduct, "viewedAt">) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list: ViewedProduct[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((x) => x.slug !== p.slug);
    filtered.unshift({ ...p, viewedAt: Date.now() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, MAX_VIEWED)));
  } catch {
    // localStorage may be disabled — silently no-op
  }
}

export default function RecentlyViewed({ excludeSlug, limit = 6 }: { excludeSlug?: string; limit?: number }) {
  const [items, setItems] = useState<ViewedProduct[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const list: ViewedProduct[] = raw ? JSON.parse(raw) : [];
      setItems(list.filter((x) => x.slug !== excludeSlug).slice(0, limit));
    } catch {
      setItems([]);
    }
  }, [excludeSlug, limit]);

  if (items.length === 0) return null;

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10 border-t border-gray-100">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Recently Viewed</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Your last few clicks — pick up where you left off.</p>
        </div>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {items.map((p) => (
          <Link
            key={p.slug}
            href={`/product/${p.slug}`}
            className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <div className="aspect-square bg-gray-50 relative overflow-hidden">
              <CloudImage
                src={optimizeImage(p.imageUrl, "thumbnail")}
                alt={`Recently viewed: ${p.title}`}
                fill
                sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 16vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-2">
              <p className="text-[11px] text-gray-900 font-medium line-clamp-2 leading-tight group-hover:text-slate-700">
                {p.title}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
