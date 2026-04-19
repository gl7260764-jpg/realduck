import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";

export async function GET() {
  const auth = await isAuthenticated();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [
      totalInstalls,
      totalSubscribers,
      activeSubscribers,
      discountsUsed,
      recentInstalls,
      recentSubscribers,
      installsByDevice,
      installsByCountry,
    ] = await Promise.all([
      prisma.pwaInstall.count(),
      prisma.pushSubscription.count(),
      prisma.pushSubscription.count({ where: { active: true } }),
      prisma.pwaInstall.count({ where: { discountUsed: true } }),
      prisma.pwaInstall.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true, sessionId: true, device: true, browser: true,
          os: true, country: true, discountUsed: true, createdAt: true,
        },
      }),
      prisma.pushSubscription.findMany({
        where: { active: true },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true, device: true, browser: true, os: true,
          country: true, createdAt: true,
        },
      }),
      prisma.pwaInstall.groupBy({
        by: ["device"],
        _count: { device: true },
        orderBy: { _count: { device: "desc" } },
      }),
      prisma.pwaInstall.groupBy({
        by: ["country"],
        where: { country: { not: null } },
        _count: { country: true },
        orderBy: { _count: { country: "desc" } },
        take: 10,
      }),
    ]);

    return NextResponse.json({
      stats: {
        totalInstalls,
        totalSubscribers,
        activeSubscribers,
        inactiveSubscribers: totalSubscribers - activeSubscribers,
        discountsUsed,
        discountsAvailable: totalInstalls - discountsUsed,
      },
      recentInstalls,
      recentSubscribers,
      installsByDevice: installsByDevice.map((d) => ({ device: d.device || "Unknown", count: d._count.device })),
      installsByCountry: installsByCountry.map((c) => ({ country: c.country || "Unknown", count: c._count.country })),
    });
  } catch (error) {
    console.error("PWA stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
