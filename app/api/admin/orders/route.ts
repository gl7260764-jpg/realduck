import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import nodemailer from "nodemailer";
import { isAuthenticated } from "@/lib/auth";
import { getAdminConfig } from "@/lib/adminConfig";
import { getOrderAttribution } from "@/lib/orderAttribution";

// ── Status labels and email content ──

const STATUS_INFO: Record<string, { label: string; emoji: string; color: string; message: string }> = {
  confirmed: {
    label: "Confirmed",
    emoji: "✅",
    color: "#2563eb",
    message: "Great news! Your payment has been verified and your order is now being prepared. We will notify you once it ships.",
  },
  shipped: {
    label: "Shipped",
    emoji: "🚚",
    color: "#7c3aed",
    message: "Your order is on its way! It has been shipped and is headed to your delivery address. You will receive it soon.",
  },
  delivered: {
    label: "Delivered",
    emoji: "📦",
    color: "#16a34a",
    message: "Your order has been delivered! We hope you enjoy your products. Thank you for shopping with Real Duck Distro.",
  },
  cancelled: {
    label: "Cancelled",
    emoji: "❌",
    color: "#dc2626",
    message: "Your order has been cancelled. If you did not request this, please contact us immediately.",
  },
};

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function buildStatusEmailHtml(
  orderNumber: string,
  firstName: string,
  status: string,
  trackUrl: string
): string {
  const info = STATUS_INFO[status];
  if (!info) return "";

  let html = '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/></head>';
  html += '<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif;">';
  html += '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:20px 0;"><tr><td align="center">';
  html += '<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">';

  // Header with status color
  html += '<tr><td style="background:' + info.color + ';padding:28px 40px;text-align:center;">';
  html += '<p style="margin:0;font-size:36px;">' + info.emoji + '</p>';
  html += '<h1 style="margin:10px 0 0;font-size:24px;font-weight:700;color:#ffffff;">Order ' + esc(info.label) + '</h1>';
  html += '</td></tr>';

  // Body
  html += '<tr><td style="padding:30px 40px 0;">';
  html += '<p style="margin:0;font-size:15px;color:#444;line-height:1.6;">Hi ' + esc(firstName) + ',</p>';
  html += '<p style="margin:12px 0 0;font-size:15px;color:#444;line-height:1.7;">' + info.message + '</p>';
  html += '</td></tr>';

  // Order number box
  html += '<tr><td style="padding:20px 40px 0;">';
  html += '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 20px;text-align:center;">';
  html += '<p style="margin:0;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.1em;">Order Number</p>';
  html += '<p style="margin:6px 0 0;font-size:20px;font-weight:700;color:#1a1a1a;font-family:monospace;">' + esc(orderNumber) + '</p>';
  html += '</div></td></tr>';

  // Track button
  html += '<tr><td style="padding:24px 40px 0;text-align:center;">';
  html += '<a href="' + esc(trackUrl) + '" style="display:inline-block;padding:14px 32px;background:#1a1a1a;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:10px;">Track Your Order</a>';
  html += '</td></tr>';

  // Footer
  html += '<tr><td style="padding:30px 40px 20px;"><p style="margin:0;font-size:13px;color:#888;line-height:1.6;text-align:center;">Questions? Contact us at <a href="mailto:contact@realduckdistro.com" style="color:#2563eb;">contact@realduckdistro.com</a></p></td></tr>';
  html += '<tr><td style="background:#f8fafc;padding:18px 40px;border-top:1px solid #eee;"><p style="margin:0;font-size:12px;color:#aaa;text-align:center;">&#169; ' + new Date().getFullYear() + ' Real Duck Distro. All rights reserved.</p></td></tr>';
  html += '</table></td></tr></table></body></html>';
  return html;
}

// ── GET orders ──

