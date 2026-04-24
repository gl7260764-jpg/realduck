/**
 * IndexNow — ping Bing, Yandex, Naver, Seznam, Yep and any other IndexNow-
 * enabled search engine the moment new/updated content goes live. Google is
 * not (yet) an IndexNow partner but does not mind.
 *
 * Verification: the key file must be reachable at
 *   https://realduckdistro.com/<KEY>.txt  →  plain text body == KEY
 * (already placed in /public so Next.js serves it statically).
 *
 * Usage:
 *   import { pingIndexNow } from "@/lib/indexNow";
 *   await pingIndexNow(`${SITE_URL}/product/${slug}`);
 *   // or batch:
 *   await pingIndexNow([url1, url2, ...]);
 *
 * Fire-and-forget — a failure here never blocks the caller.
 */

const KEY = "0a83dcea9b8e48ce895b77e3a75f2f0f";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://realduckdistro.com";

function host(): string {
  try {
    return new URL(SITE_URL).host;
  } catch {
    return "realduckdistro.com";
  }
}

export async function pingIndexNow(urls: string | string[]): Promise<boolean> {
  const list = (Array.isArray(urls) ? urls : [urls]).filter(Boolean);
  if (list.length === 0) return true;

  try {
    const body = {
      host: host(),
      key: KEY,
      keyLocation: `${SITE_URL}/${KEY}.txt`,
      urlList: list.slice(0, 10000), // IndexNow max per request
    };
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
      // Don't block the request if IndexNow is slow
      signal: AbortSignal.timeout(4000),
    });
    // 200/202 = accepted, 400 = bad request (log once), 403 = key mismatch, 429 = rate limited.
    if (!res.ok && res.status !== 202) {
      console.warn(`IndexNow ping returned ${res.status} for ${list.length} URL(s)`);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("IndexNow ping failed:", (err as Error).message);
    return false;
  }
}
