import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import prisma from "@/lib/prisma";
import { getClientIp, getGeoInfo } from "@/lib/geo";
import { getAdminConfig } from "@/lib/adminConfig";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://realduckdistro.com";
const LOGO_URL = SITE_URL + "/images/logo.jpg";
const CONTACT_EMAIL = "contact@realduckdistro.com";

// Simple RFC-compliant enough email check
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function detectDeviceBrowser(ua: string | null): { device: string; browser: string; os: string } {
  if (!ua) return { device: "unknown", browser: "unknown", os: "unknown" };
  const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(ua);
  const isTablet = /Tablet|iPad/i.test(ua);
  const device = isTablet ? "tablet" : isMobile ? "mobile" : "desktop";

  let browser = "Other";
  if (/Edg\//.test(ua)) browser = "Edge";
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

function buildWelcomeEmailHtml(email: string): string {
  const firstName = email.split("@")[0];
  let html = '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/></head>';
  html += '<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif;">';
  html += '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 0;"><tr><td align="center">';
  html += '<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">';
  // Hero band
  html += '<tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:36px 40px;text-align:center;">';
  html += '<img src="' + LOGO_URL + '" alt="Real Duck Distro" width="64" height="64" style="border-radius:14px;object-fit:cover;display:inline-block;" />';
  html += '<h1 style="margin:18px 0 6px;font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;">Welcome to the inner circle</h1>';
  html += '<p style="margin:0;font-size:14px;color:rgba(255,255,255,0.7);">Real Duck Distro · Premium cannabis, delivered.</p>';
  html += '</td></tr>';
  // Body
  html += '<tr><td style="padding:32px 40px 8px;">';
  html += '<p style="margin:0 0 16px;font-size:16px;color:#1a1a1a;line-height:1.6;">Hey ' + esc(firstName) + ',</p>';
  html += '<p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.7;">Thanks for subscribing to the Real Duck Distro newsletter — you just unlocked early access to our exclusive drops, loyalty rewards, behind-the-scenes stories, and updates you won\'t find anywhere else.</p>';
  html += '<p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.7;">Here\'s what to expect in your inbox:</p>';
  html += '</td></tr>';
  // Perks list
  const perks = [
    ["🎁", "First info on new drops", "Be the first to know when rare strains and limited-edition packs land."],
    ["💸", "Subscriber-only discounts", "Quiet codes and promos sent only to this list."],
    ["📦", "Shipping & restock alerts", "Know the second your favorites are back in stock."],
    ["🌱", "Cannabis culture & guides", "Curated reads from our blog — strains, terpenes, tips."],
  ];
  html += '<tr><td style="padding:0 40px 8px;"><table width="100%" cellpadding="0" cellspacing="0">';
  for (const [icon, title, desc] of perks) {
    html += '<tr><td style="padding:10px 0;">';
    html += '<table width="100%" cellpadding="0" cellspacing="0"><tr>';
    html += '<td style="width:40px;vertical-align:top;font-size:22px;line-height:1;">' + icon + '</td>';
    html += '<td style="vertical-align:top;">';
    html += '<div style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:2px;">' + title + '</div>';
    html += '<div style="font-size:14px;color:#64748b;line-height:1.5;">' + desc + '</div>';
    html += '</td></tr></table></td></tr>';
  }
  html += '</table></td></tr>';
  // CTA
  html += '<tr><td style="padding:24px 40px 8px;text-align:center;">';
  html += '<a href="' + SITE_URL + '" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 32px;border-radius:999px;">Start shopping</a>';
  html += '</td></tr>';
  // Footer
  html += '<tr><td style="padding:28px 40px 0;">';
  html += '<p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">Have a question? Reply to this email or reach us at <a href="mailto:' + CONTACT_EMAIL + '" style="color:#0f172a;font-weight:600;">' + CONTACT_EMAIL + '</a>.</p>';
  html += '</td></tr>';
  html += '<tr><td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #eef2f7;margin-top:24px;">';
  html += '<p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">&copy; ' + new Date().getFullYear() + ' Real Duck Distro. All rights reserved.<br/>HQ: LA, USA &amp; Sydney, AUS · Priority delivery: KY · MI · FL · MS · Ships worldwide.</p>';
  html += '</td></tr>';
  html += '</table></td></tr></table></body></html>';
  return html;
}

interface AdminNotificationData {
  email: string;
  source: string;
  ip: string | null;
  country: string | null;
  device: string;
  browser: string;
  os: string;
  alreadySubscribed: boolean;
  subscribedAt: Date;
}

function buildAdminNotificationHtml(data: AdminNotificationData): string {
  const rows: Array<[string, string]> = [
    ["Email", data.email],
    ["Source", data.source],
    ["Status", data.alreadySubscribed ? "Reactivated subscription" : "New subscriber"],
    ["Country", data.country || "Unknown"],
    ["IP address", data.ip || "Unknown"],
    ["Device", data.device],
    ["Browser", data.browser],
    ["OS", data.os],
    ["Subscribed at", data.subscribedAt.toUTCString()],
  ];
  let html = '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/></head>';
  html += '<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif;">';
  html += '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 0;"><tr><td align="center">';
  html += '<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">';
  html += '<tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:28px 36px;">';
  html += '<h1 style="margin:0;font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.01em;">📬 New newsletter subscriber</h1>';
  html += '<p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.7);">Real Duck Distro · admin notification</p>';
  html += '</td></tr>';
  html += '<tr><td style="padding:24px 36px;">';
  html += '<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">';
  for (const [label, value] of rows) {
    html += '<tr>';
    html += '<td style="padding:10px 0;border-bottom:1px solid #eef2f7;font-size:13px;color:#64748b;width:40%;">' + esc(label) + '</td>';
    html += '<td style="padding:10px 0;border-bottom:1px solid #eef2f7;font-size:14px;color:#0f172a;font-weight:600;">' + esc(value) + '</td>';
    html += '</tr>';
  }
  html += '</table>';
  html += '</td></tr>';
  html += '<tr><td style="background:#f8fafc;padding:16px 36px;border-top:1px solid #eef2f7;">';
  html += '<p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">Manage subscribers in the admin dashboard.</p>';
  html += '</td></tr>';
  html += '</table></td></tr></table></body></html>';
  return html;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const source = typeof body.source === "string" ? body.source.slice(0, 40) : "popup";

    if (!EMAIL_RE.test(rawEmail) || rawEmail.length > 200) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const ua = request.headers.get("user-agent");
    const { device, browser, os } = detectDeviceBrowser(ua);
    const ip = getClientIp(request);
    const geo = await getGeoInfo(ip).catch(() => null);

    const existing = await prisma.newsletterSubscriber.findUnique({ where: { email: rawEmail } });

    if (existing && existing.active) {
      return NextResponse.json({ ok: true, alreadySubscribed: true });
    }

    const subscriber = existing
      ? await prisma.newsletterSubscriber.update({
          where: { email: rawEmail },
          data: {
            active: true,
            unsubscribedAt: null,
            source,
            sessionId: typeof body.sessionId === "string" ? body.sessionId.slice(0, 100) : existing.sessionId,
            ipAddress: ip || existing.ipAddress,
            country: geo?.country || existing.country,
            device,
            browser,
            os,
          },
        })
      : await prisma.newsletterSubscriber.create({
          data: {
            email: rawEmail,
            source,
            sessionId: typeof body.sessionId === "string" ? body.sessionId.slice(0, 100) : null,
            ipAddress: ip,
            country: geo?.country || null,
            device,
            browser,
            os,
          },
        });

    // Await the welcome email before responding — in Vercel serverless,
    // fire-and-forget promises are killed when the response is returned.
    // Same pattern as /api/orders/telegram.
    try {
      const config = await getAdminConfig();
      if (config.smtpHost && config.smtpUser && config.smtpPassword) {
        const port = Number(config.smtpPort) || 465;
        const transporter = nodemailer.createTransport({
          host: config.smtpHost,
          port,
          secure: port === 465,
          auth: { user: config.smtpUser, pass: config.smtpPassword },
        });
        const fromAddress = process.env.SMTP_FROM || `Real Duck Distro <${config.smtpUser}>`;
        const adminRecipient = config.adminEmail || config.companyEmail;
        const sends: Array<Promise<unknown>> = [
          transporter.sendMail({
            from: fromAddress,
            to: rawEmail,
            subject: "Welcome to Real Duck Distro — you're in 🎉",
            html: buildWelcomeEmailHtml(rawEmail),
          }),
        ];
        if (adminRecipient) {
          sends.push(
            transporter.sendMail({
              from: fromAddress,
              to: adminRecipient,
              subject: `📬 New newsletter subscriber: ${rawEmail}`,
              replyTo: rawEmail,
              html: buildAdminNotificationHtml({
                email: rawEmail,
                source,
                ip,
                country: geo?.country || null,
                device,
                browser,
                os,
                alreadySubscribed: Boolean(existing),
                subscribedAt: new Date(),
              }),
            })
          );
        }
        const results = await Promise.allSettled(sends);
        if (results[0].status === "fulfilled") {
          await prisma.newsletterSubscriber
            .update({ where: { id: subscriber.id }, data: { confirmedAt: new Date() } })
            .catch(() => {});
        } else {
          console.error("Newsletter welcome email failed:", results[0].reason?.message || results[0].reason);
        }
        if (results[1] && results[1].status === "rejected") {
          console.error("Newsletter admin notification failed:", results[1].reason?.message || results[1].reason);
        }
      }
    } catch (err) {
      console.error("Newsletter welcome email setup error:", (err as Error).message);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Newsletter subscribe error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
