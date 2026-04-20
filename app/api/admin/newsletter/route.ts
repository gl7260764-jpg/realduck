import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";

export async function GET(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const perPage = Math.min(100, Math.max(1, Number(searchParams.get("perPage")) || 50));
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const status = searchParams.get("status"); // "active" | "inactive" | null
  const format = searchParams.get("format"); // "csv" for export

  const where: {
    email?: { contains: string; mode: "insensitive" };
    active?: boolean;
  } = {};
  if (q) where.email = { contains: q, mode: "insensitive" };
  if (status === "active") where.active = true;
  else if (status === "inactive") where.active = false;

  if (format === "csv") {
    const all = await prisma.newsletterSubscriber.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    const header = "email,active,source,country,device,browser,os,confirmedAt,createdAt\n";
    const rows = all
      .map((s) =>
        [
          s.email,
          s.active ? "yes" : "no",
          s.source || "",
          s.country || "",
          s.device || "",
          s.browser || "",
          s.os || "",
          s.confirmedAt?.toISOString() || "",
          s.createdAt.toISOString(),
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");
    return new NextResponse(header + rows, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  const [total, activeCount, items] = await Promise.all([
    prisma.newsletterSubscriber.count({ where }),
    prisma.newsletterSubscriber.count({ where: { active: true } }),
    prisma.newsletterSubscriber.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  return NextResponse.json({
    items,
    total,
    activeCount,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  });
}
