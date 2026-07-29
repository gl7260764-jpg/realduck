import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getClientIp, getGeoFromRequest } from "@/lib/geo";
import { getAdminConfig } from "@/lib/adminConfig";
import { sendMail } from "@/lib/email";
import { sendNtfy } from "@/lib/ntfy";
import { validateOrderItems } from "@/lib/orderRules";

interface CheckoutItem {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  price: string;
  quantity: number;
  deliveryType: string;
}

interface CheckoutBody {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  paymentMethod: string;
  shippingMethod?: string;
  deliveryNotes?: string;
  items: CheckoutItem[];
  sessionId?: string;
  isPwa?: boolean;
}

const SHIPPING_LABELS: Record<string, string> = {
  ups: "UPS",
  usps: "USPS",
  fedex: "FedEx",
};

function getShippingLabel(method?: string | null): string {
  if (!method) return "";
  return SHIPPING_LABELS[method] || method;
}

function generateOrderNumber(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return "NP-" + num;
}

function getPaymentLabel(method: string): string {
  const labels: Record<string, string> = {
    cash: "Cash on Delivery",
    zelle: "Zelle",
    cashapp: "Cash App",
    chime: "Chime",
    crypto: "Cryptocurrency",
  };
  return labels[method] || method;
}

function calcTotal(items: CheckoutItem[]): number {
  let total = 0;
  for (const item of items) {
    const match = item.price?.match(/\$?([\d,]+(?:\.\d+)?)/);
    if (match) total += parseFloat(match[1].replace(",", "")) * item.quantity;
  }
  return total;
}

