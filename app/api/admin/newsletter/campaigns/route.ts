// CRAFTED By W1C3
// Newsletter email campaigns: list history (GET) and create + send via Brevo (POST).
// Distinct from /api/admin/campaigns, which is the UTM link-tracking feature.
import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getAdminConfig } from "@/lib/adminConfig";
import { brevoEnabled, createAndSendCampaign, getNewsletterListId } from "@/lib/brevo";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.realduckdistro.com";
const LOGO_URL = SITE_URL + "/images/logo.jpg";
const CONTACT_EMAIL = "contact@realduckdistro.com";

// Wrap the admin-authored body in the branded Real Duck shell. Brevo replaces
// the {{ unsubscribe }} tag with a working unsubscribe link (required for campaigns).
function wrapCampaignHtml(bodyHtml: string): string {
  let html = '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>';
  html += '<meta name="viewport" content="width=device-width,initial-scale=1"/></head>';
  html += '<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif;">';
  html += '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 0;"><tr><td align="center">';
  html += '<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">';
  // Header
  html += '<tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:28px 40px;text-align:center;">';
  html += '<img src="' + LOGO_URL + '" alt="Real Duck Distro" width="56" height="56" style="border-radius:12px;object-fit:cover;display:inline-block;" />';
  html += '<p style="margin:12px 0 0;font-size:13px;color:rgba(255,255,255,0.7);letter-spacing:0.04em;">Real Duck Distro · Premium cannabis, delivered.</p>';
  html += '</td></tr>';
  // Body (admin content)
  html += '<tr><td style="padding:32px 40px;font-size:15px;color:#334155;line-height:1.7;">' + bodyHtml + '</td></tr>';
  // Footer with required unsubscribe
  html += '<tr><td style="background:#f8fafc;padding:22px 40px;border-top:1px solid #eef2f7;">';
  html += '<p style="margin:0 0 8px;font-size:12px;color:#94a3b8;line-height:1.6;text-align:center;">Questions? Reach us at <a href="mailto:' + CONTACT_EMAIL + '" style="color:#0f172a;font-weight:600;">' + CONTACT_EMAIL + '</a>.</p>';
  html += '<p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">&copy; ' + new Date().getFullYear() + ' Real Duck Distro · LA, USA &amp; Sydney, AUS<br/>';
  html += 'You are receiving this because you subscribed at realduckdistro.com. <a href="{{ unsubscribe }}" style="color:#64748b;text-decoration:underline;">Unsubscribe</a>.</p>';
  html += '</td></tr>';
  html += '</table></td></tr></table></body></html>';
  return html;
}

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [campaigns, subscriberCount, config] = await Promise.all([
    prisma.emailCampaign.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        subject: true,
        status: true,
        recipientCount: true,
        brevoCampaignId: true,
        error: true,
        scheduledAt: true,
        sentAt: true,
        createdAt: true,
      },
    }),
    prisma.newsletterSubscriber.count({ where: { active: true } }),
    getAdminConfig(),
  ]);

  return NextResponse.json({
    campaigns,
    subscriberCount,
    brevoConfigured: brevoEnabled(config.brevoApiKey),
  });
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const content = typeof body.content === "string" ? body.content.trim() : "";
  const scheduledAtRaw = typeof body.scheduledAt === "string" ? body.scheduledAt.trim() : "";

  if (!subject || subject.length > 200) {
    return NextResponse.json({ error: "Please enter a subject (max 200 chars)." }, { status: 400 });
  }
  if (!content) {
    return NextResponse.json({ error: "Please enter the email content." }, { status: 400 });
  }

  const config = await getAdminConfig();
  if (!brevoEnabled(config.brevoApiKey)) {
    return NextResponse.json(
      { error: "Brevo is not configured. Add your API key in Settings first." },
      { status: 400 },
    );
  }

  // Normalize schedule: Brevo expects ISO-8601; we send UTC.
  let scheduledAt: string | undefined;
  if (scheduledAtRaw) {
    const d = new Date(scheduledAtRaw);
    if (isNaN(d.getTime()) || d.getTime() < Date.now() + 60_000) {
      return NextResponse.json(
        { error: "Schedule time must be at least a minute in the future." },
        { status: 400 },
      );
    }
    scheduledAt = d.toISOString();
  }

  const listId = await getNewsletterListId(config.brevoApiKey);
  if (!listId) {
    return NextResponse.json({ error: "Could not resolve the Brevo contact list." }, { status: 502 });
  }

  const recipientCount = await prisma.newsletterSubscriber.count({ where: { active: true } });
  const html = wrapCampaignHtml(content);
  const campaignName = `${subject} — ${new Date().toISOString().slice(0, 16).replace("T", " ")}`;

  const record = await prisma.emailCampaign.create({
    data: {
      subject,
      htmlContent: html,
      status: scheduledAt ? "scheduled" : "draft",
      recipientCount,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    },
  });

  const res = await createAndSendCampaign({
    name: campaignName,
    subject,
    html,
    listIds: [listId],
    scheduledAt,
    senderName: config.brevoSenderName || undefined,
    senderEmail: config.brevoSenderEmail || undefined,
    apiKey: config.brevoApiKey,
  });

  if (!res.ok) {
    await prisma.emailCampaign.update({
      where: { id: record.id },
      data: {
        status: "failed",
        error: (res.error || "Send failed").slice(0, 500),
        brevoCampaignId: res.data?.id ?? null,
      },
    });
    return NextResponse.json({ error: res.error || "Failed to send campaign." }, { status: 502 });
  }

  const updated = await prisma.emailCampaign.update({
    where: { id: record.id },
    data: {
      status: scheduledAt ? "scheduled" : "sent",
      brevoCampaignId: res.data?.id ?? null,
      sentAt: scheduledAt ? null : new Date(),
    },
  });

  return NextResponse.json({ ok: true, campaign: updated });
}
