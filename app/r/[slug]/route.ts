/**
 * Short-link redirect for tracked campaigns.
 *
 *   /r/<slug>  →  302 to <destination>?utm_source=...&utm_medium=...
 *
 * On every hit:
 *  - Look up the Campaign by slug
 *  - Capture the click in CampaignClick (IP, country, device, browser, referer, sessionId)
 *  - Build the final URL with the campaign's UTM params appended
 *  - Redirect 302
 *
 * sessionId is read from a cookie (`analytics_session_id`) so we can later
 * join `CampaignClick.sessionId` with `CheckoutOrder.sessionId` for revenue
 * attribution. If the cookie isn't present, we mint one and set it on the
 * outgoing response.
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getClientIp, getGeoFromRequest } from "@/lib/geo";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.realduckdistro.com";

/**
 * Bot / crawler / link-preview detector. These User-Agents prefetch any link
 * pasted into a chat or social platform to generate preview cards — they
 * inflate click counts without ever producing a real session.
 *
 * Order matters: most common first. The check is a single regex pass.
 */
const BOT_UA_REGEX = /bot|crawler|spider|crawling|preview|fetch|facebookexternalhit|telegram|whatsapp|skypeuripreview|twitter|linkedin|slack|discord|applebot|googlebot|bingbot|yandex|duckduckbot|baiduspider|embedly|pinterest|redditbot|tumblr|vkshare|w3c_validator|chatgpt|gptbot|claudebot|anthropic|perplexity|amazonbot|petalbot|semrush|ahrefs|mj12bot|dotbot|ia_archiver|archive\.org|headlesschrome/i;

function isBot(ua: string): boolean {
  if (!ua) return true; // empty UA is almost always a script/bot
  return BOT_UA_REGEX.test(ua);
}

function detectDeviceBrowserOs(ua: string): { device: string; browser: string; os: string } {
  let device = "desktop";
  if (/iPad|tablet|playbook|silk/i.test(ua)) device = "tablet";
  else if (/Mobile|iP(hone|od)|Android.*Mobile/i.test(ua)) device = "mobile";
  let browser = "Other";
  if (/Edg\//.test(ua)) browser = "Edge";
  else if (/OPR\//.test(ua) || /Opera/i.test(ua)) browser = "Opera";
  else if (/Chrome\//.test(ua) && !/Edg|OPR/.test(ua)) browser = "Chrome";
  else if (/Firefox\//.test(ua)) browser = "Firefox";
  else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) browser = "Safari";
  let os = "Other";
  if (/Windows/.test(ua)) os = "Windows";
  else if (/Mac OS X/.test(ua)) os = "macOS";
  else if (/iPhone|iPad|iPod/.test(ua)) os = "iOS";
  else if (/Android/.test(ua)) os = "Android";
  else if (/Linux/.test(ua)) os = "Linux";
  return { device, browser, os };
}

function getOrMintSessionId(request: NextRequest): { id: string; minted: boolean } {
  const existing = request.cookies.get("analytics_session_id")?.value;
  if (existing) return { id: existing, minted: false };
  // Mint a new one — same shape as the client-side mint
  const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
  return { id, minted: true };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const safeSlug = String(slug || "").slice(0, 80).toLowerCase();

  // Look up the campaign — fail closed: any error redirects to homepage
  let campaign;
  try {
    campaign = await prisma.campaign.findUnique({
      where: { slug: safeSlug },
    });
  } catch (err) {
    console.error(`[/r/${safeSlug}] DB lookup failed:`, (err as Error).message);
    return NextResponse.redirect(SITE_URL, { status: 302 });
  }

  if (!campaign || campaign.archived) {
    // Unknown or archived slug → silently redirect to home, no error to user
    return NextResponse.redirect(SITE_URL, { status: 302 });
  }

  // Build the destination URL with UTM params
  // destination is a path like "/" or "/product/raspberry-airheadz"
  const dest = new URL(campaign.destination || "/", SITE_URL);
  dest.searchParams.set("utm_source", campaign.utmSource);
  dest.searchParams.set("utm_medium", campaign.utmMedium);
  if (campaign.utmCampaign) dest.searchParams.set("utm_campaign", campaign.utmCampaign);
  if (campaign.utmContent) dest.searchParams.set("utm_content", campaign.utmContent);
  if (campaign.utmTerm) dest.searchParams.set("utm_term", campaign.utmTerm);

  const ua = request.headers.get("user-agent") || "";
  const sessionInfo = getOrMintSessionId(request);

  // Build the redirect response immediately — DO NOT await any DB or geo work.
  // Set Cache-Control to no-store so intermediaries don't cache the redirect.
  const response = NextResponse.redirect(dest.toString(), { status: 302 });
  response.headers.set("Cache-Control", "no-store, max-age=0");
  if (sessionInfo.minted) {
    response.cookies.set("analytics_session_id", sessionInfo.id, {
      httpOnly: false, // client-side analytics also reads it
      sameSite: "lax",
      secure: true,
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: "/",
    });
  }

  // Skip click logging for bots / link-preview crawlers — they don't generate
  // sessions and would inflate click counts (one paste in a group chat can
  // produce 5–20 bot prefetches before any human clicks).
  if (isBot(ua)) {
    return response;
  }

  // Fire-and-forget click logging. Geo lookup is also non-blocking — we never
  // await it on the redirect path. Vercel keeps the function alive long
  // enough for short DB writes to complete after the response flushes.
  const referer = request.headers.get("referer") || null;
  const ip = getClientIp(request);
  const { device, browser, os } = detectDeviceBrowserOs(ua);
  const campaignId = campaign.id;

  void (async () => {
    let geo = null;
    try {
      geo = await getGeoFromRequest(request);
    } catch {}
    try {
      await prisma.campaignClick.create({
        data: {
          campaignId,
          sessionId: sessionInfo.id,
          ip: geo?.ip || ip || null,
          country: geo?.country || null,
          city: geo?.city || null,
          device,
          browser,
          os,
          referer: referer ? referer.slice(0, 500) : null,
          userAgent: ua ? ua.slice(0, 500) : null,
        },
      });
    } catch (err) {
      console.error(`[/r/${safeSlug}] click insert failed:`, (err as Error).message);
    }
  })();

  return response;
}
