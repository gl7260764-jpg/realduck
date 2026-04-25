/**
 * Promoter management — team members who bring traffic.
 *
 *   GET  /api/admin/promoters   → list promoters with rolled-up stats
 *   POST /api/admin/promoters   → create promoter + auto-create their default link
 *
 * Each promoter has one auto-created "default" tracked link
 * (slug = the promoter's slug; e.g. /r/john for "john"). They can have
 * additional links assigned to them with different purposes.
 *
 * Stats roll up across every campaign assigned to the promoter:
 * total clicks, unique sessions, attributed orders, attributed revenue.
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.realduckdistro.com";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
}

async function uniqueSlug(base: string, table: "promoter" | "campaign"): Promise<string> {
  const cleaned = slugify(base) || (table === "promoter" ? "promoter" : "link");
  let slug = cleaned;
  let n = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = table === "promoter"
      ? await prisma.promoter.findUnique({ where: { slug } })
      : await prisma.campaign.findUnique({ where: { slug } });
    if (!existing) return slug;
    n += 1;
    slug = `${cleaned}-${n}`;
    if (n > 50) return `${cleaned}-${Date.now().toString(36)}`;
  }
}

function priceFromString(s: string | null | undefined): number {
  if (!s) return 0;
  const m = s.match(/\$?([\d,]+(?:\.\d+)?)/);
  return m ? parseFloat(m[1].replace(/,/g, "")) : 0;
}

export async function GET() {
  const auth = await isAuthenticated();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const promoters = await prisma.promoter.findMany({
      where: { archived: false },
      orderBy: { createdAt: "desc" },
      include: {
        campaigns: {
          where: { archived: false },
          select: { id: true, slug: true, name: true, purpose: true, utmSource: true, utmMedium: true, destination: true, createdAt: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (promoters.length === 0) {
      return NextResponse.json({ promoters: [] });
    }

    // Pull all clicks for all of this promoter's campaigns in one query
    const allCampaignIds = promoters.flatMap((p) => p.campaigns.map((c) => c.id));
    const allClicks = allCampaignIds.length > 0
      ? await prisma.campaignClick.findMany({
          where: { campaignId: { in: allCampaignIds } },
          select: { campaignId: true, sessionId: true },
        })
      : [];

    // Index clicks by campaign
    const clickCountByCampaign = new Map<string, number>();
    const sessionsByCampaign = new Map<string, Set<string>>();
    for (const c of allClicks) {
      clickCountByCampaign.set(c.campaignId, (clickCountByCampaign.get(c.campaignId) || 0) + 1);
      if (c.sessionId) {
        let s = sessionsByCampaign.get(c.campaignId);
        if (!s) { s = new Set(); sessionsByCampaign.set(c.campaignId, s); }
        s.add(c.sessionId);
      }
    }

    // Pull orders for any session that touched a promoter's link
    const allSessionIds = Array.from(
      new Set(allClicks.map((c) => c.sessionId).filter(Boolean) as string[])
    );
    const orders = allSessionIds.length > 0
      ? await prisma.checkoutOrder.findMany({
          where: { sessionId: { in: allSessionIds } },
          select: { sessionId: true, items: true },
        })
      : [];
    const ordersBySession = new Map<string, typeof orders>();
    for (const o of orders) {
      if (!o.sessionId) continue;
      const list = ordersBySession.get(o.sessionId) || [];
      list.push(o);
      ordersBySession.set(o.sessionId, list);
    }

    const enriched = promoters.map((p) => {
      // Per-campaign stats
      const campaignsWithStats = p.campaigns.map((c) => {
        const sessions = sessionsByCampaign.get(c.id) || new Set();
        let orders = 0;
        let revenue = 0;
        for (const sid of sessions) {
          const list = ordersBySession.get(sid) || [];
          for (const o of list) {
            orders += 1;
            const items = (o.items as Array<{ price?: string; quantity?: number }>) || [];
            for (const it of items) {
              revenue += priceFromString(it.price) * (it.quantity || 1);
            }
          }
        }
        return {
          id: c.id,
          slug: c.slug,
          name: c.name,
          purpose: c.purpose,
          source: c.utmSource,
          medium: c.utmMedium,
          destination: c.destination,
          createdAt: c.createdAt,
          shareUrl: `${SITE_URL}/r/${c.slug}`,
          stats: {
            clicks: clickCountByCampaign.get(c.id) || 0,
            uniqueSessions: sessions.size,
            orders,
            revenue: Math.round(revenue * 100) / 100,
          },
        };
      });

      // Roll up across all this promoter's campaigns
      const totals = campaignsWithStats.reduce(
        (acc, c) => {
          acc.clicks += c.stats.clicks;
          acc.uniqueSessions += c.stats.uniqueSessions;
          acc.orders += c.stats.orders;
          acc.revenue += c.stats.revenue;
          return acc;
        },
        { clicks: 0, uniqueSessions: 0, orders: 0, revenue: 0 }
      );

      // Find the default link (first by createdAt, slug = promoter slug)
      const defaultLink = campaignsWithStats.find((c) => c.slug === p.slug) || campaignsWithStats[0];

      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        email: p.email,
        notes: p.notes,
        createdAt: p.createdAt,
        defaultLink: defaultLink ? defaultLink.shareUrl : `${SITE_URL}/r/${p.slug}`,
        campaigns: campaignsWithStats,
        totals: {
          clicks: totals.clicks,
          uniqueSessions: totals.uniqueSessions,
          orders: totals.orders,
          revenue: Math.round(totals.revenue * 100) / 100,
          campaignCount: campaignsWithStats.length,
        },
      };
    });

    return NextResponse.json({ promoters: enriched });
  } catch (error) {
    console.error("Error fetching promoters:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await isAuthenticated();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const slugSeed = String(body.slug || "").trim() || name;
    const slug = await uniqueSlug(slugSeed, "promoter");

    // Create promoter + auto-create their default tracked link in one transaction
    const promoter = await prisma.promoter.create({
      data: {
        slug,
        name: name.slice(0, 200),
        email: body.email?.trim()?.slice(0, 200) || null,
        notes: body.notes?.trim()?.slice(0, 1000) || null,
      },
    });

    // Auto-create the default link with the same slug as the promoter
    // so they can immediately share /r/<slug>. UTM source = their slug
    // (so any platform they share to attributes back to them).
    const linkSlug = await uniqueSlug(slug, "campaign");
    await prisma.campaign.create({
      data: {
        slug: linkSlug,
        name: `${name} — default link`,
        purpose: "Personal default link (use anywhere)",
        destination: "/",
        utmSource: slug,
        utmMedium: "referral",
        promoterId: promoter.id,
      },
    });

    return NextResponse.json({
      ...promoter,
      defaultLink: `${SITE_URL}/r/${linkSlug}`,
    });
  } catch (error) {
    console.error("Error creating promoter:", error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
