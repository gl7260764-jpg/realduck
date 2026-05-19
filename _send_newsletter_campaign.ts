/**
 * One-shot newsletter campaign: Sour Slurpee Exotic SM drop.
 *
 * Delivery via Resend (https://resend.com) — Hostinger SMTP silently dropped
 * to Gmail. Resend's IP pools are trusted by Gmail/Outlook → reliable inbox /
 * Promotions placement instead of /dev/null.
 *
 * Requires RESEND_API_KEY in .env. Sender domain (realduckdistro.com) must
 * be verified in Resend with DKIM, SPF, and MX records published.
 *
 * Usage:
 *   npx tsx ./_send_newsletter_campaign.ts --preview              # dump first email HTML to a file, no send
 *   npx tsx ./_send_newsletter_campaign.ts --test you@example.com # send a single test
 *   npx tsx ./_send_newsletter_campaign.ts --send                 # blast the whole active list
 *
 * Throttling: 200ms between sends (Resend free tier allows 2/sec; 200ms = 5/sec
 * is fine for paid, but Resend free is 100/day — safe for 19 subs).
 *
 * CRAFTED By W1C3
 */

import "dotenv/config";
import { Resend } from "resend";
import { writeFile } from "fs/promises";
import { prisma } from "./lib/prisma";

const SITE_URL = "https://www.realduckdistro.com";
const PRODUCT_SLUG = "sour-slurpee-exotic-sm";
const CAMPAIGN_SLUG = "sour-slurpee-newsletter-2026";

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

function buildEmailHtml(product: Product, recipientEmail: string): string {
  const productUrl = buildCampaignUrl(product.slug || PRODUCT_SLUG);
  const live = product.priceShip || "$350";
  const slashed = product.slashedPriceShip || "$455";
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
  h += '<tr><td style="padding:0 0 16px;">';
  h += '<p style="margin:0;font-size:16px;color:#1a1a1a;">Hi,</p>';
  h += "</td></tr>";

  // ── Hook line ──
  h += '<tr><td style="padding:0 0 14px;">';
  h += '<p style="margin:0;font-size:16px;line-height:1.65;color:#1a1a1a;">Wanted to put this in front of you before it hits the public menu — <strong>Sour Slurpee Exotic</strong> came off the cure room this week and it\'s the strongest small-batch we\'ve had this quarter.</p>';
  h += "</td></tr>";

  // ── HERO IMAGE 1 ──
  h += '<tr><td style="padding:6px 0 6px;">';
  h += `<a href="${productUrl}" style="display:block;text-decoration:none;border:0;outline:none;"><img src="${esc(heroImg)}" alt="Sour Slurpee Exotic — indoor smalls" width="580" style="display:block;width:100%;max-width:580px;height:auto;border:0;outline:none;border-radius:8px;"/></a>`;
  h += "</td></tr>";

  // ── Pricing block (clean, not gimmicky) ──
  h += '<tr><td style="padding:22px 0 4px;">';
  h += '<table width="100%" cellpadding="0" cellspacing="0"><tr>';
  h += '<td style="vertical-align:middle;">';
  h += '<p style="margin:0;font-size:14px;color:#666666;line-height:1.4;">Shipped USA, all-in</p>';
  h += `<p style="margin:2px 0 0;font-size:22px;font-weight:700;color:#1a1a1a;line-height:1.3;">${esc(live)}<span style="font-weight:400;font-size:14px;color:#999999;margin-left:10px;text-decoration:line-through;">${esc(slashed)}</span></p>`;
  h += "</td>";
  h += '<td align="right" style="vertical-align:middle;">';
  h += `<a href="${productUrl}" style="display:inline-block;background:#1a1a1a;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:13px 24px;border-radius:6px;">Order this →</a>`;
  h += "</td>";
  h += "</tr></table>";
  h += "</td></tr>";

  // ── Why it matters (sales body) ──
  h += '<tr><td style="padding:28px 0 14px;">';
  h += '<p style="margin:0;font-size:16px;line-height:1.65;color:#1a1a1a;">Few quick points on why this one is worth your attention:</p>';
  h += '</td></tr>';
  h += '<tr><td style="padding:0 0 22px;">';
  h += '<table width="100%" cellpadding="0" cellspacing="0">';
  h += '<tr><td style="padding:5px 0;font-size:15px;line-height:1.6;color:#333333;"><strong style="color:#1a1a1a;">Same cure room as our $850+ top cola.</strong> Identical genetics, identical 6-week cure. The "smalls" tag just means smaller nug size — same smoke profile.</td></tr>';
  h += '<tr><td style="padding:5px 0;font-size:15px;line-height:1.6;color:#333333;"><strong style="color:#1a1a1a;">Loud LCG slushee terps.</strong> Candy nose you can smell across the room. 10/10 from our cure team.</td></tr>';
  h += '<tr><td style="padding:5px 0;font-size:15px;line-height:1.6;color:#333333;"><strong style="color:#1a1a1a;">Full color, full trichome.</strong> Bag appeal is the first thing your end-buyer will notice.</td></tr>';
  h += '<tr><td style="padding:5px 0;font-size:15px;line-height:1.6;color:#333333;"><strong style="color:#1a1a1a;">Plain-label discreet shipping.</strong> Vacuum-sealed, smell-proof, neutral return address.</td></tr>';
  h += '</table>';
  h += "</td></tr>";

  // ── HERO IMAGE 2 (detail shot) ──
  h += '<tr><td style="padding:6px 0 6px;">';
  h += `<a href="${productUrl}" style="display:block;text-decoration:none;border:0;outline:none;"><img src="${esc(detailImg)}" alt="Sour Slurpee Exotic — bud detail" width="580" style="display:block;width:100%;max-width:580px;height:auto;border:0;outline:none;border-radius:8px;"/></a>`;
  h += "</td></tr>";

  // ── Scarcity / urgency line ──
  h += '<tr><td style="padding:24px 0 14px;">';
  h += '<p style="margin:0;font-size:16px;line-height:1.65;color:#1a1a1a;">These tend to move within 24–48 hours of dropping. If you want a bag set aside before the public menu sees it, lock yours in below.</p>';
  h += "</td></tr>";

  // ── Final CTA (single, clean) ──
  h += '<tr><td align="center" style="padding:12px 0 28px;">';
  h += `<a href="${productUrl}" style="display:inline-block;background:#1a1a1a;color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;padding:14px 36px;border-radius:6px;">View Sour Slurpee Exotic</a>`;
  h += "</td></tr>";

  // ── Sign-off ──
  h += '<tr><td style="padding:6px 0 28px;border-top:1px solid #eeeeee;">';
  h += '<p style="margin:14px 0 6px;font-size:15px;line-height:1.6;color:#1a1a1a;">Reply if you have questions or want help placing the order — I read every reply.</p>';
  h += '<p style="margin:14px 0 0;font-size:15px;color:#1a1a1a;">— Real Duck Distro</p>';
  h += '<p style="margin:6px 0 0;font-size:13px;color:#888888;">Los Angeles, CA · Discreet shipping nationwide</p>';
  h += "</td></tr>";

  h += "</table></td></tr></table></body></html>";
  return h;
}

