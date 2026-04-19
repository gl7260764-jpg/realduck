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

const geoCache = new Map<string, { data: GeoInfo; expiry: number }>();

export async function getGeoInfo(ip: string | null): Promise<GeoInfo | null> {
  if (!ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
    return null;
  }

  const cached = geoCache.get(ip);
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }

  try {
    const res = await fetch(
      `https://ip-api.com/json/${ip}?fields=status,country,regionName,city,zip,query`,
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
