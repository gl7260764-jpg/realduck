import { NextRequest, NextResponse } from "next/server";
import https from "https";
import prisma from "@/lib/prisma";
import nodemailer from "nodemailer";
import { getClientIp, getGeoInfo } from "@/lib/geo";
import { getAdminConfig } from "@/lib/adminConfig";

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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://realduckdistro.com";
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
  const isCrypto = data.paymentMethod === "crypto";
  const isPwa = Boolean(data.isPwa);
  const pwaDiscount = isPwa ? subtotal * 0.1 : 0;
  const cryptoDiscount = isCrypto ? subtotal * 0.1 : 0;
  const discount = pwaDiscount + cryptoDiscount;
  const hasDiscount = discount > 0;
  const total = subtotal - discount;
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

  if (isPwa && isCrypto) {
    html += '<tr><td style="padding:12px 40px 0;"><div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:14px 16px;">';
    html += '<p style="margin:0;font-size:14px;color:#047857;font-weight:700;">20% Off Applied — PWA App + Crypto!</p>';
    html += '<p style="margin:6px 0 0;font-size:13px;color:#047857;">Both your 10% app-install discount and your 10% crypto discount have been stacked on this order.</p>';
    html += "</div></td></tr>";
  } else if (isPwa) {
    html += '<tr><td style="padding:12px 40px 0;"><div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:14px 16px;">';
    html += '<p style="margin:0;font-size:14px;color:#047857;font-weight:700;">10% PWA App Discount Applied!</p>';
    html += '<p style="margin:6px 0 0;font-size:13px;color:#047857;">Thanks for installing the Real Duck Distro app — your total has been reduced by 10%.</p>';
    html += "</div></td></tr>";
  } else if (isCrypto) {
    html += '<tr><td style="padding:12px 40px 0;"><div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:14px 16px;">';
    html += '<p style="margin:0;font-size:14px;color:#c2410c;font-weight:700;">10% Crypto Discount Applied!</p>';
    html += '<p style="margin:6px 0 0;font-size:13px;color:#c2410c;">Your total has been reduced by 10% for paying with cryptocurrency.</p>';
    html += "</div></td></tr>";
  }

  html += '<tr><td style="padding:24px 40px 0;"><h2 style="margin:0;font-size:18px;font-weight:700;color:#1a1a1a;">Order summary</h2>';
  html += '<p style="margin:4px 0 0;font-size:13px;color:#888;">Order #' + orderNumber + " (" + orderDate + ")</p></td></tr>";
  html += '<tr><td style="padding:16px 40px 0;"><table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">' + itemsHtml + "</table></td></tr>";

  html += '<tr><td style="padding:20px 40px 0;"><table width="100%" cellpadding="0" cellspacing="0">';
  html += '<tr><td style="padding:6px 0;font-size:14px;color:#555;">Subtotal:</td><td style="padding:6px 0;font-size:14px;color:#1a1a1a;text-align:right;">' + fmt(subtotal) + "</td></tr>";
  const customerShippingLabel = data.items[0]?.deliveryType === "local"
    ? "Local Pickup"
    : (getShippingLabel(data.shippingMethod) ? getShippingLabel(data.shippingMethod) + " — rate confirmed at checkout" : "Calculated at confirmation");
  html += '<tr><td style="padding:6px 0;font-size:14px;color:#555;">Shipping:</td><td style="padding:6px 0;font-size:14px;color:#1a1a1a;text-align:right;">' + esc(customerShippingLabel) + "</td></tr>";
  if (isPwa) {
    html += '<tr><td style="padding:6px 0;font-size:14px;color:#047857;font-weight:600;">PWA App Discount (10%):</td><td style="padding:6px 0;font-size:14px;color:#047857;text-align:right;font-weight:600;">-' + fmt(pwaDiscount) + "</td></tr>";
  }
  if (isCrypto) {
    html += '<tr><td style="padding:6px 0;font-size:14px;color:#c2410c;font-weight:600;">Crypto Discount (10%):</td><td style="padding:6px 0;font-size:14px;color:#c2410c;text-align:right;font-weight:600;">-' + fmt(cryptoDiscount) + "</td></tr>";
  }
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
  html += '<tr><td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #eee;"><p style="margin:0;font-size:12px;color:#aaa;text-align:center;">&#169; ' + new Date().getFullYear() + " Real Duck Distro. All rights reserved. | HQ: LA, USA &amp; Sydney, AUS | USA | AUS | Worldwide</p></td></tr>";
  html += "</table></td></tr></table></body></html>";
  return html;
}

