import { NextRequest, NextResponse } from "next/server";
import https from "https";
import prisma from "@/lib/prisma";
import nodemailer from "nodemailer";
import { getAdminConfig } from "@/lib/adminConfig";
import { getClientIp, getGeoInfo } from "@/lib/geo";

interface TelegramOrderItem {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  price: string;
  quantity: number;
  deliveryType: string;
}

interface TelegramOrderBody {
  items: TelegramOrderItem[];
  sessionId?: string;
  customerPhone?: string;
  customerEmail?: string;
}

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `NP-${timestamp}-${random}`;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function escapeMarkdown(text: string): string {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, "\\$1");
}

function calcTotal(items: TelegramOrderItem[]): number {
  let total = 0;
  for (const item of items) {
    const m = item.price?.match(/\$?([\d,]+(?:\.\d+)?)/);
    if (m) total += parseFloat(m[1].replace(",", "")) * item.quantity;
  }
  return total;
}

function fmt(n: number): string {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Telegram message (MarkdownV2) ──

function buildTelegramMessage(orderNumber: string, items: TelegramOrderItem[], customerPhone?: string, customerEmail?: string): string {
  let message = `🛒 *NEW FAST ORDER*\n`;
  message += `📋 Order: \`${orderNumber}\`\n`;
  if (customerEmail) {
    message += `📧 Email: ${escapeMarkdown(customerEmail)}\n`;
  }
  if (customerPhone) {
    message += `📞 Phone: ${escapeMarkdown(customerPhone)}\n`;
  }
  message += `\n📦 *Items:*\n`;
  message += `─────────────────\n`;

  let totalPrice = 0;
  items.forEach((item, index) => {
    const priceMatch = item.price.match(/\$?([\d,]+(?:\.\d+)?)/);
    const unitPrice = priceMatch ? parseFloat(priceMatch[1].replace(",", "")) : 0;
    const lineTotal = unitPrice * item.quantity;
    totalPrice += lineTotal;

    message += `*${index + 1}\\. ${escapeMarkdown(item.title)}*\n`;
    message += `   ${escapeMarkdown(item.price)} x ${item.quantity}`;
    if (item.quantity > 1 && unitPrice > 0) {
      message += ` \\= $${escapeMarkdown(lineTotal.toFixed(2))}`;
    }
    message += `\n\n`;
  });

  message += `─────────────────\n`;
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  message += `📊 *Total Items:* ${totalItems}\n`;
  if (totalPrice > 0) {
    message += `💰 *Total Price: $${escapeMarkdown(totalPrice.toFixed(2))}*\n`;
  }
  message += `\n💬 _Reply to this message to coordinate with the customer\\._`;
  return message;
}

// ── Send Telegram ──

function sendTelegramMessage(text: string, botToken: string, chatId: string): Promise<boolean> {
  const postData = JSON.stringify({ chat_id: chatId, text, parse_mode: "MarkdownV2" });

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: "api.telegram.org",
        path: `/bot${botToken}/sendMessage`,
        method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(postData) },
        family: 4,
        timeout: 10000,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode === 200) {
            resolve(true);
          } else {
            console.error("Telegram API error:", data);
            resolve(false);
          }
        });
      }
    );
    req.on("error", (err) => { console.error("Telegram request error:", err.message); resolve(false); });
    req.on("timeout", () => { req.destroy(); console.error("Telegram request timed out"); resolve(false); });
    req.write(postData);
    req.end();
  });
}

// ── Email HTML builders for fast orders ──

