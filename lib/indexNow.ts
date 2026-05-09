/**
 * IndexNow — ping Bing, Yandex, Naver, Seznam, Yep and any other IndexNow-
 * enabled search engine the moment new/updated content goes live. Google is
 * not (yet) an IndexNow partner but does not mind.
 *
 * Verification: the key file must be reachable at
 *   https://www.realduckdistro.com/<KEY>.txt  →  plain text body == KEY
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

// CRITICAL: must match the canonical host where the key file actually returns
// HTTP 200. realduckdistro.com (apex) 307s to www — if we submit "host: apex"
// Bing tries to verify the key at apex, follows the redirect, and silently
// rejects the entire batch. Force www regardless of what .env says.
const CANONICAL_HOST = "www.realduckdistro.com";
const CANONICAL_ORIGIN = `https://${CANONICAL_HOST}`;

/** Rewrite any URL to the canonical host so the host field always matches. */
function canonicalize(url: string): string {
  try {
    const u = new URL(url);
    u.host = CANONICAL_HOST;
    u.protocol = "https:";
    return u.toString();
  } catch {
    return url;
  }
}

export async function pingIndexNow(urls: string | string[]): Promise<boolean> {
  const list = (Array.isArray(urls) ? urls : [urls]).filter(Boolean).map(canonicalize);
  if (list.length === 0) return true;

  try {
    const body = {
      host: CANONICAL_HOST,
      key: KEY,
      keyLocation: `${CANONICAL_ORIGIN}/${KEY}.txt`,
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
