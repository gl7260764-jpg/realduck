/**
 * Admin Campaign management.
 *
 *   GET  /api/admin/campaigns       → list all campaigns + per-campaign stats
 *   POST /api/admin/campaigns       → create a new campaign
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
    .slice(0, 40);
}

async function ensureUniqueSlug(base: string): Promise<string> {
  const cleaned = slugify(base) || "link";
  let slug = cleaned;
  let n = 0;
  while (await prisma.campaign.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${cleaned}-${n}`;
    if (n > 50) {
      slug = `${cleaned}-${Date.now().toString(36)}`;
      break;
    }
  }
  return slug;
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
    const campaigns = await prisma.campaign.findMany({
      where: { archived: false },
      orderBy: { createdAt: "desc" },
      include: { promoter: { select: { id: true, name: true, slug: true } } },
    });

    if (campaigns.length === 0) {
      return NextResponse.json({ campaigns: [] });
    }

    // Single batch query for clicks per campaign
    const clickGroups = await prisma.campaignClick.groupBy({
      by: ["campaignId"],
      _count: { campaignId: true },
      where: { campaignId: { in: campaigns.map((c) => c.id) } },
    });
    const clicksByCampaign = new Map(
      clickGroups.map((g) => [g.campaignId, g._count.campaignId])
    );

    // Unique sessions per campaign — pull session IDs and count distinct
    const allClicks = await prisma.campaignClick.findMany({
      where: { campaignId: { in: campaigns.map((c) => c.id) }, sessionId: { not: null } },
      select: { campaignId: true, sessionId: true },
    });

    const sessionsByCampaign = new Map<string, Set<string>>();
    for (const c of allClicks) {
      if (!c.sessionId) continue;
      let set = sessionsByCampaign.get(c.campaignId);
      if (!set) { set = new Set(); sessionsByCampaign.set(c.campaignId, set); }
      set.add(c.sessionId);
    }

    // Attribution: for each campaign, find CheckoutOrders whose sessionId
    // appears in that campaign's clicks. Pull all relevant orders once.
    const allSessionIds = Array.from(
      new Set(allClicks.map((c) => c.sessionId).filter(Boolean) as string[])
    );

    const orders = allSessionIds.length > 0
      ? await prisma.checkoutOrder.findMany({
          where: { sessionId: { in: allSessionIds } },
          select: { sessionId: true, items: true, totalItems: true, createdAt: true },
        })
      : [];

    // Index orders by sessionId
    const ordersBySession = new Map<string, typeof orders>();
    for (const o of orders) {
      if (!o.sessionId) continue;
      const list = ordersBySession.get(o.sessionId) || [];
      list.push(o);
      ordersBySession.set(o.sessionId, list);
    }

    const enriched = campaigns.map((c) => {
      const clicks = clicksByCampaign.get(c.id) || 0;
      const sessions = sessionsByCampaign.get(c.id) || new Set();
      let orderCount = 0;
      let revenue = 0;
      for (const sid of sessions) {
        const orders = ordersBySession.get(sid) || [];
        for (const o of orders) {
          orderCount += 1;
          const items = (o.items as Array<{ price?: string; quantity?: number }>) || [];
          for (const it of items) {
            revenue += priceFromString(it.price) * (it.quantity || 1);
          }
        }
      }
      const conversionRate = sessions.size > 0
        ? Number(((orderCount / sessions.size) * 100).toFixed(1))
        : 0;
      return {
        id: c.id,
        slug: c.slug,
        name: c.name,
        purpose: c.purpose,
        destination: c.destination,
        utmSource: c.utmSource,
        utmMedium: c.utmMedium,
        utmCampaign: c.utmCampaign,
        utmContent: c.utmContent,
        utmTerm: c.utmTerm,
        promoter: c.promoter,
        createdAt: c.createdAt,
        shareUrl: `${SITE_URL}/r/${c.slug}`,
        stats: {
          clicks,
          uniqueSessions: sessions.size,
          orders: orderCount,
          revenue: Math.round(revenue * 100) / 100,
          conversionRate,
        },
      };
    });

    return NextResponse.json({ campaigns: enriched });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await isAuthenticated();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();

    const name = String(body.name || "").trim();
    const destination = String(body.destination || "/").trim() || "/";
    const utmSource = String(body.utmSource || "").trim().toLowerCase();
    const utmMedium = String(body.utmMedium || "").trim().toLowerCase();

    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (!utmSource) return NextResponse.json({ error: "Source is required (e.g. instagram, facebook)" }, { status: 400 });
    if (!utmMedium) return NextResponse.json({ error: "Medium is required (e.g. social, email, referral)" }, { status: 400 });

    // Normalise destination — must start with /
    const normalisedDest = destination.startsWith("/") ? destination : `/${destination}`;

    // Slug: prefer user-provided, else auto-generate from name
    const slugSeed = String(body.slug || "").trim() || name;
    const slug = await ensureUniqueSlug(slugSeed);

    // Optional: assign to a promoter. If provided, the link is owned by them
    // and rolls up into their totals.
    const promoterId = body.promoterId ? String(body.promoterId).trim() : null;
    if (promoterId) {
      const exists = await prisma.promoter.findUnique({ where: { id: promoterId }, select: { id: true } });
      if (!exists) return NextResponse.json({ error: "Unknown promoter" }, { status: 400 });
    }

    const campaign = await prisma.campaign.create({
      data: {
        slug,
        name: name.slice(0, 200),
        purpose: body.purpose?.trim()?.slice(0, 200) || null,
        destination: normalisedDest.slice(0, 500),
        utmSource: utmSource.slice(0, 60),
        utmMedium: utmMedium.slice(0, 60),
        utmCampaign: body.utmCampaign?.trim()?.toLowerCase()?.slice(0, 60) || null,
        utmContent: body.utmContent?.trim()?.toLowerCase()?.slice(0, 60) || null,
        utmTerm: body.utmTerm?.trim()?.toLowerCase()?.slice(0, 60) || null,
        promoterId,
      },
    });

    return NextResponse.json({
      ...campaign,
      shareUrl: `${SITE_URL}/r/${campaign.slug}`,
    });
  } catch (error) {
    console.error("Error creating campaign:", error);
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}