function buildCustomerFastOrderHtml(orderNumber: string, items: TelegramOrderItem[], contactMethod: string): string {
  const total = calcTotal(items);
  const orderDate = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const itemsHtml = items.map((item) =>
    "<tr>" +
    '<td style="padding:12px 0;border-bottom:1px solid #eee;vertical-align:middle;">' +
      '<strong style="color:#1a1a1a;font-size:14px;">' + esc(item.title) + "</strong>" +
      '<br/><span style="font-size:12px;color:#888;">' + esc(item.category) + "</span>" +
    "</td>" +
    '<td style="padding:12px 8px;border-bottom:1px solid #eee;text-align:center;color:#555;font-size:14px;">&times;' + item.quantity + "</td>" +
    '<td style="padding:12px 0;border-bottom:1px solid #eee;text-align:right;font-weight:600;color:#1a1a1a;font-size:14px;">' + esc(item.price) + "</td>" +
    "</tr>"
  ).join("");

  let html = '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/></head>';
  html += '<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif;">';
  html += '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:20px 0;"><tr><td align="center">';
  html += '<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">';
  html += '<tr><td style="padding:30px 40px 20px 40px;"><h1 style="margin:0;font-size:24px;font-weight:700;color:#1a1a1a;">Thank you for your order!</h1></td></tr>';
  html += '<tr><td style="padding:0 40px 20px;">';
  html += '<p style="margin:0;font-size:15px;color:#444;line-height:1.6;">We received your fast order and our team will reach out to you via <strong>' + esc(contactMethod) + '</strong> to arrange payment and delivery.</p>';
  html += "</td></tr>";
  html += '<tr><td style="padding:0 40px;"><div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px 16px;">';
  html += '<p style="margin:0;font-size:13px;color:#166534;"><strong>Order #' + esc(orderNumber) + '</strong> — ' + orderDate + '</p>';
  html += "</div></td></tr>";
  html += '<tr><td style="padding:20px 40px;"><table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">' + itemsHtml + "</table></td></tr>";
  html += '<tr><td style="padding:0 40px 20px;"><table width="100%"><tr>';
  html += '<td style="padding:10px 0;font-size:16px;font-weight:700;color:#1a1a1a;border-top:2px solid #eee;">Total:</td>';
  html += '<td style="padding:10px 0;font-size:18px;font-weight:700;color:#1a1a1a;text-align:right;border-top:2px solid #eee;">' + fmt(total) + "</td>";
  html += "</tr></table></td></tr>";
  html += '<tr><td style="padding:0 40px 30px;"><p style="margin:0;font-size:14px;color:#444;line-height:1.6;">If you don\'t hear from us within 5 minutes, please contact us at <a href="mailto:contact@realduckdistro.com" style="color:#2563eb;">contact@realduckdistro.com</a></p></td></tr>';
  html += '<tr><td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #eee;"><p style="margin:0;font-size:12px;color:#aaa;text-align:center;">&#169; ' + new Date().getFullYear() + " Real Duck Distro. All rights reserved.</p></td></tr>";
  html += "</table></td></tr></table></body></html>";
  return html;
}

