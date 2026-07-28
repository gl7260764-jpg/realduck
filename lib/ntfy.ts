// CRAFTED By W1C3
// ntfy push notifications — replaces the old Telegram order alerts.
// One HTTP POST per event to a topic you subscribe to in the ntfy app.
// All calls are best-effort: they return a result object and never throw into
// the request path, mirroring the sendMail/Brevo style used across the app.
import { getAdminConfig, type AdminConfig } from "@/lib/adminConfig";

const TIMEOUT_MS = 10000;

export interface NtfyArgs {
  title: string;
  message: string;
  // URL opened when the notification is tapped (deep-link into the site).
  clickUrl?: string;
  // Emoji shortcodes shown before the title, e.g. ["shopping_cart"].
  tags?: string[];
  // 1=min … 3=default … 5=max. Orders use 4 (high) so they buzz.
  priority?: 1 | 2 | 3 | 4 | 5;
}

export interface NtfyResult {
  ok: boolean;
  error?: string;
}

// ntfy requires HTTP header values to be ASCII. Titles/messages may contain
// customer names with accents/emoji, so strip anything non-ASCII from HEADER
// fields only (the message body is sent as UTF-8 in the request body and is
// unaffected). Also collapse newlines, which are illegal in header values.
function asciiHeader(s: string): string {
  return s
    .replace(/[\r\n]+/g, " ")
    .replace(/[^\x20-\x7E]/g, "")
    .trim();
}

/**
 * Send a push via ntfy. Pass a preloaded AdminConfig to avoid a redundant DB
 * read when the caller already fetched it (order/newsletter routes do).
 * No-ops (ok:false) when no topic is configured.
 */
export async function sendNtfy(
  args: NtfyArgs,
  preloadedConfig?: AdminConfig,
): Promise<NtfyResult> {
  const config = preloadedConfig || (await getAdminConfig());
  const server = (config.ntfyServer || "https://ntfy.sh").replace(/\/+$/, "");
  const topic = config.ntfyTopic;

  if (!topic) return { ok: false, error: "ntfy topic not configured" };

  const headers: Record<string, string> = {
    "Content-Type": "text/plain; charset=utf-8",
    Title: asciiHeader(args.title),
    Priority: String(args.priority ?? 3),
  };
  if (args.tags && args.tags.length) headers.Tags = args.tags.join(",");
  if (args.clickUrl) headers.Click = args.clickUrl;
  if (config.ntfyToken) headers.Authorization = `Bearer ${config.ntfyToken}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${server}/${encodeURIComponent(topic)}`, {
      method: "POST",
      headers,
      body: args.message,
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `ntfy HTTP ${res.status}: ${text.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (err) {
    const aborted = (err as Error).name === "AbortError";
    // undici wraps the real network error under .cause — surface it so
    // "fetch failed" isn't opaque.
    const cause = (err as { cause?: unknown }).cause;
    const detail = cause instanceof Error ? ` (${cause.message})` : "";
    return { ok: false, error: aborted ? "ntfy request timed out" : (err as Error).message + detail };
  } finally {
    clearTimeout(timer);
  }
}
