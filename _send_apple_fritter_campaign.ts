/**
 * One-shot newsletter campaign: Apple Fritter S-Tier Indoor drop.
 *
 * Delivery via Hostinger SMTP (Resend domain was deregistered). Pulls SMTP
 * credentials from SiteSetting via getAdminConfig(). Note: Hostinger has
 * known Gmail deliverability issues — Gmail may silently drop or filter
 * for some recipients. Used here as fallback; if it doesn't land for the
 * test recipient we switch providers.
 *
 * Throttling: 800ms between sends to avoid hitting Hostinger's bulk-mail
 * rate limits and to keep reputation cleaner.
 *
 * Usage:
 *   npx tsx ./_send_gumbo_cherries_campaign.ts --preview              # dump first email HTML to a file, no send
 *   npx tsx ./_send_gumbo_cherries_campaign.ts --test you@example.com # send a single test
 *   npx tsx ./_send_gumbo_cherries_campaign.ts --send                 # blast the whole active list
 *
 * CRAFTED By W1C3
 */

import "dotenv/config";
import nodemailer from "nodemailer";
import { writeFile } from "fs/promises";
import { prisma } from "./lib/prisma";
import { getAdminConfig } from "./lib/adminConfig";

const SITE_URL = "https://www.realduckdistro.com";
const PRODUCT_SLUG = "apple-fritter";
const CAMPAIGN_SLUG = "apple-fritter-newsletter-2026";

const args = process.argv.slice(2);
const isPreview = args.includes("--preview");
const isSend = args.includes("--send");
const testIdx = args.indexOf("--test");
const testEmail = testIdx !== -1 ? args[testIdx + 1] : null;