// ── Follow-up customer email — sent right after the first confirmation.
//    Lists the details we still need (since fast-order skips the full form),
//    repeats the order summary, promotes the PWA, and re-states the
//    5-minute reach-out window.
function buildCustomerFastOrderFollowUpHtml(
  orderNumber: string,
  items: TelegramOrderItem[],
  customerPhone?: string,
  customerEmail?: string
): string {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://realduckdistro.com";
  const CONTACT_EMAIL = "contact@realduckdistro.com";
  const total = calcTotal(items);
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);

  const itemsHtml = items.map((item) =>
    "<tr>" +
    '<td style="padding:12px 0;border-bottom:1px solid #eef2f7;vertical-align:middle;">' +
      '<strong style="color:#0f172a;font-size:14px;">' + esc(item.title) + "</strong>" +
      '<br/><span style="font-size:12px;color:#64748b;">' + esc(item.category) + "</span>" +
    "</td>" +
    '<td style="padding:12px 8px;border-bottom:1px solid #eef2f7;text-align:center;color:#475569;font-size:14px;">x' + item.quantity + "</td>" +
    '<td style="padding:12px 0;border-bottom:1px solid #eef2f7;text-align:right;font-weight:600;color:#0f172a;font-size:14px;">' + esc(item.price) + "</td>" +
    "</tr>"
  ).join("");

  // What we still need from the client (none of these are collected by fast order)
  const needed: Array<[string, string]> = [
    ["Full name", "First & last name on the order."],
    ["Delivery address", "Street, city, state/region, ZIP/postal code, country (or apartment number if applicable)."],
    ["Payment method", "Zelle, Cash App, Chime, or Cryptocurrency (10% off when paying in crypto)."],
    ["Shipping carrier", "UPS, USPS or FedEx — your pick."],
    ["Phone or Telegram", customerPhone ? "We have your phone — confirm if Telegram is preferred." : "Best number to reach you on, or Telegram username."],
  ];

  let html = '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/></head>';
  html += '<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif;">';
  html += '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 0;"><tr><td align="center">';
  html += '<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">';

  // Hero
  html += '<tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:32px 40px;text-align:center;">';
  html += '<h1 style="margin:0;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.01em;">A few details to finish your order</h1>';
  html += '<p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.7);">Order #' + esc(orderNumber) + " · Real Duck Distro</p>";
  html += '</td></tr>';

  // Intro
  html += '<tr><td style="padding:28px 40px 8px;">';
  html += '<p style="margin:0 0 14px;font-size:15px;color:#0f172a;line-height:1.65;">Thanks again for your order.</p>';
  html += '<p style="margin:0 0 14px;font-size:15px;color:#475569;line-height:1.7;">You used our <strong>fast checkout</strong>, so to ship your items we still need a few details from you. Reply to this email with the items below and we\'ll send you payment instructions right away.</p>';
  html += '</td></tr>';

  // What we need
  html += '<tr><td style="padding:8px 40px 4px;">';
  html += '<h2 style="margin:14px 0 10px;font-size:15px;font-weight:800;color:#0f172a;text-transform:uppercase;letter-spacing:0.06em;">What we need</h2>';
  html += '<table width="100%" cellpadding="0" cellspacing="0">';
  for (const [label, desc] of needed) {
    html += '<tr><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;vertical-align:top;">';
    html += '<div style="font-size:14px;font-weight:700;color:#0f172a;">' + esc(label) + '</div>';
    html += '<div style="font-size:13px;color:#64748b;line-height:1.55;margin-top:2px;">' + esc(desc) + '</div>';
    html += '</td></tr>';
  }
  html += '</table>';
  html += '</td></tr>';

  // Order summary
  html += '<tr><td style="padding:24px 40px 0;">';
  html += '<h2 style="margin:0 0 10px;font-size:15px;font-weight:800;color:#0f172a;text-transform:uppercase;letter-spacing:0.06em;">Your order</h2>';
  html += '<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">' + itemsHtml + '</table>';
  html += '<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:6px;">';
  html += '<tr><td style="padding:10px 0 4px;font-size:13px;color:#64748b;">Items:</td><td style="padding:10px 0 4px;font-size:13px;color:#0f172a;text-align:right;">' + totalItems + "</td></tr>";
  html += '<tr><td style="padding:10px 0 6px;font-size:16px;font-weight:800;color:#0f172a;border-top:2px solid #e2e8f0;">Subtotal:</td><td style="padding:10px 0 6px;font-size:18px;font-weight:800;color:#0f172a;text-align:right;border-top:2px solid #e2e8f0;">' + fmt(total) + "</td></tr>";
  html += '<tr><td colspan="2" style="padding:6px 0 0;font-size:12px;color:#94a3b8;">Shipping & any discounts will be calculated once we have your address & payment method.</td></tr>';
  html += '</table>';
  html += '</td></tr>';

  // PWA install CTA
  html += '<tr><td style="padding:24px 40px 0;">';
  html += '<div style="background:linear-gradient(135deg,#ecfdf5 0%,#d1fae5 100%);border:1px solid #a7f3d0;border-radius:12px;padding:18px 20px;">';
  html += '<p style="margin:0;font-size:14px;font-weight:800;color:#047857;">📱 Install the Real Duck Distro app — get 10% off every order</p>';
  html += '<p style="margin:8px 0 14px;font-size:13px;color:#065f46;line-height:1.6;">Add us to your home screen for instant drop alerts, subscriber-only promo codes, and a flat <strong>10% discount on every checkout</strong> just for installing.</p>';
  html += '<a href="' + SITE_URL + '" style="display:inline-block;background:#047857;color:#ffffff;text-decoration:none;font-weight:700;font-size:13px;padding:10px 20px;border-radius:999px;">Open the app & install</a>';
  html += '</div>';
  html += '</td></tr>';

  // Reach-out + contact
  html += '<tr><td style="padding:24px 40px 0;">';
  html += '<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px 18px;">';
  html += '<p style="margin:0;font-size:14px;color:#92400e;line-height:1.6;"><strong>Haven\'t heard from us in 5 minutes?</strong> Reach out so we can get your order moving:</p>';
  html += '<ul style="margin:8px 0 0;padding:0 0 0 18px;font-size:13px;color:#92400e;line-height:1.8;">';
  html += '<li>Email <a href="mailto:' + CONTACT_EMAIL + '" style="color:#92400e;font-weight:700;">' + CONTACT_EMAIL + '</a></li>';
  if (customerEmail) html += '<li>Reply directly to this email</li>';
  if (customerPhone) html += '<li>Call or message <strong>' + esc(customerPhone) + '</strong> from your end and we\'ll match it up</li>';
  html += '</ul>';
  html += '</div>';
  html += '</td></tr>';

  // Footer
  html += '<tr><td style="padding:24px 40px 0;">';
  html += '<p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">Quote order <strong style="color:#0f172a;">#' + esc(orderNumber) + '</strong> in any reply so we can match it up fast.</p>';
  html += '</td></tr>';
  html += '<tr><td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #eef2f7;margin-top:24px;">';
  html += '<p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">&copy; ' + new Date().getFullYear() + ' Real Duck Distro. All rights reserved.<br/>HQ: LA, USA &amp; Sydney, AUS · Ships worldwide.</p>';
  html += '</td></tr>';

  html += '</table></td></tr></table></body></html>';
  return html;
}