function buildAdminEmailHtml(orderNumber: string, data: CheckoutBody): string {
  const subtotal = calcTotal(data.items);
  const isCrypto = data.paymentMethod === "crypto";
  const isPwa = Boolean(data.isPwa);
  const pwaDiscount = isPwa ? subtotal * 0.1 : 0;
  const cryptoDiscount = isCrypto ? subtotal * 0.1 : 0;
  const discount = pwaDiscount + cryptoDiscount;
  const hasDiscount = discount > 0;
  const total = subtotal - discount;
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
  if (hasDiscount) {
    const dLabel = isPwa && isCrypto
      ? "20% OFF (PWA APP + CRYPTO)"
      : isPwa ? "10% PWA APP DISCOUNT" : "10% CRYPTO DISCOUNT";
    html += '<p style="margin:6px 0 0;color:#c2410c;font-weight:700;font-size:13px;">' + dLabel + ' - send total of ' + fmt(total) + " (not " + fmt(subtotal) + ")</p>";
  }
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
  if (isPwa) {
    html += '<tr><td style="padding:4px 0;font-size:14px;color:#047857;">PWA App Discount (10%):</td><td style="padding:4px 0;font-size:14px;color:#047857;text-align:right;">-' + fmt(pwaDiscount) + "</td></tr>";
  }
  if (isCrypto) {
    html += '<tr><td style="padding:4px 0;font-size:14px;color:#c2410c;">Crypto Discount (10%):</td><td style="padding:4px 0;font-size:14px;color:#c2410c;text-align:right;">-' + fmt(cryptoDiscount) + "</td></tr>";
  }
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

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const isShipped = body.items.some((it) => it.deliveryType === "ship");
    if (isShipped) {
      if (!body.shippingMethod || !SHIPPING_LABELS[body.shippingMethod]) {
        return NextResponse.json({ error: "Select a shipping carrier" }, { status: 400 });
      }
    }

    // Verify the PWA-install discount server-side so a crafted request
    // can't claim it. Only trust `isPwa` if we actually have a PwaInstall
    // record for this session.
    let pwaVerified = false;
    if (body.isPwa && body.sessionId) {
      try {
        const install = await prisma.pwaInstall.findUnique({ where: { sessionId: body.sessionId } });
        if (install) pwaVerified = true;
      } catch (err) {
        console.error("PWA verification lookup failed:", (err as Error).message);
      }
    }
    body.isPwa = pwaVerified;

    var orderNumber = generateOrderNumber();
    var totalItems = body.items.reduce(function(sum: number, item: CheckoutItem) { return sum + item.quantity; }, 0);

    // Get IP-based geolocation
    const ip = getClientIp(request);
    const geo = await getGeoInfo(ip);

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
        pwaDiscount: pwaVerified,
        deliveryNotes: body.deliveryNotes?.trim() || null,
        ipCountry: geo?.country || null,
        ipState: geo?.state || null,
        ipCity: geo?.city || null,
        ipZip: geo?.zip || null,
        ipAddress: geo?.ip || ip || null,
        orderSource: "email",
      },
    });

    // ── Send notifications synchronously (awaited) — SAME pattern as
    // /api/orders/telegram. In Vercel serverless, fire-and-forget promises
    // are killed when the response is returned, so we must await everything
    // that needs to complete before responding.

    const config = await getAdminConfig();

    // 1. Send Telegram first (matches fast-order ordering)
    if (config.telegramBotToken && config.telegramChatId) {
      const sanitize = (t: string) => t.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
      const tgTotal = calcTotal(body.items);
      const tgIsCrypto = body.paymentMethod === "crypto";
      const tgPwaAmt = pwaVerified ? tgTotal * 0.1 : 0;
      const tgCryptoAmt = tgIsCrypto ? tgTotal * 0.1 : 0;
      const tgDiscount = tgPwaAmt + tgCryptoAmt;
      const tgFinal = tgTotal - tgDiscount;

      let tgMsg = "🛒 NEW EMAIL ORDER\n\n";
      tgMsg += "📋 Order: " + orderNumber + "\n";
      tgMsg += "👤 " + sanitize(body.firstName) + " " + sanitize(body.lastName) + "\n";
      tgMsg += "📧 " + sanitize(body.email) + "\n";
      tgMsg += "📱 " + sanitize(body.phone) + "\n";
      tgMsg += "📍 " + sanitize(body.city) + ", " + sanitize(body.state) + " " + sanitize(body.zipCode) + ", " + sanitize(body.country) + "\n";
      tgMsg += "💳 " + getPaymentLabel(body.paymentMethod) + "\n";
      if (isShipped && body.shippingMethod) {
        tgMsg += "🚚 " + getShippingLabel(body.shippingMethod) + "\n";
      }
      tgMsg += "\n";
      tgMsg += "📦 Items:\n";
      body.items.forEach((item, i) => {
        tgMsg += (i + 1) + ". " + sanitize(item.title) + " x" + item.quantity + " — " + sanitize(item.price) + "\n";
      });
      tgMsg += "\n💵 Subtotal: " + fmt(tgTotal);
      if (pwaVerified) tgMsg += "\n📱 PWA App Discount (10%): -" + fmt(tgPwaAmt);
      if (tgIsCrypto) tgMsg += "\n🪙 Crypto Discount (10%): -" + fmt(tgCryptoAmt);
      tgMsg += "\n💰 Total: " + fmt(tgFinal);
      if (pwaVerified && tgIsCrypto) tgMsg += " (20% off — PWA + Crypto stacked)";
      if (body.deliveryNotes) tgMsg += "\n📝 Notes: " + sanitize(body.deliveryNotes);

      const tgData = JSON.stringify({ chat_id: config.telegramChatId, text: tgMsg });

      await new Promise<void>((resolve) => {
        const tgReq = https.request(
          {
            hostname: "api.telegram.org",
            path: "/bot" + config.telegramBotToken + "/sendMessage",
            method: "POST",
            headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(tgData) },
            family: 4,
            timeout: 10000,
          },
          (res) => {
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => {
              if (res.statusCode !== 200) console.error("Telegram error for " + orderNumber + ":", data);
              resolve();
            });
          }
        );
        tgReq.on("error", (err) => { console.error("Telegram error for " + orderNumber + ":", err.message); resolve(); });
        tgReq.on("timeout", () => { tgReq.destroy(); resolve(); });
        tgReq.write(tgData);
        tgReq.end();
      });
    }

    // 2. Send emails (customer + admin) — awaited via Promise.allSettled,
    //    exactly like the fast-order route.
    const smtpHost = config.smtpHost;
    const smtpUser = config.smtpUser;
    const smtpPass = config.smtpPassword;
    const salesEmail = config.adminEmail;

    if (smtpHost && smtpUser && smtpPass) {
      try {
        const port = Number(config.smtpPort) || 465;
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port,
          secure: port === 465,
          auth: { user: smtpUser, pass: smtpPass },
        });
        const fromAddress = process.env.SMTP_FROM || ("Real Duck Distro <" + smtpUser + ">");

        const emailPromises: Promise<unknown>[] = [];

        // Admin email — always send
        emailPromises.push(
          transporter.sendMail({
            from: fromAddress,
            to: salesEmail || smtpUser,
            subject: "New Order #" + orderNumber + " - " + body.firstName + " " + body.lastName,
            html: buildAdminEmailHtml(orderNumber, body),
          })
        );

        // Customer email — always send (email is required for detail order)
        emailPromises.push(
          transporter.sendMail({
            from: fromAddress,
            to: body.email,
            subject: "Thank you for your order #" + orderNumber + " - Real Duck Distro",
            html: buildCustomerEmailHtml(orderNumber, body),
          })
        );

        const results = await Promise.allSettled(emailPromises);
        for (const result of results) {
          if (result.status === "rejected") {
            console.error("Checkout email failed for " + orderNumber + ":", result.reason?.message || "Unknown error");
          }
        }
      } catch (emailErr) {
        console.error("Checkout email setup error for " + orderNumber + ":", emailErr);
      }
    } else {
      console.error("Checkout email not sent for " + orderNumber + ": SMTP config missing (host/user/password)");
    }

    return NextResponse.json({ success: true, orderNumber: orderNumber });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Failed to process order" }, { status: 500 });
  }
}
