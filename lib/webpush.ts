// @ts-expect-error no types available
import webpush from "web-push";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || "";
const CONTACT_EMAIL = process.env.VAPID_EMAIL || "contact@realduckdistro.com";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(
    `mailto:${CONTACT_EMAIL}`,
    VAPID_PUBLIC,
    VAPID_PRIVATE
  );
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  image?: string;
  tag?: string;
}

export interface PushResult {
  ok: boolean;
  gone: boolean; // subscription is permanently invalid — deactivate it
  statusCode?: number;
}

// Shorten arbitrary tags to a valid Topic header (≤32 URL-safe base64 chars).
function toSafeTopic(tag: string): string {
  const cleaned = tag.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 32);
  return cleaned || "general";
}

export async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
): Promise<PushResult> {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    console.error("VAPID keys not configured — cannot send push");
    return { ok: false, gone: false };
  }

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload),
      {
        TTL: 86400,
        urgency: "high",
        ...(payload.tag ? { topic: toSafeTopic(payload.tag) } : {}),
      }
    );
    return { ok: true, gone: false };
  } catch (error: unknown) {
    const statusCode = (error as { statusCode?: number }).statusCode;
    const message = (error as Error).message;
    // 404/410 → subscription is permanently gone, safe to deactivate
    if (statusCode === 404 || statusCode === 410) {
      return { ok: false, gone: true, statusCode };
    }
    // Anything else is a transient or configuration error — do NOT deactivate.
    console.error(`Push send error ${statusCode ?? "?"}:`, message, "endpoint:", subscription.endpoint.slice(0, 60));
    return { ok: false, gone: false, statusCode };
  }
}

export { webpush };