function buildAdminFastOrderHtml(orderNumber: string, items: TelegramOrderItem[], customerPhone?: string, customerEmail?: string): string {
  const total = calcTotal(items);
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const orderDate = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const itemsHtml = items.map((item) =>
    "<tr>" +
    '<td style="padding:10px;border-bottom:1px solid #eee;">' +
      '<strong style="font-size:13px;color:#1a1a1a;">' + esc(item.title) + "</strong><br/>" +
      '<span style="font-size:11px;color:#888;">' + esc(item.category) + " | " + (item.deliveryType === "local" ? "Local Pickup" : "Shipped") + "</span>" +
    "</td>" +
    '<td style="padding:10px;border-bottom:1px solid #eee;text-align:center;font-size:14px;">x' + item.quantity + "</td>" +
    '<td style="padding:10px;border-bottom:1px solid #eee;text-align:right;font-weight:600;font-size:14px;">' + esc(item.price) + "</td></tr>"
  ).join("");

  let html = '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/></head>';
  html += '<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif;">';
  html += '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:20px 0;"><tr><td align="center">';
  html += '<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">';
  html += '<tr><td style="background:#f59e0b;padding:24px 40px;"><h1 style="margin:0;font-size:22px;color:#fff;">New Fast Order!</h1>';
  html += '<p style="margin:6px 0 0;font-size:14px;color:#fef3c7;">Order #' + esc(orderNumber) + " — " + orderDate + "</p></td></tr>";

  html += '<tr><td style="padding:24px 40px 0;"><h3 style="margin:0 0 10px;font-size:15px;color:#1a1a1a;">Customer Contact</h3>';
  html += '<table width="100%" style="background:#f8fafc;border-radius:8px;"><tr><td style="padding:14px 16px;">';
  if (customerEmail) html += '<p style="margin:0;font-size:14px;color:#1a1a1a;">Email: <a href="mailto:' + esc(customerEmail) + '" style="color:#2563eb;">' + esc(customerEmail) + "</a></p>";
  if (customerPhone) html += '<p style="margin:' + (customerEmail ? "4px" : "0") + ' 0 0;font-size:14px;color:#1a1a1a;">Phone: <a href="tel:' + esc(customerPhone) + '" style="color:#2563eb;">' + esc(customerPhone) + "</a></p>";
  html += "</td></tr></table></td></tr>";

  html += '<tr><td style="padding:20px 40px 0;"><h3 style="margin:0 0 10px;font-size:15px;color:#1a1a1a;">Items (' + totalItems + ")</h3>";
  html += '<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">' + itemsHtml + "</table></td></tr>";

  html += '<tr><td style="padding:16px 40px 24px;"><table width="100%">';
  html += '<tr><td style="padding:8px 0;font-size:18px;font-weight:700;border-top:2px solid #eee;">Total:</td>';
  html += '<td style="padding:8px 0;font-size:18px;font-weight:700;text-align:right;border-top:2px solid #eee;">' + fmt(total) + "</td></tr>";
  html += "</table></td></tr>";

  html += '<tr><td style="padding:0 40px 20px;"><div style="background:#fef3c7;border-radius:8px;padding:14px 16px;">';
  html += '<p style="margin:0;font-size:13px;color:#92400e;">Contact the customer to arrange payment and delivery.</p>';
  html += "</div></td></tr>";

  html += '<tr><td style="background:#f8fafc;padding:16px 40px;border-top:1px solid #eee;"><p style="margin:0;font-size:12px;color:#aaa;text-align:center;">Real Duck Distro Admin Notification</p></td></tr>';
  html += "</table></td></tr></table></body></html>";
  return html;
}

// ── Main handler ──