if (!isPreview && !testEmail && !isSend) {
  console.log(`\nUsage:`);
  console.log(`  npx tsx ./_send_newsletter_campaign.ts --preview              # save preview to disk`);
  console.log(`  npx tsx ./_send_newsletter_campaign.ts --test you@example.com # one test email`);
  console.log(`  npx tsx ./_send_newsletter_campaign.ts --send                 # blast the active list\n`);
  process.exit(1);
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

interface Product {
  title: string;
  imageUrl: string;
  images: string[];
  priceShip: string | null;
  slashedPriceShip: string | null;
  description: string | null;
  rating: string | null;
  category: string;
  slug: string | null;
}

function buildCampaignUrl(productSlug: string): string {
  const params = new URLSearchParams({
    utm_source: "newsletter",
    utm_medium: "email",
    utm_campaign: CAMPAIGN_SLUG,
    utm_content: "hero-cta",
  });
  return `${SITE_URL}/product/${productSlug}?${params.toString()}`;
}

function fmtPrice(s: string | null | undefined, fallback: string): string {
  if (!s) return fallback;
  const trimmed = s.trim();
  return trimmed.startsWith("$") ? trimmed : `$${trimmed}`;
}

function buildEmailHtml(product: Product, recipientEmail: string): string {
  const productUrl = buildCampaignUrl(product.slug || PRODUCT_SLUG);
  const live = fmtPrice(product.priceShip, "$500");
  const slashed = fmtPrice(product.slashedPriceShip, "$650");
  const heroImg = product.imageUrl;
  const detailImg = product.images?.[0] || product.imageUrl;

  // Professional sales email — designed to land in Primary Inbox while
  // converting. Key choices:
  //   • Personal business-letter feel (not "newsletter")
  //   • Two clean product photos (placement breaks copy naturally)
  //   • One subtle CTA button (not gradient/rainbow)
  //   • No visible "unsubscribe" link (handled invisibly via header)
  //   • White background, system fonts, minimal styling
  //   • Specific sales psychology: scarcity, anchor pricing, exclusivity
  let h = '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>';
  h += '<meta name="viewport" content="width=device-width,initial-scale=1"/>';
  h += '<meta name="x-apple-disable-message-reformatting"/>';
  h += `<title>${esc(product.title)}</title></head>`;
  h += '<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1a1a1a;font-size:16px;line-height:1.65;">';
  h += '<table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;padding:28px 16px;"><tr><td align="center">';
  h += '<table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">';

  // ── Greeting ──
  h += '<tr><td style="padding:0 0 14px;">';
  h += '<p style="margin:0;font-size:16px;color:#1a1a1a;">Hi,</p>';
  h += "</td></tr>";

  // ── Hook line — tighter, more convincing ──
  h += '<tr><td style="padding:0 0 14px;">';
  h += '<p style="margin:0;font-size:16px;line-height:1.6;color:#1a1a1a;"><strong>Apple Fritter</strong> just restocked — S-tier indoor indica, 28-31% THC range, baked-apple nose with a gassy-cream back end. One of the heaviest, most-frosted phenos we\'ve carried this year.</p>';
  h += "</td></tr>";

  // ── HERO IMAGE 1 ──
  h += '<tr><td style="padding:4px 0 4px;">';
  h += `<a href="${productUrl}" style="display:block;text-decoration:none;border:0;outline:none;"><img src="${esc(heroImg)}" alt="Apple Fritter Indoor — S-Tier Premium Cannabis" width="580" style="display:block;width:100%;max-width:580px;height:auto;border:0;outline:none;border-radius:8px;"/></a>`;
  h += "</td></tr>";

  // ── 15% DISCOUNT CALLOUT (the sales lever) ──
  h += '<tr><td style="padding:20px 0 0;">';
  h += '<table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;"><tr><td style="padding:14px 18px;">';
  h += '<p style="margin:0;font-size:13px;font-weight:700;color:#9a3412;letter-spacing:0.06em;text-transform:uppercase;">Subscribers Only · 15% Off</p>';
  h += '<p style="margin:6px 0 0;font-size:15px;line-height:1.55;color:#7c2d12;">Use code <strong style="background:#fed7aa;padding:2px 8px;border-radius:4px;font-family:Menlo,Consolas,monospace;color:#7c2d12;">FRITTER15</strong> at checkout. Saves you ' + esc(`$${Math.round((parseFloat(live.replace(/[^\d.]/g, "")) || 1000) * 0.15)}`) + ' on a single-pound order. Valid 72 hours.</p>';
  h += '</td></tr></table>';
  h += "</td></tr>";

  // ── Pricing block ──
  h += '<tr><td style="padding:18px 0 4px;">';
  h += '<table width="100%" cellpadding="0" cellspacing="0"><tr>';
  h += '<td style="vertical-align:middle;">';
  h += '<p style="margin:0;font-size:13px;color:#666666;line-height:1.4;">Shipped USA, all-in (before 15% off)</p>';
  h += `<p style="margin:2px 0 0;font-size:24px;font-weight:700;color:#1a1a1a;line-height:1.2;">${esc(live)}<span style="font-weight:400;font-size:14px;color:#999999;margin-left:10px;text-decoration:line-through;">${esc(slashed)}</span></p>`;
  h += "</td>";
  h += '<td align="right" style="vertical-align:middle;">';
  h += `<a href="${productUrl}" style="display:inline-block;background:#1a1a1a;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:13px 24px;border-radius:6px;">Order this →</a>`;
  h += "</td>";
  h += "</tr></table>";
  h += "</td></tr>";

  // ── Why it matters — TIGHTENED to 3 bullets ──
  h += '<tr><td style="padding:24px 0 18px;">';
  h += '<table width="100%" cellpadding="0" cellspacing="0">';
  h += '<tr><td style="padding:4px 0;font-size:15px;line-height:1.55;color:#333333;">✓ <strong style="color:#1a1a1a;">S-tier potency, 28-31% THC range</strong> — hits even with built tolerance.</td></tr>';
  h += '<tr><td style="padding:4px 0;font-size:15px;line-height:1.55;color:#333333;">✓ <strong style="color:#1a1a1a;">Dense, fully-frosted nugs</strong> — sticky, gassy-cream nose, baked-apple front.</td></tr>';
  h += '<tr><td style="padding:4px 0;font-size:15px;line-height:1.55;color:#333333;">✓ <strong style="color:#1a1a1a;">Discreet plain-label shipping</strong> — vacuum-sealed, smell-proof, nationwide.</td></tr>';
  h += '</table>';
  h += "</td></tr>";

  // ── HERO IMAGE 2 (detail shot) ──
  h += '<tr><td style="padding:4px 0 4px;">';
  h += `<a href="${productUrl}" style="display:block;text-decoration:none;border:0;outline:none;"><img src="${esc(detailImg)}" alt="Apple Fritter — bud detail" width="580" style="display:block;width:100%;max-width:580px;height:auto;border:0;outline:none;border-radius:8px;"/></a>`;
  h += "</td></tr>";

  // ── Urgency + Final CTA ──
  h += '<tr><td style="padding:22px 0 8px;">';
  h += '<p style="margin:0;font-size:15px;line-height:1.6;color:#1a1a1a;">These move in 24–48 hours. Code <strong>FRITTER15</strong> expires in 72 hours.</p>';
  h += "</td></tr>";
  h += '<tr><td align="center" style="padding:12px 0 24px;">';
  h += `<a href="${productUrl}" style="display:inline-block;background:#1a1a1a;color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;padding:14px 36px;border-radius:6px;">Lock In Mine →</a>`;
  h += "</td></tr>";

  // ── Sign-off ──
  h += '<tr><td style="padding:6px 0 24px;border-top:1px solid #eeeeee;">';
  h += '<p style="margin:14px 0 0;font-size:14px;line-height:1.5;color:#1a1a1a;">Reply directly or email <a href="mailto:contact@realduckdistro.com" style="color:#1a1a1a;text-decoration:underline;font-weight:600;">contact@realduckdistro.com</a> — I read every reply.</p>';
  h += '<p style="margin:10px 0 0;font-size:14px;color:#1a1a1a;">— Real Duck Distro</p>';
  h += '<p style="margin:4px 0 0;font-size:12px;color:#888888;">Los Angeles, CA · Discreet shipping nationwide<br/><a href="mailto:contact@realduckdistro.com" style="color:#888888;">contact@realduckdistro.com</a></p>';
  h += "</td></tr>";

  h += "</table></td></tr></table></body></html>";
  return h;
}

function buildEmailText(product: Product, _recipientEmail: string): string {
  const url = buildCampaignUrl(product.slug || PRODUCT_SLUG);
  const live = fmtPrice(product.priceShip, "$500");
  const slashed = fmtPrice(product.slashedPriceShip, "$650");
  return [
    `Hi,`,
    ``,
    `Apple Fritter just restocked — S-tier indoor indica, 28-31% THC range, baked-apple nose with a gassy-cream back end. One of the heaviest, most-frosted phenos we've carried this year.`,
    ``,
    `SUBSCRIBERS ONLY — 15% OFF`,
    `Use code FRITTER15 at checkout. Valid 72 hours.`,
    ``,
    `Shipped USA, all-in: ${live} (was ${slashed}, before code)`,
    ``,
    `Why this one:`,
    `✓ S-tier potency, 28-31% THC range — hits even with built tolerance`,
    `✓ Dense, fully-frosted nugs — sticky, gassy-cream back end`,
    `✓ Discreet plain-label shipping nationwide`,
    ``,
    `These move in 24-48 hours. Lock yours in:`,
    `${url}`,
    ``,
    `Code FRITTER15 expires in 72 hours.`,
    ``,
    `Reply directly or email contact@realduckdistro.com — I read every reply.`,
    ``,
    `— Real Duck Distro`,
    `Los Angeles, CA · Discreet shipping nationwide`,
    `contact@realduckdistro.com`,
  ].join("\n");
}

async function main() {
  // 1. Load product
  const product = await prisma.product.findUnique({
    where: { slug: PRODUCT_SLUG },
    select: {
      title: true, imageUrl: true, images: true, priceShip: true, slashedPriceShip: true,
      description: true, rating: true, category: true, slug: true,
    },
  });
  if (!product) {
    console.error(`❌ Product slug "${PRODUCT_SLUG}" not found`);
    process.exit(1);
  }

  // 2. Preview mode — write HTML to disk, no send
  if (isPreview) {
    const html = buildEmailHtml(product, "preview@example.com");
    const path = "./_campaign_preview.html";
    await writeFile(path, html);
    console.log(`\n📄 Preview written to ${path}`);
    console.log(`   Open in a browser: file://${process.cwd()}/${path.slice(2)}\n`);
    await prisma.$disconnect();
    return;
  }

  // 3. Initialize Hostinger SMTP transporter (Resend domain was deregistered).
  //    Note: Hostinger has known Gmail deliverability issues — Gmail may
  //    silently drop or filter. We try anyway; if test fails to land, we
  //    switch providers.
  const config = await getAdminConfig();
  if (!config.smtpHost || !config.smtpUser || !config.smtpPassword) {
    console.error("❌ SMTP not configured in /admin/settings → Email & SMTP");
    console.error("   Need smtpHost, smtpUser, smtpPassword set in SiteSetting.");
    process.exit(1);
  }
  const smtpPort = Number(config.smtpPort) || 465;
  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: config.smtpUser, pass: config.smtpPassword },
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
  });

  // Verify SMTP connection before any sends
  try {
    await transporter.verify();
    console.log(`✅ SMTP connection verified: ${config.smtpHost}:${smtpPort} as ${config.smtpUser}`);
  } catch (e) {
    console.error(`❌ SMTP verify failed:`, (e as Error).message);
    process.exit(1);
  }

  const fromAddress = process.env.SMTP_FROM || `Real Duck Distro <${config.smtpUser}>`;
  const replyTo = config.adminEmail || config.companyEmail || config.smtpUser || "realduckdistro@gmail.com";
  // Subject crafted for Primary Inbox: no emoji, no "drop"/"deal"/"%off"
  // language, no ALL CAPS, no exclamation marks. Sounds like a personal note,
  // not a marketing email. Gmail's Promotions classifier weighs the subject
  // heavily — this is the single biggest lever besides sender reputation.
  const subject = `Apple Fritter just restocked — 15% off (subscribers only)`;

  // Build deliverability headers shared by every send. List-Unsubscribe is
  // the single biggest signal Gmail/Outlook use for inbox-vs-spam routing
  // on newsletter mail. The "One-Click" header lets clients show a 1-click
  // unsubscribe link in the inbox UI itself (no spam reports needed).
  const buildSendHeaders = (recipient: string) => ({
    "List-Unsubscribe": `<mailto:${replyTo}?subject=Unsubscribe%20${encodeURIComponent(recipient)}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    "X-Entity-Ref-ID": CAMPAIGN_SLUG,
  });

  // Single-retry wrapper for transient SMTP failures.
  async function sendWithRetry(to: string): Promise<void> {
    const mail = {
      from: fromAddress,
      to,
      replyTo,
      subject,
      text: buildEmailText(product!, to),
      html: buildEmailHtml(product!, to),
      headers: buildSendHeaders(to),
    };
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const info = await transporter.sendMail(mail);
        if (info.accepted && info.accepted.length > 0) return;
        lastError = new Error(`Not accepted by SMTP server (response: ${info.response || "unknown"})`);
      } catch (e) {
        lastError = e as Error;
      }
      if (attempt === 0) await new Promise((r) => setTimeout(r, 2000));
    }
    throw lastError ?? new Error("SMTP send failed");
  }

  // 4. Test mode — one send to a specific address
  if (testEmail) {
    console.log(`\n📤 Sending test to ${testEmail}…`);
    console.log(`   From: ${fromAddress}`);
    console.log(`   Subject: ${subject}\n`);
    try {
      await sendWithRetry(testEmail);
      console.log(`✅ Test email sent to ${testEmail}`);
      console.log(`\n   Check both INBOX and SPAM folder.`);
      console.log(`   If it's in spam, mark "Not spam" before the full blast.\n`);
    } catch (e) {
      console.error(`❌ Test send failed:`, (e as Error).message);
    }
    await prisma.$disconnect();
    return;
  }

  // 5. Full send to active list
  const subscribers = await prisma.newsletterSubscriber.findMany({
    where: { active: true },
    select: { id: true, email: true },
    orderBy: { createdAt: "desc" },
  });

  if (subscribers.length === 0) {
    console.log("⚠ No active subscribers. Nothing to send.");
    await prisma.$disconnect();
    return;
  }

  console.log(`\n🚀 Sending Apple Fritter campaign to ${subscribers.length} active subscribers`);
  console.log(`   From: ${fromAddress}`);
  console.log(`   Subject: ${subject}`);
  console.log(`   CTA URL: ${buildCampaignUrl(product.slug || PRODUCT_SLUG)}\n`);

  // Track the campaign so future clicks land in your analytics
  try {
    await prisma.campaign.upsert({
      where: { slug: CAMPAIGN_SLUG },
      update: { archived: false },
      create: {
        slug: CAMPAIGN_SLUG,
        name: "Apple Fritter — Newsletter Drop (FRITTER15)",
        purpose: "Subscribers-only product drop email",
        destination: `/product/${product.slug}`,
        utmSource: "newsletter",
        utmMedium: "email",
        utmCampaign: CAMPAIGN_SLUG,
        utmContent: "hero-cta",
      },
    });
    console.log(`📊 Campaign record upserted: ${CAMPAIGN_SLUG}\n`);
  } catch (e) {
    console.warn("⚠ Campaign tracking insert failed (continuing):", (e as Error).message);
  }

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const delay = subscribers.length > 100 ? 800 : 200;

  let ok = 0, fail = 0;
  const failures: Array<{ email: string; reason: string }> = [];

  for (let i = 0; i < subscribers.length; i++) {
    const sub = subscribers[i];
    try {
      await sendWithRetry(sub.email);
      ok++;
      console.log(`  ${String(i + 1).padStart(3)}/${subscribers.length}  ✅  ${sub.email}`);
    } catch (e) {
      fail++;
      const reason = (e as Error).message;
      failures.push({ email: sub.email, reason });
      console.log(`  ${String(i + 1).padStart(3)}/${subscribers.length}  ❌  ${sub.email}  →  ${reason}`);
    }
    if (i < subscribers.length - 1) await sleep(delay);
  }

  console.log(`\n📊 SUMMARY`);
  console.log(`   ✅ Sent:   ${ok}`);
  console.log(`   ❌ Failed: ${fail}`);
  if (failures.length) {
    console.log(`\n   Failure details:`);
    for (const f of failures) console.log(`     • ${f.email} — ${f.reason}`);
  }
  console.log(`\n   Track click-throughs in /admin/analytics under campaign "${CAMPAIGN_SLUG}".\n`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
