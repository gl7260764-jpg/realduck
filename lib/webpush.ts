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

export async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
): Promise<boolean> {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    console.error("VAPID keys not configured — cannot send push");
    return false;
  }

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload),
      {
        TTL: 86400, // 24 hours — ensure delivery even if device is offline
        urgency: "high", // Wake the device from doze/sleep
        // Topic: if set, the push service will replace any pending notification
        // with the same topic instead of stacking. Use the tag as topic so
        // re-pushes of the same announcement replace instead of duplicate.
        ...(payload.tag ? { topic: payload.tag } : {}),
      }
    );
    return true;
  } catch (error: unknown) {
    const statusCode = (error as { statusCode?: number }).statusCode;
    // 404/410 = subscription is gone (unsubscribed or expired)
    if (statusCode === 404 || statusCode === 410) {
      return false;
    }
    // 429 = rate limited by push service — treat as temporary failure, don't deactivate
    if (statusCode === 429) {
      console.warn("Push rate limited for:", subscription.endpoint.slice(0, 60));
      return true; // return true so we don't deactivate a valid subscription
    }
    console.error("Push send error:", statusCode, (error as Error).message);
    return false;
  }
}

export { webpush };
