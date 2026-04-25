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

  // Capture the click — fire-and-forget, never block the redirect
  const sessionInfo = getOrMintSessionId(request);
  const ua = request.headers.get("user-agent") || "";
  const referer = request.headers.get("referer") || null;
  const ip = getClientIp(request);
  const { device, browser, os } = detectDeviceBrowserOs(ua);
  let geo = null;
  try {
    geo = await getGeoFromRequest(request);
  } catch {}

  prisma.campaignClick
    .create({
      data: {
        campaignId: campaign.id,
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
    })
    .catch((err) => {
      console.error(`[/r/${safeSlug}] click insert failed:`, err.message);
    });

  // Build response and set the session cookie if we minted a new one
  const response = NextResponse.redirect(dest.toString(), { status: 302 });
  if (sessionInfo.minted) {
    response.cookies.set("analytics_session_id", sessionInfo.id, {
      httpOnly: false, // client-side analytics also reads it
      sameSite: "lax",
      secure: true,
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: "/",
    });
  }
  return response;
}
