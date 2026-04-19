import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";

export async function GET(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.ip ||
    "unknown";

  // Rate limit: 15 lookups per minute per IP
  const { allowed } = checkRateLimit("lookup:" + ip, 15, 60_000, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const orderNumber = request.nextUrl.searchParams.get("order");
  const email = request.nextUrl.searchParams.get("email");

  if (!orderNumber || !email) {
    return NextResponse.json(
      { error: "Order number and email are required" },
      { status: 400 }
    );
  }

  // Validate order number format (NP- followed by alphanumeric)
  if (!/^NP-[A-Z0-9-]{3,20}$/i.test(orderNumber.trim())) {
    return NextResponse.json({ error: "Invalid order number format" }, { status: 400 });
  }

  try {
    const order = await prisma.checkoutOrder.findFirst({
      where: {
        orderNumber: { equals: orderNumber.trim(), mode: "insensitive" },
        email: email.trim().toLowerCase(),
      },
      select: {
        orderNumber: true,
        firstName: true,
        status: true,
        paymentMethod: true,
        totalItems: true,
        items: true,
        createdAt: true,
        updatedAt: true,
        city: true,
        state: true,
        country: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "No order found. Check your order number and email." },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Order lookup error:", error);
    return NextResponse.json({ error: "Failed to look up order" }, { status: 500 });
  }
}
