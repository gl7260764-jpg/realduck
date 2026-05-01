/**
 * Trace an order's session back to its true source.
 *
 * For a given sessionId, looks up:
 *   - Tracked-link click(s) on /r/<slug> (Campaign + UTM tags)
 *   - First PageView the session ever made (entry page + referer)
 *   - UTM params encoded in the entry-page URL
 *
 * Returns a structured `OrderAttribution` object plus a human-readable
 * `verdict` string suitable for display directly in the admin UI.
 *
 * Cheap: 2 queries per session. Safe to call inline in the admin orders API.
 */

import prisma from "./prisma";

export interface OrderAttribution {
  sessionId: string | null;
  source: string; // "Motion (tracked link)", "Google Search", "Direct", etc.
  channel: "tracked-link" | "search" | "social" | "direct" | "internal" | "unknown";
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  campaignName: string | null;
  campaignSlug: string | null;
  promoterName: string | null;
  entryPage: string | null;
  refererDomain: string | null;
  pageViewCount: number;
  firstSeenAt: string | null;
  verdict: string; // human-readable summary
}

const EMPTY: OrderAttribution = {
  sessionId: null,
  source: "Unknown",
  channel: "unknown",
  utmSource: null,
  utmMedium: null,
  utmCampaign: null,
  campaignName: null,
  campaignSlug: null,
  promoterName: null,
  entryPage: null,
  refererDomain: null,
  pageViewCount: 0,
  firstSeenAt: null,
  verdict: "No session data — source can't be determined for this order.",
};

function categorizeRefererDomain(d: string | null | undefined): {
  channel: OrderAttribution["channel"];
  source: string;
} {
  if (!d || d === "") return { channel: "direct", source: "Direct (typed URL or bookmark)" };
  const lower = d.toLowerCase();
  if (lower.includes("realduckdistro")) return { channel: "internal", source: "Internal navigation" };
  if (lower.includes("google.")) return { channel: "search", source: "Google Search" };
  if (lower.includes("bing.")) return { channel: "search", source: "Bing Search" };
  if (lower.includes("duckduckgo.")) return { channel: "search", source: "DuckDuckGo Search" };
  if (lower.includes("yandex.")) return { channel: "search", source: "Yandex Search" };
  if (lower.includes("yahoo.")) return { channel: "search", source: "Yahoo Search" };
  if (lower.includes("t.co") || lower.includes("twitter") || lower.includes("x.com"))
    return { channel: "social", source: "Twitter / X" };
  if (lower.includes("facebook") || lower.includes("fb.")) return { channel: "social", source: "Facebook" };
  if (lower.includes("instagram")) return { channel: "social", source: "Instagram" };
  if (lower.includes("t.me") || lower.includes("telegram")) return { channel: "social", source: "Telegram" };
  if (lower.includes("whatsapp") || lower.includes("wa.me")) return { channel: "social", source: "WhatsApp" };
  if (lower.includes("snapchat")) return { channel: "social", source: "Snapchat" };
  if (lower.includes("reddit")) return { channel: "social", source: "Reddit" };
  if (lower.includes("tiktok")) return { channel: "social", source: "TikTok" };
  if (lower.includes("youtube")) return { channel: "social", source: "YouTube" };
  return { channel: "unknown", source: `Referral: ${d}` };
}

function extractUtm(url: string | null | undefined): {
  source: string | null;
  medium: string | null;
  campaign: string | null;
} {
  if (!url) return { source: null, medium: null, campaign: null };
  try {
    const u = new URL(url, "https://placeholder.example");
    return {
      source: u.searchParams.get("utm_source"),
      medium: u.searchParams.get("utm_medium"),
      campaign: u.searchParams.get("utm_campaign"),
    };
  } catch {
    return { source: null, medium: null, campaign: null };
  }
}