export async function POST(request: NextRequest) {
  try {
    const body: TelegramOrderBody = await request.json();

    if (!body.items || body.items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const emailTrimmed = body.customerEmail?.trim() || "";
    if (!emailTrimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailTrimmed)) {
      return NextResponse.json({ error: "Please enter a valid email" }, { status: 400 });
    }

    // Fast orders require a minimum cart total — same threshold the UI shows.
    const FAST_ORDER_MIN = 200;
    const cartTotal = calcTotal(body.items);
    if (cartTotal > 0 && cartTotal < FAST_ORDER_MIN) {
      const shortBy = (FAST_ORDER_MIN - cartTotal).toFixed(2);
      return NextResponse.json(
        { error: `Fast order minimum is $${FAST_ORDER_MIN}. Add $${shortBy} more to place this order.` },
        { status: 400 }
      );
    }

    const orderNumber = generateOrderNumber();
    const config = await getAdminConfig();

    // 1. Send to Telegram
    let telegramSent = false;
    if (config.telegramBotToken && config.telegramChatId) {
      const message = buildTelegramMessage(orderNumber, body.items, body.customerPhone, body.customerEmail);
      telegramSent = await sendTelegramMessage(message, config.telegramBotToken, config.telegramChatId);
    }

    if (!telegramSent) {
      return NextResponse.json(
        { error: "Failed to send order to Telegram. Please try again." },
        { status: 500 }
      );
    }

    // 2. Save to database
    const ip = getClientIp(request);
    const geo = await getGeoInfo(ip);

    await prisma.checkoutOrder.create({
      data: {
        orderNumber,
        sessionId: body.sessionId || null,
        firstName: "Fast Order",
        lastName: "Customer",
        email: body.customerEmail?.trim() || "fast@order",
        phone: body.customerPhone?.trim() || "-",
        address: "-",
        city: "-",
        state: "-",
        zipCode: "-",
        country: "-",
        items: JSON.parse(JSON.stringify(body.items)),
        totalItems: body.items.reduce((sum, item) => sum + item.quantity, 0),
        paymentMethod: "pending",
        ipCountry: geo?.country || null,
        ipState: geo?.state || null,
        ipCity: geo?.city || null,
        ipZip: geo?.zip || null,
        ipAddress: geo?.ip || ip || null,
        orderSource: "telegram",
      },
    });

    // 3. Send emails (non-blocking — don't fail the order if email fails)
    const smtpHost = config.smtpHost;
    const smtpUser = config.smtpUser;
    const smtpPass = config.smtpPassword;
    const salesEmail = config.adminEmail;

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.error(
        `Fast order email skipped for ${orderNumber}: SMTP config missing — ` +
        `host=${smtpHost ? "set" : "MISSING"} user=${smtpUser ? "set" : "MISSING"} pass=${smtpPass ? "set" : "MISSING"}`
      );
    }
    if (smtpHost && smtpUser && smtpPass) {
      try {
        const port = Number(config.smtpPort) || 465;
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port,
          secure: port === 465,
          auth: { user: smtpUser, pass: smtpPass },
        });

        const fromAddress = process.env.SMTP_FROM || `Real Duck Distro <${smtpUser}>`;
        const contactMethod = body.customerEmail?.trim() ? "email" : "phone";

        const emailPromises = [];

        // Admin email — always send
        emailPromises.push(
          transporter.sendMail({
            from: fromAddress,
            to: salesEmail || smtpUser,
            subject: `New Fast Order #${orderNumber}` + (body.customerPhone ? ` — ${body.customerPhone}` : ""),
            html: buildAdminFastOrderHtml(orderNumber, body.items, body.customerPhone, body.customerEmail),
          })
        );

        // Customer email — only if they provided one
        if (body.customerEmail?.trim()) {
          const customerTo = body.customerEmail.trim();
          emailPromises.push(
            transporter.sendMail({
              from: fromAddress,
              to: customerTo,
              subject: `Your order #${orderNumber} — Real Duck Distro`,
              html: buildCustomerFastOrderHtml(orderNumber, body.items, contactMethod),
            })
          );
          // Follow-up email with the missing details we still need from them.
          emailPromises.push(
            transporter.sendMail({
              from: fromAddress,
              to: customerTo,
              subject: `Action needed for order #${orderNumber} — a few details to ship it`,
              html: buildCustomerFastOrderFollowUpHtml(orderNumber, body.items, body.customerPhone, body.customerEmail),
            })
          );
        }

        const results = await Promise.allSettled(emailPromises);
        for (const result of results) {
          if (result.status === "rejected") {
            console.error("Fast order email failed:", result.reason?.message || "Unknown error");
          }
        }
      } catch (emailErr) {
        console.error("Fast order email setup error:", emailErr);
      }
    }

    return NextResponse.json({ success: true, orderNumber });
  } catch (error) {
    console.error("Telegram order error:", error);
    return NextResponse.json(
      { error: "Failed to process order" },
      { status: 500 }
    );
  }
}
