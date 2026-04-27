import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";

export async function GET() {
  const auth = await isAuthenticated();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // "Still installed" is approximated by the PWA having opened in standalone
  // mode within the last 30 days. The client pings /api/pwa on every open and
  // bumps lastOpenedAt — so a device that has been uninstalled stops pinging
  // and falls out of the active window naturally.
  const now = Date.now();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

  try {
    const [
      totalInstalls,
      totalSubscribers,
      activeSubscribers,
      discountsUsed,
      activeInstalls7d,
      activeInstalls30d,
      recentInstalls,
      recentSubscribers,
      installsByDevice,
      installsByCountry,
      activeInstallsByCountry,
      activeInstallsByDevice,
    ] = await Promise.all([
      prisma.pwaInstall.count(),
      prisma.pushSubscription.count(),
      prisma.pushSubscription.count({ where: { active: true } }),
      prisma.pwaInstall.count({ where: { discountUsed: true } }),
      prisma.pwaInstall.count({ where: { lastOpenedAt: { gte: sevenDaysAgo } } }),
      prisma.pwaInstall.count({ where: { lastOpenedAt: { gte: thirtyDaysAgo } } }),
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
      prisma.pwaInstall.groupBy({
        by: ["country"],
        where: { country: { not: null }, lastOpenedAt: { gte: thirtyDaysAgo } },
        _count: { country: true },
        orderBy: { _count: { country: "desc" } },
        take: 20,
      }),
      prisma.pwaInstall.groupBy({
        by: ["device"],
        where: { lastOpenedAt: { gte: thirtyDaysAgo } },
        _count: { device: true },
        orderBy: { _count: { device: "desc" } },
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
        activeInstalls7d,
        activeInstalls30d,
      },
      recentInstalls,
      recentSubscribers,
      installsByDevice: installsByDevice.map((d) => ({ device: d.device || "Unknown", count: d._count.device })),
      installsByCountry: installsByCountry.map((c) => ({ country: c.country || "Unknown", count: c._count.country })),
      activeInstallsByCountry: activeInstallsByCountry.map((c) => ({ country: c.country || "Unknown", count: c._count.country })),
      activeInstallsByDevice: activeInstallsByDevice.map((d) => ({ device: d.device || "Unknown", count: d._count.device })),
    });
  } catch (error) {
    console.error("PWA stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
