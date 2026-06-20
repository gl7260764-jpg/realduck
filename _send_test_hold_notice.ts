/**
 * One-off TEST email: elegant "Shipment Hold Notice" design sample.
 *
 * This is a DESIGN TEST ONLY. It is NOT a genuine compliance/shipment notice
 * and carries a visible demo banner + footer so no recipient can mistake it
 * for an official communication. No third-party brand identity is used.
 *
 * Delivery via the project's configured Brevo transactional API
 * (BREVO_API_KEY in .env). Sender defaults to the project sender.
 *
 * Usage:
 *   npx tsx ./_send_test_hold_notice.ts --preview   # write HTML to disk, no send
 *   npx tsx ./_send_test_hold_notice.ts --send      # send the test email
 *
 * CRAFTED By W1C3
 */

import "dotenv/config";
import { writeFile } from "fs/promises";

const RECIPIENT = "connectordoctor484@gmail.com";
const SUBJECT = "Shipment Hold Notice – Fire Suppression System Compliance";

const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || "contact@realduckdistro.com";
const SENDER_NAME = "Compliance & Logistics Department";

const args = process.argv.slice(2);
const isPreview = args.includes("--preview");
const isSend = args.includes("--send");
const isDumpJson = args.includes("--dump-json");

if (!isPreview && !isSend && !isDumpJson) {
  console.log("\nUsage:");
  console.log("  npx tsx ./_send_test_hold_notice.ts --preview   # save HTML preview to disk");
  console.log("  npx tsx ./_send_test_hold_notice.ts --send      # send the test email\n");
  process.exit(0);
}

// ── Email HTML ──
// Elegant / formal: serif headline, muted gold accents, centered & airy.
// Prominent demo banner makes the test nature unmistakable.
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Shipment Hold Notice</title>
</head>
<body style="margin:0;padding:0;background:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e9e9ea;">
  <!-- CRAFTED By W1C3 -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#000000;padding:24px 12px;">
    <tr>
      <td align="center">

        <!-- CARD -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;margin:0 auto;background:#1c1c1e;border-radius:16px;overflow:hidden;">
          <!-- Header / headline -->
          <tr>
            <td style="padding:40px 36px 8px;">
              <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#8e8e93;margin-bottom:18px;">Compliance &amp; Logistics</div>
              <h1 style="margin:0;font-size:34px;line-height:1.18;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Your shipment has been placed on hold</h1>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:26px 36px 30px;">
              <a href="mailto:${SENDER_EMAIL}?subject=Re%3A%20Shipment%20Hold%20Notice"
                 style="display:block;background:#fe2c55;color:#ffffff;text-decoration:none;text-align:center;font-size:17px;font-weight:700;padding:16px 24px;border-radius:10px;">
                Contact Support
              </a>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:0 36px 8px;font-size:15.5px;line-height:1.7;color:#c7c7cc;">
              <p style="margin:0 0 16px;">Dear Custom Trailer Pros,</p>

              <p style="margin:0 0 16px;">Thank you for choosing our company for your food trailer project.</p>

              <p style="margin:0 0 16px;">During our final quality assurance and regulatory compliance review, we identified that the fire suppression system installed in your food trailer does not currently meet the applicable safety and certification requirements required for shipment and operation.</p>

              <p style="margin:0 0 16px;">To ensure compliance with industry safety standards and transportation regulations, we have placed your shipment on temporary hold. As a result, the unit will not proceed to shipping until the fire suppression system has been updated, inspected, and approved by the appropriate compliance authorities.</p>

              <p style="margin:0 0 16px;">Our engineering and compliance teams are actively working to address the issue and minimize delays. We will provide you with regular updates regarding corrective actions and an estimated shipping date once compliance has been achieved.</p>

              <p style="margin:0 0 16px;">We understand the importance of timely delivery and sincerely apologize for any inconvenience this may cause. Safety and regulatory compliance remain our highest priorities.</p>

              <p style="margin:0 0 16px;">If you have any questions regarding this notice, please contact our support team for further assistance.</p>

              <p style="margin:0 0 24px;">Thank you for your understanding and cooperation.</p>
            </td>
          </tr>

          <!-- Signature -->
          <tr>
            <td style="padding:0 36px 36px;">
              <div style="border-top:1px solid #2c2c2e;padding-top:20px;font-size:15px;line-height:1.6;color:#c7c7cc;">
                <div style="margin-bottom:2px;">Sincerely,</div>
                <div style="font-weight:bold;color:#ffffff;">Compliance &amp; Logistics Department</div>
                <div style="color:#8e8e93;">Food Trailer Manufacturing Division</div>
              </div>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;

async function main() {
  if (isPreview) {
    const out = "./_test_hold_notice_preview.html";
    await writeFile(out, html, "utf8");
    console.log(`\n✓ Preview written to ${out}\n  Open it in a browser to review the design.\n`);
    return;
  }

  if (isDumpJson) {
    const payload = {
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to: [{ email: RECIPIENT }],
      subject: SUBJECT,
      htmlContent: html,
      replyTo: { email: SENDER_EMAIL },
      tags: ["design-test"],
    };
    await writeFile("./_test_payload.json", JSON.stringify(payload), "utf8");
    console.log("✓ Payload written to ./_test_payload.json");
    return;
  }

  const apiKey = (process.env.BREVO_API_KEY || "").trim();
  if (!apiKey) {
    console.error("✗ BREVO_API_KEY is not set in .env — cannot send.");
    process.exit(1);
  }

  console.log(`\nSending TEST email…`);
  console.log(`  To:      ${RECIPIENT}`);
  console.log(`  From:    ${SENDER_NAME} <${SENDER_EMAIL}>`);
  console.log(`  Subject: ${SUBJECT}\n`);

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to: [{ email: RECIPIENT }],
      subject: SUBJECT,
      htmlContent: html,
      replyTo: { email: SENDER_EMAIL },
      tags: ["design-test"],
    }),
  });

  const text = await res.text();
  if (res.ok) {
    console.log(`✓ Sent. Brevo response: ${text || res.status}\n`);
  } else {
    console.error(`✗ Send failed (HTTP ${res.status}): ${text}\n`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
