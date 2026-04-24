import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getClientIp, getGeoFromRequest } from "@/lib/geo";
import { checkRateLimit } from "@/lib/rateLimit";

function parseUserAgent(ua: string) {
  const result = { device: "desktop", browser: "Unknown", os: "Unknown" };
  if (/iPad|tablet|playbook|silk/i.test(ua)) result.device = "tablet";
  else if (/Mobile|iP(hone|od)|Android.*Mobile|BlackBerry|IEMobile|Opera Mini/i.test(ua)) result.device = "mobile";
  if (/Edg\//i.test(ua)) result.browser = "Edge";
  else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) result.browser = "Opera";
  else if (/Chrome/i.test(ua) && !/Chromium/i.test(ua)) result.browser = "Chrome";
  else if (/Firefox/i.test(ua)) result.browser = "Firefox";
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) result.browser = "Safari";
  if (/Windows/i.test(ua)) result.os = "Windows";
  else if (/Macintosh|Mac OS X/i.test(ua)) result.os = "macOS";
  else if (/iPhone|iPad|iPod/i.test(ua)) result.os = "iOS";
  else if (/Android/i.test(ua)) result.os = "Android";
  else if (/Linux/i.test(ua)) result.os = "Linux";
  return result;
}

// Max string length for user-supplied fields
const MAX_LEN = 500;
function clamp(s: unknown): string {
  if (typeof s !== "string") return "";
  return s.slice(0, MAX_LEN);
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 order tracks per minute per IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") || request.ip || "unknown";
    const { allowed } = checkRateLimit("track:" + ip, 10, 60_000, 2 * 60_000);
    if (!allowed) {
      return NextResponse.json({ error: "Rate limited" }, { status: 429 });
    }

    const body = await request.json();
    const { sessionId, items } = body;

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json({ error: "Invalid session" }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0 || items.length > 50) {
      return NextResponse.json({ error: "Invalid order data" }, { status: 400 });
    }

    const userAgent = request.headers.get("user-agent") || "";
    const parsed = userAgent ? parseUserAgent(userAgent) : { device: undefined, browser: undefined, os: undefined };
    const clientIp = getClientIp(request);
    const geo = await getGeoFromRequest(request);

    await prisma.order.createMany({
      data: items.map((item: { productId?: string; title: string; category: string; price: string; deliveryType: string; quantity: number }) => ({
        sessionId: clamp(sessionId).slice(0, 100),
        productId: item.productId ? clamp(item.productId).slice(0, 100) : null,
        productTitle: clamp(item.title),
        category: clamp(item.category),
        price: clamp(item.price),
        deliveryType: clamp(item.deliveryType),
        quantity: Math.min(Math.max(Math.floor(Number(item.quantity) || 1), 1), 9999),
        country: geo?.country || null,
        state: geo?.state || null,
        city: geo?.city || null,
        zip: geo?.zip || null,
        ip: geo?.ip || clientIp || null,
        device: parsed.device,
        browser: parsed.browser,
        os: parsed.os,
      })),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking order:", error);
    return NextResponse.json({ error: "Failed to track order" }, { status: 500 });
  }
}
