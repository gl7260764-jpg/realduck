import { NextRequest } from "next/server";

export interface GeoInfo {
  country: string;
  state: string;
  city: string;
  zip: string;
  ip: string;
}

export function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return null;
}

/**
 * Resolve country display name from an ISO-3166-1 alpha-2 code.
 * Intl.DisplayNames is available in Node 18+ and modern runtimes.
 */
let countryDisplay: Intl.DisplayNames | null = null;
function countryName(code: string | null | undefined): string {
  if (!code) return "";
  if (!countryDisplay) {
    try {
      countryDisplay = new Intl.DisplayNames(["en"], { type: "region" });
    } catch {
      countryDisplay = null;
    }
  }
  try {
    return countryDisplay?.of(code.toUpperCase()) || code;
  } catch {
    return code;
  }
}

/**
 * Vercel injects geo headers on every request for free — no API calls, no
 * rate limits, no timeouts, works on every plan. Values come from their
 * edge network's IP-geo database. This is the primary source.
 *
 * Docs: https://vercel.com/docs/edge-network/headers#request-headers
 */
function getVercelGeo(request: NextRequest): GeoInfo | null {
  const countryCode = request.headers.get("x-vercel-ip-country");
  if (!countryCode) return null;
  const city = request.headers.get("x-vercel-ip-city");
  const region = request.headers.get("x-vercel-ip-country-region");
  const zip = request.headers.get("x-vercel-ip-postal-code");
  return {
    country: countryName(countryCode),
    state: region || "",
    // Vercel URL-encodes city names with spaces (e.g. "New%20York")
    city: city ? decodeURIComponent(city) : "",
    zip: zip || "",
    ip: getClientIp(request) || "",
  };
}

const geoCache = new Map<string, { data: GeoInfo; expiry: number }>();

/**
 * Legacy IP-only lookup. Kept for routes that already pass an IP (e.g.
 * background jobs or where the NextRequest isn't available). Prefer
 * `getGeoFromRequest()` — it uses Vercel's built-in geo headers, which
 * are faster and more reliable than any third-party IP lookup.
 */
export async function getGeoInfo(ip: string | null): Promise<GeoInfo | null> {
  if (!ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
    return null;
  }

  const cached = geoCache.get(ip);
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }

  // ip-api.com free tier requires http (not https). Previous code used
  // https which silently returned nothing — that's why the dashboard
  // had 0 country data for 763 page views.
  try {
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,zip,query`,
      { signal: AbortSignal.timeout(3000) }
    );

    if (res.ok) {
      const data = await res.json();
      if (data.status === "success") {
        const result: GeoInfo = {
          country: data.country || "",
          state: data.regionName || "",
          city: data.city || "",
          zip: data.zip || "",
          ip,
        };
        geoCache.set(ip, { data: result, expiry: Date.now() + 10 * 60 * 1000 });
        if (geoCache.size > 2000) {
          const firstKey = geoCache.keys().next().value;
          if (firstKey) geoCache.delete(firstKey);
        }
        return result;
      }
    }
  } catch {}

  return null;
}

/**
 * Preferred: resolve geo directly from the request's Vercel headers.
 * Instant, free, no external calls. Falls back to the IP-based lookup
 * for non-Vercel environments (local dev, other hosts).
 */
export async function getGeoFromRequest(request: NextRequest): Promise<GeoInfo | null> {
  const fromHeaders = getVercelGeo(request);
  if (fromHeaders) return fromHeaders;
  return getGeoInfo(getClientIp(request));
}
