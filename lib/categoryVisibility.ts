/**
 * Category visibility — read which product categories are hidden site-wide.
 *
 * Storage: SiteSetting row with key "hiddenCategories", value is a CSV of
 * enum names (e.g. "DISPOSABLES,PILLS"). Absent / empty value = none hidden.
 *
 * Admins toggle this in /admin/settings. The list is consumed by:
 *   • app/page.tsx (homepage catalog query)
 *   • app/sitemap.ts (sitemap.xml product entries)
 *   • app/product/[id]/page.tsx (direct URL → notFound() if hidden)
 *
 * Cached in-process for 60 seconds so the toggle takes effect within a
 * minute without thrashing the DB on every product list request.
 */

import prisma from "@/lib/prisma";

export const ALL_CATEGORIES = [
  "FLOWER",
  "TOP_SHELF",
  "EDIBLES",
  "CONCENTRATES",
  "PREROLLS",
  "MUSHROOM",
  "DISPOSABLES",
  "PILLS",
  "COKE",
  "OTHERS",
] as const;

export type Category = (typeof ALL_CATEGORIES)[number];

let cache: { value: Category[]; expires: number } | null = null;
const TTL_MS = 60_000;

export async function getHiddenCategories(): Promise<Category[]> {
  const now = Date.now();
  if (cache && cache.expires > now) return cache.value;
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: "hiddenCategories" } });
    const raw = row?.value ?? "";
    const list = raw
      .split(",")
      .map((s) => s.trim())
      .filter((s): s is Category => (ALL_CATEGORIES as readonly string[]).includes(s));
    cache = { value: list, expires: now + TTL_MS };
    return list;
  } catch {
    return [];
  }
}

/** Call after writing the setting so the next read picks up the new value. */
export function invalidateHiddenCategoriesCache() {
  cache = null;
}