function fmt(n: number): string {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.realduckdistro.com";
const LOGO_URL = SITE_URL + "/images/logo.jpg";
const CONTACT_EMAIL = "contact@realduckdistro.com";

// Prevent HTML/XSS injection in email templates
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildCustomerEmailHtml(orderNumber: string, data: CheckoutBody): string {
  const subtotal = calcTotal(data.items);
  const total = subtotal;
  const orderDate = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const itemsHtml = data.items.map(function(item) {
    return "<tr>" +
    '<td style="padding:14px 0;border-bottom:1px solid #eee;vertical-align:middle;">' +
      '<table cellpadding="0" cellspacing="0" border="0"><tr>' +
        '<td style="width:50px;vertical-align:middle;">' +
          '<img src="' + esc(item.imageUrl) + '" alt="' + esc(item.title) + '" width="50" height="50" style="border-radius:8px;object-fit:cover;display:block;" />' +
        "</td>" +
        '<td style="padding-left:12px;vertical-align:middle;">' +
          '<strong style="color:#1a1a1a;font-size:14px;">' + esc(item.title) + "</strong>" +
        "</td>" +
      "</tr></table>" +
    "</td>" +
    '<td style="padding:14px 8px;border-bottom:1px solid #eee;text-align:center;color:#555;font-size:14px;">&times;' + item.quantity + "</td>" +
    '<td style="padding:14px 0;border-bottom:1px solid #eee;text-align:right;font-weight:600;color:#1a1a1a;font-size:14px;">' + esc(item.price) + "</td>" +
    "</tr>";
  }).join("");

  var html = '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/></head>';
  html += '<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif;">';
  html += '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:20px 0;"><tr><td align="center">';
  html += '<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">';
  html += '<tr><td style="padding:30px 40px 10px 40px;"><img src="' + LOGO_URL + '" alt="Real Duck Distro" width="60" height="54" style="border-radius:8px;object-fit:cover;" /></td></tr>';
  html += '<tr><td style="padding:10px 40px 0;"><h1 style="margin:0;font-size:26px;font-weight:700;color:#1a1a1a;">Thank you for your order</h1></td></tr>';
  html += '<tr><td style="padding:16px 40px 0;">';
  html += '<p style="margin:0;font-size:15px;color:#444;line-height:1.6;">Hi ' + esc(data.firstName) + ',</p>';
  html += '<p style="margin:10px 0 0;font-size:15px;color:#444;line-height:1.6;">We have received your order and it is currently on hold until we can confirm your payment has been processed.</p>';
  html += '<p style="margin:10px 0 0;font-size:15px;color:#444;line-height:1.6;">Here is a reminder of what you ordered:</p>';
  html += "</td></tr>";
  html += '<tr><td style="padding:20px 40px 0;"><div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px 16px;">';
  html += '<p style="margin:0;font-size:14px;color:#166534;">We will email you our <strong>' + getPaymentLabel(data.paymentMethod) + '</strong> details once we review your order. Contact us if you did not get our wallet within 10 minutes at <a href="mailto:' + CONTACT_EMAIL + '" style="color:#166534;">' + CONTACT_EMAIL + "</a></p>";
  html += "</div></td></tr>";

  html += '<tr><td style="padding:24px 40px 0;"><h2 style="margin:0;font-size:18px;font-weight:700;color:#1a1a1a;">Order summary</h2>';
  html += '<p style="margin:4px 0 0;font-size:13px;color:#888;">Order #' + orderNumber + " (" + orderDate + ")</p></td></tr>";
  html += '<tr><td style="padding:16px 40px 0;"><table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">' + itemsHtml + "</table></td></tr>";

  html += '<tr><td style="padding:20px 40px 0;"><table width="100%" cellpadding="0" cellspacing="0">';
  html += '<tr><td style="padding:6px 0;font-size:14px;color:#555;">Subtotal:</td><td style="padding:6px 0;font-size:14px;color:#1a1a1a;text-align:right;">' + fmt(subtotal) + "</td></tr>";
  const customerShippingLabel = data.items[0]?.deliveryType === "local"
    ? "Local Pickup"
    : (getShippingLabel(data.shippingMethod) ? getShippingLabel(data.shippingMethod) + " — rate confirmed at checkout" : "Calculated at confirmation");
  html += '<tr><td style="padding:6px 0;font-size:14px;color:#555;">Shipping:</td><td style="padding:6px 0;font-size:14px;color:#1a1a1a;text-align:right;">' + esc(customerShippingLabel) + "</td></tr>";
  html += '<tr><td style="padding:10px 0 6px;font-size:16px;font-weight:700;color:#1a1a1a;border-top:2px solid #eee;">Total:</td><td style="padding:10px 0 6px;font-size:18px;font-weight:700;color:#1a1a1a;text-align:right;border-top:2px solid #eee;">' + fmt(total) + "</td></tr>";
  html += '<tr><td style="padding:2px 0;font-size:13px;color:#888;">Payment method:</td><td style="padding:2px 0;font-size:13px;color:#1a1a1a;text-align:right;font-weight:600;">' + getPaymentLabel(data.paymentMethod) + "</td></tr>";
  html += "</table></td></tr>";

  html += '<tr><td style="padding:28px 40px 0;"><table width="100%" cellpadding="0" cellspacing="0"><tr>';
  html += '<td width="50%" style="vertical-align:top;padding-right:16px;"><div style="background:#f8fafc;border-radius:8px;padding:16px;">';
  html += '<h3 style="margin:0 0 8px;font-size:14px;font-weight:700;color:#1a1a1a;">Billing address</h3>';
  html += '<p style="margin:0;font-size:13px;color:#444;line-height:1.6;">' + esc(data.firstName) + " " + esc(data.lastName) + "<br/>";
  if (data.apartment) html += esc(data.apartment) + "<br/>";
  html += esc(data.address) + "<br/>" + esc(data.city) + "<br/>" + esc(data.state) + " " + esc(data.zipCode) + "<br/>" + esc(data.country) + "<br/>";
  html += '<a href="tel:' + esc(data.phone) + '" style="color:#2563eb;">' + esc(data.phone) + "</a><br/>";
  html += '<a href="mailto:' + esc(data.email) + '" style="color:#2563eb;">' + esc(data.email) + "</a></p></div></td>";
  html += '<td width="50%" style="vertical-align:top;padding-left:16px;"><div style="background:#f8fafc;border-radius:8px;padding:16px;">';
  html += '<h3 style="margin:0 0 8px;font-size:14px;font-weight:700;color:#1a1a1a;">Shipping address</h3>';
  html += '<p style="margin:0;font-size:13px;color:#444;line-height:1.6;">' + esc(data.firstName) + " " + esc(data.lastName) + "<br/>";
  if (data.apartment) html += esc(data.apartment) + "<br/>";
  html += esc(data.address) + "<br/>" + esc(data.city) + "<br/>" + esc(data.state) + " " + esc(data.zipCode) + "<br/>" + esc(data.country) + "</p></div></td>";
  html += "</tr></table></td></tr>";

  if (data.deliveryNotes) {
    html += '<tr><td style="padding:16px 40px 0;"><div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;">';
    html += '<p style="margin:0;font-size:13px;color:#92400e;"><strong>Delivery Notes:</strong> ' + esc(data.deliveryNotes) + "</p></div></td></tr>";
  }

  html += '<tr><td style="padding:30px 40px;"><p style="margin:0;font-size:14px;color:#444;line-height:1.6;">Thanks again! If you need any help with your order, please contact us at <a href="mailto:' + CONTACT_EMAIL + '" style="color:#2563eb;">' + CONTACT_EMAIL + "</a>.</p></td></tr>";
  html += '<tr><td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #eee;"><p style="margin:0;font-size:12px;color:#aaa;text-align:center;">&#169; ' + new Date().getFullYear() + " Real Duck Distro. All rights reserved. | HQ: LA, USA | Priority: KY · MI · FL · MS</p></td></tr>";
  html += "</table></td></tr></table></body></html>";
  return html;
}

function buildAdminEmailHtml(orderNumber: string, data: CheckoutBody): string {
  const subtotal = calcTotal(data.items);
  const total = subtotal;
  const totalItems = data.items.reduce(function(s, i) { return s + i.quantity; }, 0);
  const orderDate = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const itemsHtml = data.items.map(function(item) {
    return "<tr>" +
    '<td style="padding:10px;border-bottom:1px solid #eee;">' +
      '<table cellpadding="0" cellspacing="0" border="0"><tr>' +
        '<td style="width:40px;vertical-align:middle;">' +
          '<img src="' + esc(item.imageUrl) + '" alt="' + esc(item.title) + '" width="40" height="40" style="border-radius:6px;object-fit:cover;display:block;" />' +
        "</td>" +
        '<td style="padding-left:10px;vertical-align:middle;">' +
          '<strong style="font-size:13px;color:#1a1a1a;">' + esc(item.title) + "</strong><br/>" +
          '<span style="font-size:11px;color:#888;">' + esc(item.category) + " | " + (item.deliveryType === "local" ? "Local Pickup" : "Shipped") + "</span>" +
        "</td></tr></table></td>" +
    '<td style="padding:10px;border-bottom:1px solid #eee;text-align:center;font-size:14px;">x' + item.quantity + "</td>" +
    '<td style="padding:10px;border-bottom:1px solid #eee;text-align:right;font-weight:600;font-size:14px;">' + esc(item.price) + "</td></tr>";
  }).join("");

  var html = '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/></head>';
  html += '<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif;">';
  html += '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:20px 0;"><tr><td align="center">';
  html += '<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">';
  html += '<tr><td style="background:#16a34a;padding:24px 40px;"><h1 style="margin:0;font-size:22px;color:#fff;">New Order Received!</h1>';
  html += '<p style="margin:6px 0 0;font-size:14px;color:#bbf7d0;">Order #' + orderNumber + " - " + orderDate + "</p></td></tr>";

  html += '<tr><td style="padding:24px 40px 0;"><h3 style="margin:0 0 10px;font-size:15px;color:#1a1a1a;">Customer</h3>';
  html += '<table width="100%" style="background:#f8fafc;border-radius:8px;"><tr><td style="padding:14px 16px;">';
  html += '<p style="margin:0;font-size:14px;color:#1a1a1a;"><strong>' + esc(data.firstName) + " " + esc(data.lastName) + "</strong></p>";
  html += '<p style="margin:4px 0 0;font-size:13px;color:#555;">Email: <a href="mailto:' + esc(data.email) + '" style="color:#2563eb;">' + esc(data.email) + "</a></p>";
  html += '<p style="margin:4px 0 0;font-size:13px;color:#555;">Phone: <a href="tel:' + esc(data.phone) + '" style="color:#2563eb;">' + esc(data.phone) + "</a></p>";
  html += "</td></tr></table></td></tr>";

  html += '<tr><td style="padding:16px 40px 0;"><h3 style="margin:0 0 10px;font-size:15px;color:#1a1a1a;">Shipping Address</h3>';
  html += '<div style="background:#f8fafc;border-radius:8px;padding:14px 16px;">';
  html += '<p style="margin:0;font-size:13px;color:#444;line-height:1.6;">' + esc(data.address) + (data.apartment ? ", " + esc(data.apartment) : "") + "<br/>";
  html += esc(data.city) + ", " + esc(data.state) + " " + esc(data.zipCode) + "<br/>" + esc(data.country) + "</p>";
  if (data.deliveryNotes) html += '<p style="margin:8px 0 0;font-size:12px;color:#92400e;"><strong>Notes:</strong> ' + esc(data.deliveryNotes) + "</p>";
  html += "</div></td></tr>";

  html += '<tr><td style="padding:16px 40px 0;"><h3 style="margin:0 0 10px;font-size:15px;color:#1a1a1a;">Payment Method</h3>';
  html += '<div style="background:#fef3c7;border-radius:8px;padding:14px 16px;">';
  html += '<p style="margin:0;font-weight:700;font-size:15px;color:#92400e;">' + getPaymentLabel(data.paymentMethod) + "</p>";
  html += '<p style="margin:6px 0 0;color:#92400e;font-size:12px;">Send the customer payment details for this method.</p></div></td></tr>';

  const adminShippingLabel = getShippingLabel(data.shippingMethod);
  if (adminShippingLabel) {
    html += '<tr><td style="padding:16px 40px 0;"><h3 style="margin:0 0 10px;font-size:15px;color:#1a1a1a;">Shipping Method</h3>';
    html += '<div style="background:#eff6ff;border-radius:8px;padding:14px 16px;">';
    html += '<p style="margin:0;font-weight:700;font-size:15px;color:#1d4ed8;">' + esc(adminShippingLabel) + '</p>';
    html += '<p style="margin:6px 0 0;color:#1e3a8a;font-size:12px;">Customer-selected carrier — confirm rate before sending payment details.</p>';
    html += "</div></td></tr>";
  }

  html += '<tr><td style="padding:20px 40px 0;"><h3 style="margin:0 0 10px;font-size:15px;color:#1a1a1a;">Items (' + totalItems + ")</h3>";
  html += '<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">' + itemsHtml + "</table></td></tr>";

  html += '<tr><td style="padding:16px 40px 24px;"><table width="100%" cellpadding="0" cellspacing="0">';
  html += '<tr><td style="padding:4px 0;font-size:14px;color:#555;">Subtotal:</td><td style="padding:4px 0;font-size:14px;text-align:right;">' + fmt(subtotal) + "</td></tr>";
  html += '<tr><td style="padding:8px 0;font-size:18px;font-weight:700;border-top:2px solid #eee;">Total:</td>';
  html += '<td style="padding:8px 0;font-size:18px;font-weight:700;text-align:right;border-top:2px solid #eee;">' + fmt(total) + "</td></tr>";
  html += "</table></td></tr>";

  html += '<tr><td style="background:#f8fafc;padding:16px 40px;border-top:1px solid #eee;"><p style="margin:0;font-size:12px;color:#aaa;text-align:center;">Real Duck Distro Admin Notification</p></td></tr>';
  html += "</table></td></tr></table></body></html>";
  return html;
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutBody = await request.json();

    var required: (keyof CheckoutBody)[] = ["firstName", "lastName", "email", "phone", "address", "city", "state", "zipCode", "paymentMethod"];
    for (var i = 0; i < required.length; i++) {
      var field = required[i];
      var val = body[field];
      if (typeof val === "string" && !val.trim()) {
        return NextResponse.json({ error: field + " is required" }, { status: 400 });
      }
    }

    if (!body.items || body.items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Block disposables orders below the 50-unit minimum.
    const ruleCheck = validateOrderItems(body.items);
    if (!ruleCheck.ok) {
      return NextResponse.json({ error: ruleCheck.error }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const isShipped = body.items.some((it) => it.deliveryType === "ship");
    if (isShipped) {
      if (!body.shippingMethod || !SHIPPING_LABELS[body.shippingMethod]) {
        return NextResponse.json({ error: "Select a shipping carrier" }, { status: 400 });
      }
    }

    var orderNumber = generateOrderNumber();
    var totalItems = body.items.reduce(function(sum: number, item: CheckoutItem) { return sum + item.quantity; }, 0);

    // Get IP-based geolocation
    const ip = getClientIp(request);
    const geo = await getGeoFromRequest(request);

    await prisma.checkoutOrder.create({
      data: {
        orderNumber: orderNumber,
        sessionId: body.sessionId || null,
        firstName: body.firstName.trim(),
        lastName: body.lastName.trim(),
        email: body.email.trim().toLowerCase(),
        phone: body.phone.trim(),
        address: body.address.trim(),
        apartment: body.apartment?.trim() || null,
        city: body.city.trim(),
        state: body.state.trim(),
        zipCode: body.zipCode.trim(),
        country: body.country || "United States",
        items: JSON.parse(JSON.stringify(body.items)),
        totalItems: totalItems,
        paymentMethod: body.paymentMethod,
        shippingMethod: isShipped && body.shippingMethod ? body.shippingMethod : null,
        pwaDiscount: false,
        deliveryNotes: body.deliveryNotes?.trim() || null,
        ipCountry: geo?.country || null,
        ipState: geo?.state || null,
        ipCity: geo?.city || null,
        ipZip: geo?.zip || null,
        ipAddress: geo?.ip || ip || null,
        orderSource: "email",
      },
    });

    // Also record each item in the analytics `Order` table, using
    // IP-based geolocation (not the user-entered shipping address) so
    // admin analytics "Orders by Country/City" reflects where the order
    // actually originated.
    try {
      const ua = request.headers.get("user-agent") || "";
      const isMobile = /Mobile|Android|iPhone|iPod/i.test(ua);
      const isTablet = /iPad|tablet/i.test(ua);
      const device = isTablet ? "tablet" : isMobile ? "mobile" : "desktop";
      const browser = /Edg\//.test(ua) ? "Edge"
        : /OPR\//.test(ua) || /Opera/i.test(ua) ? "Opera"
        : /Chrome\//.test(ua) && !/Edg|OPR/.test(ua) ? "Chrome"
        : /Firefox\//.test(ua) ? "Firefox"
        : /Safari\//.test(ua) && !/Chrome/.test(ua) ? "Safari"
        : "Other";
      const os = /Windows/.test(ua) ? "Windows"
        : /Mac OS X/.test(ua) ? "macOS"
        : /iPhone|iPad|iPod/.test(ua) ? "iOS"
        : /Android/.test(ua) ? "Android"
        : /Linux/.test(ua) ? "Linux"
        : "Other";
      await prisma.order.createMany({
        data: body.items.map((item) => ({
          sessionId: body.sessionId || "",
          productId: item.id || null,
          productTitle: item.title,
          category: item.category,
          price: item.price,
          deliveryType: item.deliveryType,
          quantity: item.quantity,
          country: geo?.country || null,
          state: geo?.state || null,
          city: geo?.city || null,
          zip: geo?.zip || null,
          ip: geo?.ip || ip || null,
          device,
          browser,
          os,
        })),
      });
    } catch (err) {
      console.error("Order-analytics insert failed for " + orderNumber + ":", (err as Error).message);
    }

    // ── Send notifications synchronously (awaited) — SAME pattern as
    // /api/orders/telegram. In Vercel serverless, fire-and-forget promises
    // are killed when the response is returned, so we must await everything
    // that needs to complete before responding.

    const config = await getAdminConfig();

    // Track notification outcomes so the response can flag "order saved but
    // alerts failed" instead of silently returning success. The order itself
    // is already persisted, so we never fail the request over notifications.
    let pushOk: boolean | null = null; // null = not configured / skipped
    let emailOk: boolean | null = null;

    // 1. Send ntfy push (replaces Telegram) — client name, contact, items,
    //    quantities, prices and total. Tapping it opens the admin orders page.
    if (config.ntfyTopic) {
      const total = calcTotal(body.items);
      let msg = "👤 " + body.firstName + " " + body.lastName + "\n";
      msg += "📧 " + body.email + "\n";
      msg += "📱 " + body.phone + "\n";
      msg += "📍 " + body.city + ", " + body.state + " " + body.zipCode + ", " + body.country + "\n";
      msg += "💳 " + getPaymentLabel(body.paymentMethod) + "\n";
      if (isShipped && body.shippingMethod) msg += "🚚 " + getShippingLabel(body.shippingMethod) + "\n";
      msg += "\n📦 Items:\n";
      body.items.forEach((item, i) => {
        msg += (i + 1) + ". " + item.title + " x" + item.quantity + " — " + item.price + "\n";
      });
      msg += "\n💰 Total: " + fmt(total);
      if (body.deliveryNotes) msg += "\n📝 Notes: " + body.deliveryNotes;

      const res = await sendNtfy(
        {
          title: "🛒 New Order " + orderNumber,
          message: msg,
          clickUrl: SITE_URL + "/admin/orders",
          tags: ["shopping_cart"],
          priority: 4,
        },
        config,
      );
      pushOk = res.ok;
      if (!res.ok) console.error("Checkout ntfy failed for " + orderNumber + ":", res.error);
    }

    // 2. Send emails (customer + admin) via the unified sender (Brevo → SMTP).
    const salesEmail = config.adminEmail || config.smtpUser;
    let emailError: string | undefined;
    try {
      const emailPromises: Promise<{ ok: boolean; error?: string }>[] = [
        // Admin email — reply-to the customer for easy follow-up.
        sendMail(
          {
            to: salesEmail,
            replyTo: body.email,
            subject: "New Order #" + orderNumber + " - " + body.firstName + " " + body.lastName,
            html: buildAdminEmailHtml(orderNumber, body),
            tags: ["order-admin"],
          },
          config,
        ).then((res) => {
          if (!res.ok) console.error("Checkout admin email failed for " + orderNumber + ":", res.error);
          return res;
        }),
        // Customer email — always send (email is required for detail order).
        sendMail(
          {
            to: body.email,
            subject: "Thank you for your order #" + orderNumber + " - Real Duck Distro",
            html: buildCustomerEmailHtml(orderNumber, body),
            tags: ["order-customer"],
          },
          config,
        ).then((res) => {
          if (!res.ok) console.error("Checkout customer email failed for " + orderNumber + ":", res.error);
          return res;
        }),
      ];
      const results = await Promise.allSettled(emailPromises);
      // Email counts as OK only if BOTH admin + customer sends succeed.
      emailOk = results.every((r) => r.status === "fulfilled" && r.value.ok === true);
      if (!emailOk) {
        const firstErr = results.find(
          (r) => r.status === "fulfilled" && !r.value.ok,
        ) as PromiseFulfilledResult<{ ok: boolean; error?: string }> | undefined;
        emailError = firstErr?.value.error || "email send failed";
      }
    } catch (emailErr) {
      emailOk = false;
      emailError = (emailErr as Error).message;
      console.error("Checkout email setup error for " + orderNumber + ":", emailErr);
    }

    // Order is saved regardless; flag notification problems so the client and
    // admin dashboard can show "order received, but we couldn't send alerts"
    // rather than a clean success that hides a silent delivery failure.
    const notifications = { push: pushOk, email: emailOk };
    const notificationsOk = pushOk !== false && emailOk !== false;
    return NextResponse.json({
      success: true,
      orderNumber: orderNumber,
      ...(emailError ? { emailError } : {}),
      notifications,
      notificationsOk,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Failed to process order" }, { status: 500 });
  }
}
