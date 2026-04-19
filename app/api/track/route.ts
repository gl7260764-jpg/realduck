import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function parseUserAgent(ua: string) {
  const result = { device: "desktop", browser: "Unknown", os: "Unknown" };

  // Device detection
  if (/iPad|tablet|playbook|silk/i.test(ua)) {
    result.device = "tablet";
  } else if (/Mobile|iP(hone|od)|Android.*Mobile|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    result.device = "mobile";
  }

  // Browser detection
  if (/Edg\//i.test(ua)) result.browser = "Edge";
  else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) result.browser = "Opera";
  else if (/SamsungBrowser/i.test(ua)) result.browser = "Samsung Browser";
  else if (/Chrome/i.test(ua) && !/Chromium/i.test(ua)) result.browser = "Chrome";
  else if (/Firefox/i.test(ua)) result.browser = "Firefox";
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) result.browser = "Safari";
  else if (/MSIE|Trident/i.test(ua)) result.browser = "IE";

  // OS detection
  if (/Windows/i.test(ua)) result.os = "Windows";
  else if (/Macintosh|Mac OS X/i.test(ua)) result.os = "macOS";
  else if (/iPhone|iPad|iPod/i.test(ua)) result.os = "iOS";
  else if (/Android/i.test(ua)) result.os = "Android";
  else if (/Linux/i.test(ua)) result.os = "Linux";
  else if (/CrOS/i.test(ua)) result.os = "ChromeOS";

  return result;
}

function extractDomain(referer: string | undefined): string | undefined {
  if (!referer) return undefined;
  try {
    const url = new URL(referer);
    return url.hostname;
  } catch {
    return undefined;
  }
}

function getClientIp(request: NextRequest): string | null {
  // Check common proxy headers
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return null;
}

// Simple in-memory cache for geo lookups to avoid hitting the API too often
const geoCache = new Map<string, { country: string; city: string; expiry: number }>();

async function getGeoInfo(ip: string): Promise<{ country: string; city: string } | null> {
  if (!ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
    return null;
  }

  // Check cache (5 min TTL)
  const cached = geoCache.get(ip);
  if (cached && cached.expiry > Date.now()) {
    return { country: cached.country, city: cached.city };
  }

  try {
    const res = await fetch(`https://ip-api.com/json/${ip}?fields=country,city`, {
      signal: AbortSignal.timeout(2000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.country) {
        const result = { country: data.country, city: data.city || "" };
        geoCache.set(ip, { ...result, expiry: Date.now() + 5 * 60 * 1000 });
        // Limit cache size
        if (geoCache.size > 1000) {
          const firstKey = geoCache.keys().next().value;
          if (firstKey) geoCache.delete(firstKey);
        }
        return result;
      }
    }
  } catch {
    // Geo lookup failed - non-critical, just skip
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    // Skip tracking from localhost and Vercel preview deploys
    const host = request.headers.get("host") || "";
    if (host.includes("localhost") || host.includes("127.0.0.1") || host.includes("vercel.app")) {
      return NextResponse.json({ success: true, skipped: true });
    }

    const body = await request.json();
    const { type, page, productId, sessionId } = body;

    // Skip admin page tracking
    if (page && page.startsWith("/admin")) {
      return NextResponse.json({ success: true, skipped: true });
    }

    const userAgent = request.headers.get("user-agent") || undefined;
    const referer = request.headers.get("referer") || undefined;
    const refererDomain = extractDomain(referer);

    const parsed = userAgent ? parseUserAgent(userAgent) : { device: undefined, browser: undefined, os: undefined };

    // Get geo info from IP (non-blocking - don't fail tracking if geo fails)
    const ip = getClientIp(request);
    const geo = ip ? await getGeoInfo(ip) : null;

    if (type === "pageview" && page) {
      await prisma.pageView.create({
        data: {
          page,
          userAgent,
          referer,
          refererDomain,
          sessionId: sessionId || undefined,
          device: parsed.device,
          browser: parsed.browser,
          os: parsed.os,
          country: geo?.country || undefined,
          city: geo?.city || undefined,
        },
      });
    } else if (type === "productview" && productId) {
      await prisma.productView.create({
        data: {
          productId,
          userAgent,
          referer,
          refererDomain,
          sessionId: sessionId || undefined,
          device: parsed.device,
          browser: parsed.browser,
          os: parsed.os,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking event:", error);
    return NextResponse.json({ error: "Failed to track event" }, { status: 500 });
  }
}