function buildEmailText(product: Product, _recipientEmail: string): string {
  const url = buildCampaignUrl(product.slug || PRODUCT_SLUG);
  const live = product.priceShip || "$350";
  const slashed = product.slashedPriceShip || "$455";
  return [
    `Hi,`,
    ``,
    `Wanted to put this in front of you before it hits the public menu — Sour Slurpee Exotic came off the cure room this week and it's the strongest small-batch we've had this quarter.`,
    ``,
    `Shipped USA, all-in: ${live} (was ${slashed})`,
    ``,
    `Why this one matters:`,
    `- Same cure room as our $850+ top cola — identical genetics, identical 6-week cure. The "smalls" tag just means smaller nug size.`,
    `- Loud LCG slushee terps, candy nose, 10/10 from our cure team.`,
    `- Full color, full trichome — bag appeal your end-buyer notices immediately.`,
    `- Plain-label, vacuum-sealed, smell-proof shipping.`,
    ``,
    `These tend to move within 24-48 hours of dropping. Lock yours in:`,
    `${url}`,
    ``,
    `Reply if you have questions — I read every reply.`,
    ``,
    `— Real Duck Distro`,
    `Los Angeles, CA · Discreet shipping nationwide`,
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

  // 3. Initialize Resend client
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("❌ RESEND_API_KEY not set in .env");
    console.error("   Add it to /home/wice2/Desktop/projects/realduck/.env and re-run.");
    process.exit(1);
  }
  const resend = new Resend(apiKey);

  // Sender domain MUST match a verified domain in your Resend dashboard.
  // Resend verifies the ROOT domain (realduckdistro.com) via the DKIM record;
  // the MX/SPF records at "send." are only used as the Return-Path for
  // bounces, NOT as the sender domain. So we send from the root.
  const fromAddress = "Real Duck Distro <newsletter@realduckdistro.com>";
  const replyTo = "realduckdistro@gmail.com";
  // Subject crafted for Primary Inbox: no emoji, no "drop"/"deal"/"%off"
  // language, no ALL CAPS, no exclamation marks. Sounds like a personal note,
  // not a marketing email. Gmail's Promotions classifier weighs the subject
  // heavily — this is the single biggest lever besides sender reputation.
  const subject = `Sour Slurpee Exotic just came in — wanted you to see this`;

  // Build deliverability headers shared by every send. List-Unsubscribe is
  // the single biggest signal Gmail/Outlook use for inbox-vs-spam routing
  // on newsletter mail. The "One-Click" header lets clients show a 1-click
  // unsubscribe link in the inbox UI itself (no spam reports needed).
  const buildSendHeaders = (recipient: string) => ({
    "List-Unsubscribe": `<mailto:${replyTo}?subject=Unsubscribe%20${encodeURIComponent(recipient)}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    "X-Entity-Ref-ID": CAMPAIGN_SLUG,
  });

  // Single-retry wrapper for transient API failures.
  async function sendWithRetry(to: string): Promise<void> {
    const payload = {
      from: fromAddress,
      to: [to],
      replyTo,
      subject,
      text: buildEmailText(product!, to),
      html: buildEmailHtml(product!, to),
      headers: buildSendHeaders(to),
      tags: [
        { name: "campaign", value: CAMPAIGN_SLUG },
        { name: "product", value: product!.slug || "unknown" },
      ],
    };
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      const { data, error } = await resend.emails.send(payload);
      if (!error && data?.id) return;
      lastError = error ? new Error(`${error.name || "Resend"}: ${error.message}`) : new Error("No id returned");
      if (attempt === 0) await new Promise((r) => setTimeout(r, 2000));
    }
    throw lastError ?? new Error("Resend send failed");
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

  console.log(`\n🚀 Sending Sour Slurpee Exotic campaign to ${subscribers.length} active subscribers`);
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
        name: "Sour Slurpee Exotic SM — Newsletter Drop",
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
