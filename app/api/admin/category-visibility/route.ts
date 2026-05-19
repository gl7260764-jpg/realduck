/**
 * Toggle which product categories are visible on the public site.
 * Storage: SiteSetting key "hiddenCategories" = CSV of category enum names.
 * Empty CSV / absent row = all categories visible.
 */

import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ALL_CATEGORIES, invalidateHiddenCategoriesCache } from "@/lib/categoryVisibility";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const row = await prisma.siteSetting.findUnique({ where: { key: "hiddenCategories" } });
  const hidden = (row?.value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => (ALL_CATEGORIES as readonly string[]).includes(s));
  return NextResponse.json({ hidden });
}

export async function PUT(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    if (!Array.isArray(body.hidden)) {
      return NextResponse.json({ error: "hidden must be an array" }, { status: 400 });
    }
    const valid = body.hidden
      .filter((v: unknown): v is string => typeof v === "string")
      .filter((v: string) => (ALL_CATEGORIES as readonly string[]).includes(v));
    const csv = Array.from(new Set(valid)).join(",");

    if (csv) {
      await prisma.siteSetting.upsert({
        where: { key: "hiddenCategories" },
        update: { value: csv },
        create: { key: "hiddenCategories", value: csv },
      });
    } else {
      await prisma.siteSetting.deleteMany({ where: { key: "hiddenCategories" } });
    }
    invalidateHiddenCategoriesCache();
    return NextResponse.json({ hidden: valid });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