export async function GET(request: NextRequest) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit")) || 500, 500);
    const cursor = searchParams.get("cursor") || undefined;

    // Pull both checkout orders (full email/web checkout) and fast orders
    // (Telegram express checkout, $200+ min) in parallel. Both surface here
    // so WICE sees every inbound order and its source attribution.
    const [checkoutOrders, fastOrders] = await Promise.all([
      prisma.checkoutOrder.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
    ]);

    // Normalize fast orders into the same wire shape as checkout orders so
    // the UI can render both with one component path. Empty/null for fields
    // that don't exist on the Order model (full address, payment, etc).
    const normalizedFastOrders = fastOrders.map((o) => ({
      id: o.id,
      orderNumber: `FAST-${o.id.slice(-8).toUpperCase()}`,
      sessionId: o.sessionId,
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      apartment: null,
      city: o.city || "",
      state: o.state || "",
      zipCode: o.zip || "",
      country: o.country || "United States",
      ipCountry: o.country || null,
      ipState: o.state || null,
      ipCity: o.city || null,
      ipZip: o.zip || null,
      ipAddress: o.ip || null,
      items: [
        {
          id: o.productId || o.id,
          title: o.productTitle,
          category: o.category,
          imageUrl: "",
          price: o.price,
          quantity: o.quantity,
          deliveryType: o.deliveryType,
        },
      ],
      totalItems: o.quantity,
      paymentMethod: "pending",
      shippingMethod: null,
      pwaDiscount: false,
      deliveryNotes: null,
      orderSource: "telegram-fast",
      status: "pending",
      isFastOrder: true,
      device: o.device,
      browser: o.browser,
      os: o.os,
      createdAt: o.createdAt,
      updatedAt: o.createdAt,
    }));

    // Tag the checkout orders so the UI can differentiate
    const taggedCheckoutOrders = checkoutOrders.map((o) => ({ ...o, isFastOrder: false }));

    // Merge and sort by createdAt desc
    const merged = [...taggedCheckoutOrders, ...normalizedFastOrders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);

    // Attach source attribution to each order in parallel.
    const ordersWithAttribution = await Promise.all(
      merged.map(async (o) => {
        const attribution = await getOrderAttribution(o.sessionId).catch(() => null);
        return { ...o, attribution };
      })
    );

    return NextResponse.json(ordersWithAttribution);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

// ── PATCH update status + notify customer ──

export async function PATCH(request: NextRequest) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, status } = await request.json();

    if (!id || !status) {
      return NextResponse.json({ error: "id and status are required" }, { status: 400 });
    }

    const validStatuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const order = await prisma.checkoutOrder.update({
      where: { id },
      data: { status },
    });

    // Send status update email to customer (non-blocking)
    if (STATUS_INFO[status] && order.email && !order.email.includes("telegram@")) {
      const config = await getAdminConfig();
      const smtpHost = config.smtpHost;
      const smtpUser = config.smtpUser;
      const smtpPass = config.smtpPassword;

      if (smtpHost && smtpUser && smtpPass) {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.realduckdistro.com";
        const trackUrl = `${siteUrl}/orders`;

        try {
          const port = Number(config.smtpPort) || 465;
          const transporter = nodemailer.createTransport({
            host: smtpHost,
            port,
            secure: port === 465,
            auth: { user: smtpUser, pass: smtpPass },
          });

          const fromAddress = process.env.SMTP_FROM || `Real Duck Distro <${smtpUser}>`;

          await transporter.sendMail({
            from: fromAddress,
            to: order.email,
            subject: `${STATUS_INFO[status].emoji} Order #${order.orderNumber} — ${STATUS_INFO[status].label}`,
            html: buildStatusEmailHtml(order.orderNumber, order.firstName, status, trackUrl),
          });
        } catch (emailErr) {
          console.error("Status email failed for order " + order.orderNumber + ":", emailErr);
        }
      }
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

// ── DELETE order ──

export async function DELETE(request: NextRequest) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await prisma.checkoutOrder.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting order:", error);
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
  }
}
