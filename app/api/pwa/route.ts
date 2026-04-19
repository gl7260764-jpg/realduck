import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getClientIp, getGeoInfo } from "@/lib/geo";

// Track PWA install
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, fingerprint } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    // Check for abuse — same fingerprint already used
    if (fingerprint) {
      const existing = await prisma.pwaInstall.findFirst({
        where: { fingerprint, discountUsed: true },
      });
      if (existing) {
        // Fingerprint already used discount — still track install but no new discount
        return NextResponse.json({ success: true, discountEligible: false, reason: "already_used" });
      }
    }

    const ua = request.headers.get("user-agent") || "";
    const ip = getClientIp(request);
    const geo = await getGeoInfo(ip);

    let device = "desktop";
    if (/iPad|tablet/i.test(ua)) device = "tablet";
    else if (/Mobile|iPhone|Android/i.test(ua)) device = "mobile";

    let browser = "Unknown";
    if (/Edg/i.test(ua)) browser = "Edge";
    else if (/Chrome/i.test(ua)) browser = "Chrome";
    else if (/Firefox/i.test(ua)) browser = "Firefox";
    else if (/Safari/i.test(ua)) browser = "Safari";

    let os = "Unknown";
    if (/Windows/i.test(ua)) os = "Windows";
    else if (/Mac/i.test(ua)) os = "macOS";
    else if (/iPhone|iPad/i.test(ua)) os = "iOS";
    else if (/Android/i.test(ua)) os = "Android";

    await prisma.pwaInstall.upsert({
      where: { sessionId },
      update: { fingerprint: fingerprint || null },
      create: {
        sessionId,
        fingerprint: fingerprint || null,
        device,
        browser,
        os,
        country: geo?.country || null,
      },
    });

    return NextResponse.json({ success: true, discountEligible: true });
  } catch (error) {
    console.error("PWA install track error:", error);
    return NextResponse.json({ error: "Failed to track install" }, { status: 500 });
  }
}

// Check if session has PWA discount
export async function GET(request: NextRequest) {
  const sessionId = new URL(request.url).searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ installed: false, discountEligible: false });

  try {
    const install = await prisma.pwaInstall.findUnique({ where: { sessionId } });
    if (!install) return NextResponse.json({ installed: false, discountEligible: false });

    return NextResponse.json({
      installed: true,
      discountEligible: !install.discountUsed,
      discountUsed: install.discountUsed,
    });
  } catch {
    return NextResponse.json({ installed: false, discountEligible: false });
  }
}
