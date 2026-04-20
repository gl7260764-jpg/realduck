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

const PUSH_TIMEOUT_MS = 15_000;

export async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
): Promise<PushResult> {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    console.error("VAPID keys not configured — cannot send push");
    return { ok: false, gone: false };
  }

  try {
    // Race the send against a hard timeout so one slow push service doesn't
    // stall the entire fan-out. The underlying request may continue after
    // timeout — we accept that — but we stop waiting for it.
    const send = webpush.sendNotification(
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
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject({ statusCode: -1, message: "push timeout" }), PUSH_TIMEOUT_MS)
    );
    await Promise.race([send, timeout]);
    return { ok: true, gone: false };
  } catch (error: unknown) {
    const statusCode = (error as { statusCode?: number }).statusCode;
    const message = (error as Error).message;
    // 404/410 → subscription is permanently gone
    // 403 → VAPID signature rejected (key mismatch / key revoked) — from the
    //       push service's perspective the subscription is unreachable for us,
    //       so we mark it gone. A fresh subscribe will repair it.
    if (statusCode === 404 || statusCode === 410 || statusCode === 403) {
      return { ok: false, gone: true, statusCode };
    }
    console.error(`Push send error ${statusCode ?? "?"}:`, message, "endpoint:", subscription.endpoint.slice(0, 60));
    return { ok: false, gone: false, statusCode };
  }
}

// ── Parallel fan-out helper ──
// Sends `payload` to every subscription in parallel (no sequential batching).
// Returns counts + the subset of IDs that should be deactivated.
export interface FanOutSub {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

export async function fanOutPush(
  subs: FanOutSub[],
  payload: PushPayload
): Promise<{ sent: number; failed: number; goneIds: string[] }> {
  if (subs.length === 0) return { sent: 0, failed: 0, goneIds: [] };

  const results = await Promise.allSettled(
    subs.map((sub) =>
      sendPushNotification(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        payload
      )
    )
  );

  let sent = 0;
  let failed = 0;
  const goneIds: string[] = [];

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status === "fulfilled" && r.value.ok) {
      sent++;
    } else {
      failed++;
      if (r.status === "fulfilled" && r.value.gone) {
        goneIds.push(subs[i].id);
      }
    }
  }

  return { sent, failed, goneIds };
}

export { webpush };
