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
  lastSeenAt: string | null;
  timeOnSiteSeconds: number; // total session duration (last - first PageView)
  timeOnSiteLabel: string; // "12m 34s", "1h 5m", etc.
  verdict: string; // human-readable summary
}

function formatDuration(seconds: number): string {
  if (seconds < 1) return "< 1s";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
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
  lastSeenAt: null,
  timeOnSiteSeconds: 0,
  timeOnSiteLabel: "—",
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

  const [campaignClick, firstPageView, lastPageView, pageViewCount] = await Promise.all([
    prisma.campaignClick.findFirst({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
      include: { campaign: { include: { promoter: true } } },
    }),
    prisma.pageView.findFirst({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.pageView.findFirst({
      where: { sessionId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.pageView.count({ where: { sessionId } }),
  ]);

  // Time on site = duration between first and last recorded PageView
  let timeOnSiteSeconds = 0;
  if (firstPageView && lastPageView && firstPageView.id !== lastPageView.id) {
    timeOnSiteSeconds = Math.max(
      0,
      (lastPageView.createdAt.getTime() - firstPageView.createdAt.getTime()) / 1000
    );
  }
  const timeOnSiteLabel = pageViewCount > 0 ? formatDuration(timeOnSiteSeconds) : "—";
  const lastSeenAt = lastPageView?.createdAt.toISOString() || null;

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
    }. The visitor was redirected to ${c.destination}, browsed for ${timeOnSiteLabel} across ${pageViewCount} page view${
      pageViewCount === 1 ? "" : "s"
    }, then ordered.`;
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
      lastSeenAt,
      timeOnSiteSeconds,
      timeOnSiteLabel,
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
      }). The visitor landed on ${firstPageView.page}, browsed for ${timeOnSiteLabel} across ${pageViewCount} page view${
        pageViewCount === 1 ? "" : "s"
      }, then ordered.`;
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
        lastSeenAt,
        timeOnSiteSeconds,
        timeOnSiteLabel,
        verdict,
      };
    }

    // No UTM — categorize by referer domain
    const { channel, source } = categorizeRefererDomain(firstPageView.refererDomain);
    const verdict =
      channel === "direct"
        ? `This order came in directly — no referer was sent (typed URL, bookmark, or in-app browser). Visitor landed on ${firstPageView.page}, browsed for ${timeOnSiteLabel} across ${pageViewCount} page view${pageViewCount === 1 ? "" : "s"}, then ordered.`
        : `This order came from ${source}. Visitor landed on ${firstPageView.page}, browsed for ${timeOnSiteLabel} across ${pageViewCount} page view${pageViewCount === 1 ? "" : "s"}, then ordered.`;

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
      lastSeenAt,
      timeOnSiteSeconds,
      timeOnSiteLabel,
      firstSeenAt: firstPageView.createdAt.toISOString(),
      verdict,
    };
  }

  // Nothing usable
  return { ...EMPTY, sessionId };
}