export async function getOrderAttribution(sessionId: string | null): Promise<OrderAttribution> {
  if (!sessionId) return EMPTY;

  const [campaignClick, firstPageView, pageViewCount] = await Promise.all([
    prisma.campaignClick.findFirst({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
      include: { campaign: { include: { promoter: true } } },
    }),
    prisma.pageView.findFirst({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.pageView.count({ where: { sessionId } }),
  ]);

  // Highest-confidence: tracked /r/<slug> click recorded for this session
  if (campaignClick) {
    const c = campaignClick.campaign;
    const promoterName = c.promoter?.name || null;
    const source = promoterName
      ? `${promoterName} (tracked link /r/${c.slug})`
      : `${c.utmSource}/${c.utmMedium} (tracked link /r/${c.slug})`;
    const verdict = `This order came from ${
      promoterName ? `your "${promoterName}" promoter` : `the ${c.utmSource}/${c.utmMedium} channel`
    } via the tracked short link /r/${c.slug}. UTM tags: source=${c.utmSource}, medium=${c.utmMedium}${
      c.utmCampaign ? `, campaign=${c.utmCampaign}` : ""
    }. The visitor was redirected to ${c.destination}, then ordered after ${pageViewCount} page view${
      pageViewCount === 1 ? "" : "s"
    }.`;
    return {
      sessionId,
      source,
      channel: "tracked-link",
      utmSource: c.utmSource,
      utmMedium: c.utmMedium,
      utmCampaign: c.utmCampaign,
      campaignName: c.name,
      campaignSlug: c.slug,
      promoterName,
      entryPage: firstPageView?.page || c.destination || null,
      refererDomain: campaignClick.referer || null,
      pageViewCount,
      firstSeenAt: campaignClick.createdAt.toISOString(),
      verdict,
    };
  }

  // Fallback: walk back through PageView. Check the page URL itself for
  // UTM params (common when the click row didn't get logged but UTM
  // params were forwarded onto the landing page) before falling back to
  // the referer-domain category.
  if (firstPageView) {
    const utmFromPage = extractUtm(firstPageView.page);
    const utmFromReferer = extractUtm(firstPageView.referer);
    const utmSource = utmFromPage.source || utmFromReferer.source;
    const utmMedium = utmFromPage.medium || utmFromReferer.medium;
    const utmCampaign = utmFromPage.campaign || utmFromReferer.campaign;

    if (utmSource) {
      // Try to find a Campaign matching these UTMs to surface the promoter name
      const campaign = await prisma.campaign.findFirst({
        where: {
          utmSource: { equals: utmSource, mode: "insensitive" },
          ...(utmMedium ? { utmMedium: { equals: utmMedium, mode: "insensitive" } } : {}),
        },
        include: { promoter: true },
      });
      const promoterName = campaign?.promoter?.name || null;
      const source = promoterName
        ? `${promoterName} (UTM: ${utmSource}/${utmMedium || "?"})`
        : `UTM-tagged: ${utmSource}/${utmMedium || "?"}`;
      const verdict = `This order came from ${
        promoterName ? `your "${promoterName}" promoter` : `a "${utmSource}" tagged link`
      } (UTM source=${utmSource}${utmMedium ? `, medium=${utmMedium}` : ""}${
        utmCampaign ? `, campaign=${utmCampaign}` : ""
      }). The visitor landed on ${firstPageView.page}, then ordered after ${pageViewCount} page view${
        pageViewCount === 1 ? "" : "s"
      }.`;
      return {
        sessionId,
        source,
        channel: "tracked-link",
        utmSource,
        utmMedium,
        utmCampaign,
        campaignName: campaign?.name || null,
        campaignSlug: campaign?.slug || null,
        promoterName,
        entryPage: firstPageView.page,
        refererDomain: firstPageView.refererDomain,
        pageViewCount,
        firstSeenAt: firstPageView.createdAt.toISOString(),
        verdict,
      };
    }

    // No UTM — categorize by referer domain
    const { channel, source } = categorizeRefererDomain(firstPageView.refererDomain);
    const verdict =
      channel === "direct"
        ? `This order came in directly — no referer was sent (typed URL, bookmark, or in-app browser). Visitor landed on ${firstPageView.page} and ordered after ${pageViewCount} page view${pageViewCount === 1 ? "" : "s"}.`
        : `This order came from ${source}. Visitor landed on ${firstPageView.page} and ordered after ${pageViewCount} page view${pageViewCount === 1 ? "" : "s"}.`;

    return {
      sessionId,
      source,
      channel,
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      campaignName: null,
      campaignSlug: null,
      promoterName: null,
      entryPage: firstPageView.page,
      refererDomain: firstPageView.refererDomain,
      pageViewCount,
      firstSeenAt: firstPageView.createdAt.toISOString(),
      verdict,
    };
  }

  // Nothing usable
  return { ...EMPTY, sessionId };
}
