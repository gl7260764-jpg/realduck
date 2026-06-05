// CRAFTED By W1C3
// Unified outbound email. Prefers Brevo (trusted relay + DKIM = high
// deliverability, fixes Hostinger blocking); falls back to the existing
// Hostinger SMTP path via Nodemailer when Brevo isn't configured or errors.
// Receiving stays entirely on Hostinger — replyTo defaults to contact@.
import nodemailer from "nodemailer";
import { getAdminConfig, type AdminConfig } from "@/lib/adminConfig";
import { brevoEnabled, sendTransactional } from "@/lib/brevo";

export interface SendMailArgs {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  from?: string;
  tags?: string[];
}

export interface SendMailResult {
  ok: boolean;
  provider: "brevo" | "smtp" | "none";
  error?: string;
}

// Optionally pass a preloaded AdminConfig to avoid a redundant DB read when the
// caller already fetched it (e.g. checkout/telegram routes).
export async function sendMail(
  args: SendMailArgs,
  preloadedConfig?: AdminConfig,
): Promise<SendMailResult> {
  const config = preloadedConfig || (await getAdminConfig());

  if (brevoEnabled(config.brevoApiKey)) {
    const res = await sendTransactional({
      to: args.to,
      subject: args.subject,
      html: args.html,
      replyTo: args.replyTo,
      senderName: config.brevoSenderName || undefined,
      senderEmail: config.brevoSenderEmail || undefined,
      tags: args.tags,
      apiKey: config.brevoApiKey,
    });
    if (res.ok) return { ok: true, provider: "brevo" };
    console.error("Brevo send failed, falling back to SMTP:", res.error);
    // fall through to SMTP
  }

  if (config.smtpHost && config.smtpUser && config.smtpPassword) {
    try {
      const port = Number(config.smtpPort) || 465;
      const transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port,
        secure: port === 465,
        auth: { user: config.smtpUser, pass: config.smtpPassword },
      });
      const fromAddress =
        args.from || process.env.SMTP_FROM || `Real Duck Distro <${config.smtpUser}>`;
      await transporter.sendMail({
        from: fromAddress,
        to: Array.isArray(args.to) ? args.to.join(",") : args.to,
        subject: args.subject,
        html: args.html,
        replyTo: args.replyTo,
      });
      return { ok: true, provider: "smtp" };
    } catch (err) {
      console.error("SMTP send failed:", (err as Error).message);
      return { ok: false, provider: "smtp", error: (err as Error).message };
    }
  }

  return { ok: false, provider: "none", error: "No email provider configured" };
}
