import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "7d";

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    let rangeDays: number;
    switch (range) {
      case "24h": rangeDays = 1; break;
      case "30d": rangeDays = 30; break;
      case "90d": rangeDays = 90; break;
      default: rangeDays = 7;
    }

    const rangeStart = range === "24h"
      ? new Date(now.getTime() - 24 * 60 * 60 * 1000)
      : new Date(today.getTime() - rangeDays * 24 * 60 * 60 * 1000);
    const prevRangeStart = new Date(rangeStart.getTime() - rangeDays * 24 * 60 * 60 * 1000);

    // === BATCH 1: All counts in parallel ===
    const [
      totalPageViews,
      todayPageViews,
      yesterdayPageViews,
      rangePageViews,
      prevRangePageViews,
      totalProductViews,
      todayProductViews,
      rangeProductViews,
      prevRangeProductViews,
      realtimeViews,
      totalProducts,
      soldOutProducts,
      inStockProducts,
    ] = await Promise.all([
      prisma.pageView.count(),
      prisma.pageView.count({ where: { createdAt: { gte: today } } }),
      prisma.pageView.count({ where: { createdAt: { gte: yesterday, lt: today } } }),
      prisma.pageView.count({ where: { createdAt: { gte: rangeStart } } }),
      prisma.pageView.count({ where: { createdAt: { gte: prevRangeStart, lt: rangeStart } } }),
      prisma.productView.count(),
      prisma.productView.count({ where: { createdAt: { gte: today } } }),
      prisma.productView.count({ where: { createdAt: { gte: rangeStart } } }),
      prisma.productView.count({ where: { createdAt: { gte: prevRangeStart, lt: rangeStart } } }),
      prisma.pageView.count({ where: { createdAt: { gte: fiveMinutesAgo } } }),
      prisma.product.count(),
      prisma.product.count({ where: { isSoldOut: true } }),
      prisma.product.count({ where: { isSoldOut: false } }),
    ]);

    // === BATCH 2: All groupBy queries + unique visitors + bulk data in parallel ===
    const [
      uniqueVisitorsRange,
      uniqueVisitorsPrev,
      uniqueVisitorsToday,
      topProducts,
      deviceBreakdown,
      browserBreakdown,
      osBreakdown,
      countryBreakdown,
      referrerBreakdown,
      productsByCategory,
      rangePageViewsRaw,
      rangeProductViewsRaw,
    ] = await Promise.all([
      prisma.pageView.findMany({
        where: { createdAt: { gte: rangeStart }, sessionId: { not: null } },
        distinct: ["sessionId"],
        select: { sessionId: true },
      }),
      prisma.pageView.findMany({
        where: { createdAt: { gte: prevRangeStart, lt: rangeStart }, sessionId: { not: null } },
        distinct: ["sessionId"],
        select: { sessionId: true },
      }),
      prisma.pageView.findMany({
        where: { createdAt: { gte: today }, sessionId: { not: null } },
        distinct: ["sessionId"],
        select: { sessionId: true },
      }),
      prisma.productView.groupBy({
        by: ["productId"],
        where: { createdAt: { gte: rangeStart } },
        _count: { productId: true },
        orderBy: { _count: { productId: "desc" } },
        take: 10,
      }),
      prisma.pageView.groupBy({
        by: ["device"],
        where: { createdAt: { gte: rangeStart }, device: { not: null } },
        _count: { device: true },
        orderBy: { _count: { device: "desc" } },
      }),
      prisma.pageView.groupBy({
        by: ["browser"],
        where: { createdAt: { gte: rangeStart }, browser: { not: null } },
        _count: { browser: true },
        orderBy: { _count: { browser: "desc" } },
      }),
      prisma.pageView.groupBy({
        by: ["os"],
        where: { createdAt: { gte: rangeStart }, os: { not: null } },
        _count: { os: true },
        orderBy: { _count: { os: "desc" } },
      }),
      prisma.pageView.groupBy({
        by: ["country"],
        where: { createdAt: { gte: rangeStart }, country: { not: null } },
        _count: { country: true },
        orderBy: { _count: { country: "desc" } },
        take: 15,
      }),
      prisma.pageView.groupBy({
        by: ["refererDomain"],
        where: { createdAt: { gte: rangeStart }, refererDomain: { not: null } },
        _count: { refererDomain: true },
        orderBy: { _count: { refererDomain: "desc" } },
        take: 10,
      }),
      prisma.product.groupBy({
        by: ["category"],
        _count: { category: true },
        orderBy: { _count: { category: "desc" } },
      }),
      // Fetch raw timestamps for time-series (instead of N individual count queries)
      prisma.pageView.findMany({
        where: { createdAt: { gte: rangeStart } },
        select: { createdAt: true },
      }),
      prisma.productView.findMany({
        where: { createdAt: { gte: rangeStart } },
        select: { createdAt: true },
      }),
    ]);

    // === BUILD TIME SERIES IN-MEMORY ===
    let viewsByPeriod;
    if (range === "24h") {
      // Hourly buckets
      const pageByHour = new Map<number, number>();
      const productByHour = new Map<number, number>();

      for (const pv of rangePageViewsRaw) {
        const h = new Date(pv.createdAt).getHours();
        pageByHour.set(h, (pageByHour.get(h) || 0) + 1);
      }
      for (const pv of rangeProductViewsRaw) {
        const h = new Date(pv.createdAt).getHours();
        productByHour.set(h, (productByHour.get(h) || 0) + 1);
      }

      viewsByPeriod = Array.from({ length: 24 }, (_, i) => {
        const hourStart = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
        hourStart.setMinutes(0, 0, 0);
        const h = hourStart.getHours();
        return {
          date: hourStart.toISOString(),
          label: hourStart.toLocaleTimeString("en-US", { hour: "numeric", hour12: true }),
          pageViews: pageByHour.get(h) || 0,
          productViews: productByHour.get(h) || 0,
        };
      });
    } else {
      // Daily buckets
      const pageByDay = new Map<string, number>();
      const productByDay = new Map<string, number>();

      for (const pv of rangePageViewsRaw) {
        const d = new Date(pv.createdAt).toISOString().split("T")[0];
        pageByDay.set(d, (pageByDay.get(d) || 0) + 1);
      }
      for (const pv of rangeProductViewsRaw) {
        const d = new Date(pv.createdAt).toISOString().split("T")[0];
        productByDay.set(d, (productByDay.get(d) || 0) + 1);
      }

      viewsByPeriod = Array.from({ length: rangeDays }, (_, i) => {
        const dayStart = new Date(today.getTime() - (rangeDays - 1 - i) * 24 * 60 * 60 * 1000);
        const key = dayStart.toISOString().split("T")[0];
        return {
          date: key,
          label: dayStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          pageViews: pageByDay.get(key) || 0,
          productViews: productByDay.get(key) || 0,
        };
      });
    }

    // === TOP PRODUCTS WITH DETAILS (single batch query) ===
    const productIds = topProducts.map((p) => p.productId);
    const productDetails = productIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, title: true, category: true, imageUrl: true, priceLocal: true, isSoldOut: true },
        })
      : [];

    const productMap = new Map(productDetails.map((p) => [p.id, p]));
    const topProductsWithDetails = topProducts
      .map((p) => {
        const product = productMap.get(p.productId);
        return product ? { ...product, views: p._count.productId } : null;
      })
      .filter(Boolean);

    // === ORDER ANALYTICS ===
    const [
      totalOrders,
      rangeOrders,
      prevRangeOrders,
      todayOrders,
      ordersByCity,
      ordersByCountry,
      topOrderedProducts,
      recentOrders,
      uniqueCustomersRange,
      recentCheckoutOrders,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: rangeStart } } }),
      prisma.order.count({ where: { createdAt: { gte: prevRangeStart, lt: rangeStart } } }),
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.order.groupBy({
        by: ["city"],
        where: { createdAt: { gte: rangeStart }, city: { not: null } },
        _count: { city: true },
        orderBy: { _count: { city: "desc" } },
        take: 10,
      }),
      prisma.order.groupBy({
        by: ["country"],
        where: { createdAt: { gte: rangeStart }, country: { not: null } },
        _count: { country: true },
        orderBy: { _count: { country: "desc" } },
        take: 10,
      }),
      prisma.order.groupBy({
        by: ["productTitle"],
        where: { createdAt: { gte: rangeStart } },
        _count: { productTitle: true },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 10,
      }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          productTitle: true,
          category: true,
          price: true,
          deliveryType: true,
          quantity: true,
          country: true,
          state: true,
          city: true,
          zip: true,
          ip: true,
          device: true,
          sessionId: true,
          createdAt: true,
        },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: rangeStart } },
        distinct: ["sessionId"],
        select: { sessionId: true },
      }),
      prisma.checkoutOrder.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
        select: {
          orderNumber: true,
          firstName: true,
          lastName: true,
          email: true,
          country: true,
          state: true,
          city: true,
          ipCountry: true,
          ipState: true,
          ipCity: true,
          ipZip: true,
          ipAddress: true,
          totalItems: true,
          paymentMethod: true,
          orderSource: true,
          status: true,
          items: true,
          createdAt: true,
        },
      }),
    ]);

    // === CONVERSION ANALYTICS: Connect pageViews → orders via sessionId ===
    // Find sessions that placed checkout orders in this range
    const checkoutOrderSessions = await prisma.checkoutOrder.findMany({
      where: { createdAt: { gte: rangeStart }, sessionId: { not: null } },
      select: { sessionId: true, paymentMethod: true, totalItems: true, items: true, ipCountry: true, createdAt: true },
    });
    const prevCheckoutOrderSessions = await prisma.checkoutOrder.findMany({
      where: { createdAt: { gte: prevRangeStart, lt: rangeStart }, sessionId: { not: null } },
      select: { sessionId: true },
    });

    const convertedSessionIds = new Set(checkoutOrderSessions.map((o) => o.sessionId));

    // Match converted sessions back to their first page view to get referrer, device, country
    const conversionSources = convertedSessionIds.size > 0
      ? await prisma.pageView.findMany({
          where: { sessionId: { in: Array.from(convertedSessionIds) as string[] } },
          distinct: ["sessionId"],
          orderBy: { createdAt: "asc" },
          select: { sessionId: true, refererDomain: true, device: true, country: true },
        })
      : [];

    // Build conversion breakdowns
    const convByReferrer = new Map<string, number>();
    const convByDevice = new Map<string, number>();
    const convByCountry = new Map<string, number>();
    for (const cv of conversionSources) {
      const ref = cv.refererDomain || "Direct";
      const dev = cv.device || "Unknown";
      const cty = cv.country || "Unknown";
      convByReferrer.set(ref, (convByReferrer.get(ref) || 0) + 1);
      convByDevice.set(dev, (convByDevice.get(dev) || 0) + 1);
      convByCountry.set(cty, (convByCountry.get(cty) || 0) + 1);
    }

    // Revenue estimation from checkout orders
    let rangeRevenue = 0;
    for (const order of checkoutOrderSessions) {
      const items = order.items as { price?: string; quantity?: number }[];
      if (Array.isArray(items)) {
        for (const item of items) {
          const m = String(item.price || "").match(/\$?([\d,]+(?:\.\d+)?)/);
          if (m) rangeRevenue += parseFloat(m[1].replace(",", "")) * (item.quantity || 1);
        }
      }
    }

    // Payment method breakdown
    const paymentBreakdown = new Map<string, number>();
    for (const o of checkoutOrderSessions) {
      const pm = o.paymentMethod || "unknown";
      paymentBreakdown.set(pm, (paymentBreakdown.get(pm) || 0) + 1);
    }

    // === GROWTH CALCULATIONS ===
    const calcGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Number((((current - previous) / previous) * 100).toFixed(1));
    };

    // Conversion rate: unique sessions that ordered / unique visitors
    const orderConversionRate = uniqueVisitorsRange.length > 0
      ? Number(((convertedSessionIds.size / uniqueVisitorsRange.length) * 100).toFixed(2))
      : 0;

    const viewToProductRate = rangePageViews > 0
      ? Number(((rangeProductViews / rangePageViews) * 100).toFixed(1))
      : 0;
    const avgViewsPerDay = rangeDays > 0 ? Math.round(rangePageViews / rangeDays) : 0;

    // ── TRACKED LINK ANALYTICS ─────────────────────────────────────
    // Aggregate clicks/sessions/orders/revenue per Campaign within the
    // selected date range. Same attribution model as /admin/links: join
    // CampaignClick.sessionId against CheckoutOrder.sessionId.
    const [activeCampaigns, rangeCampaignClicks] = await Promise.all([
      prisma.campaign.findMany({
        where: { archived: false },
        select: { id: true, slug: true, name: true, utmSource: true, utmMedium: true, destination: true },
      }),
      prisma.campaignClick.findMany({
        where: { createdAt: { gte: rangeStart } },
        select: { campaignId: true, sessionId: true },
      }),
    ]);

    // Sessions per campaign (within range)
    const sessionsByCampaign = new Map<string, Set<string>>();
    const clicksByCampaign = new Map<string, number>();
    for (const c of rangeCampaignClicks) {
      clicksByCampaign.set(c.campaignId, (clicksByCampaign.get(c.campaignId) || 0) + 1);
      if (c.sessionId) {
        let set = sessionsByCampaign.get(c.campaignId);
        if (!set) { set = new Set(); sessionsByCampaign.set(c.campaignId, set); }
        set.add(c.sessionId);
      }
    }

    // Pull all CheckoutOrders whose sessionId matches any campaign click
    const allCampaignSessionIds = Array.from(
      new Set(rangeCampaignClicks.map((c) => c.sessionId).filter(Boolean) as string[])
    );
    const ordersForCampaigns = allCampaignSessionIds.length > 0
      ? await prisma.checkoutOrder.findMany({
          where: { sessionId: { in: allCampaignSessionIds }, createdAt: { gte: rangeStart } },
          select: { sessionId: true, items: true },
        })
      : [];
    const ordersBySession = new Map<string, typeof ordersForCampaigns>();
    for (const o of ordersForCampaigns) {
      if (!o.sessionId) continue;
      const list = ordersBySession.get(o.sessionId) || [];
      list.push(o);
      ordersBySession.set(o.sessionId, list);
    }

    // Pull active campaigns WITH promoter info so we can roll up per-person
    const campaignsWithPromoter = await prisma.campaign.findMany({
      where: { archived: false },
      select: {
        id: true, slug: true, name: true, utmSource: true, utmMedium: true, destination: true,
        promoter: { select: { id: true, name: true, slug: true } },
      },
    });
    void activeCampaigns; // keep for future use; we now use the promoter-included list

    const trackedLinks = campaignsWithPromoter
      .map((camp) => {
        const sessions = sessionsByCampaign.get(camp.id) || new Set();
        let orders = 0;
        let revenue = 0;
        for (const sid of sessions) {
          const sOrders = ordersBySession.get(sid) || [];
          for (const o of sOrders) {
            orders += 1;
            const items = (o.items as Array<{ price?: string; quantity?: number }>) || [];
            for (const it of items) {
              const m = String(it.price || "").match(/\$?([\d,]+(?:\.\d+)?)/);
              if (m) revenue += parseFloat(m[1].replace(/,/g, "")) * (it.quantity || 1);
            }
          }
        }
        return {
          id: camp.id,
          slug: camp.slug,
          name: camp.name,
          source: camp.utmSource,
          medium: camp.utmMedium,
          destination: camp.destination,
          promoter: camp.promoter,
          clicks: clicksByCampaign.get(camp.id) || 0,
          uniqueSessions: sessions.size,
          orders,
          revenue: Math.round(revenue * 100) / 100,
        };
      })
      .filter((c) => c.clicks > 0)
      .sort((a, b) => b.clicks - a.clicks);

    // Roll up by promoter for the "Traffic by Team Member" view
    const promoterTotals = new Map<string, {
      id: string; name: string; slug: string;
      clicks: number; uniqueSessions: number; orders: number; revenue: number; linkCount: number;
    }>();
    for (const link of trackedLinks) {
      if (!link.promoter) continue;
      const key = link.promoter.id;
      const existing = promoterTotals.get(key);
      if (existing) {
        existing.clicks += link.clicks;
        existing.uniqueSessions += link.uniqueSessions;
        existing.orders += link.orders;
        existing.revenue += link.revenue;
        existing.linkCount += 1;
      } else {
        promoterTotals.set(key, {
          id: link.promoter.id,
          name: link.promoter.name,
          slug: link.promoter.slug,
          clicks: link.clicks,
          uniqueSessions: link.uniqueSessions,
          orders: link.orders,
          revenue: link.revenue,
          linkCount: 1,
        });
      }
    }
    const trafficByPromoter = Array.from(promoterTotals.values())
      .map((p) => ({ ...p, revenue: Math.round(p.revenue * 100) / 100 }))
      .sort((a, b) => b.clicks - a.clicks);

    return NextResponse.json({
      overview: {
        totalPageViews,
        todayPageViews,
        yesterdayPageViews,
        rangePageViews,
        totalProductViews,
        todayProductViews,
        rangeProductViews,
        uniqueVisitors: uniqueVisitorsRange.length,
        uniqueVisitorsToday: uniqueVisitorsToday.length,
        realtimeViews,
        avgViewsPerDay,
        conversionRate: viewToProductRate,
        orderConversionRate,
        growth: {
          pageViews: calcGrowth(rangePageViews, prevRangePageViews),
          productViews: calcGrowth(rangeProductViews, prevRangeProductViews),
          uniqueVisitors: calcGrowth(uniqueVisitorsRange.length, uniqueVisitorsPrev.length),
          orders: calcGrowth(checkoutOrderSessions.length, prevCheckoutOrderSessions.length),
        },
      },
      viewsByPeriod,
      topProducts: topProductsWithDetails,

      deviceBreakdown: deviceBreakdown.map((d) => ({ device: d.device || "Unknown", count: d._count.device })),
      browserBreakdown: browserBreakdown.map((b) => ({ browser: b.browser || "Unknown", count: b._count.browser })),
      osBreakdown: osBreakdown.map((o) => ({ os: o.os || "Unknown", count: o._count.os })),
      referrers: referrerBreakdown.map((r) => ({ domain: r.refererDomain || "Direct", count: r._count.refererDomain })),
      trackedLinks,
      trafficByPromoter,
      countryBreakdown: countryBreakdown.map((c) => ({ country: c.country || "Unknown", count: c._count.country })),
      inventory: {
        totalProducts,
        soldOutProducts,
        inStockProducts,
        productsByCategory: productsByCategory.map((p) => ({ category: p.category, count: p._count.category })),
      },
      conversions: {
        checkoutOrders: checkoutOrderSessions.length,
        revenue: Math.round(rangeRevenue * 100) / 100,
        orderConversionRate,
        avgOrderValue: checkoutOrderSessions.length > 0
          ? Math.round((rangeRevenue / checkoutOrderSessions.length) * 100) / 100
          : 0,
        byReferrer: Array.from(convByReferrer, ([source, count]) => ({ source, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10),
        byDevice: Array.from(convByDevice, ([device, count]) => ({ device, count }))
          .sort((a, b) => b.count - a.count),
        byCountry: Array.from(convByCountry, ([country, count]) => ({ country, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10),
        byPaymentMethod: Array.from(paymentBreakdown, ([method, count]) => ({ method, count }))
          .sort((a, b) => b.count - a.count),
        growth: calcGrowth(checkoutOrderSessions.length, prevCheckoutOrderSessions.length),
      },
      orders: {
        totalOrders,
        rangeOrders,
        todayOrders,
        uniqueCustomers: uniqueCustomersRange.length,
        growth: calcGrowth(rangeOrders, prevRangeOrders),
        byCity: ordersByCity.map((c) => ({ city: c.city || "Unknown", count: c._count.city })),
        byCountry: ordersByCountry.map((c) => ({ country: c.country || "Unknown", count: c._count.country })),
        topProducts: topOrderedProducts.map((p) => ({
          title: p.productTitle,
          orders: p._count.productTitle,
          totalQuantity: p._sum.quantity || 0,
        })),
        recent: recentOrders,
        recentCheckout: recentCheckoutOrders,
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
