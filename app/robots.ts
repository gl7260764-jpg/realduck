import { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://realduckdistro.com";

/**
 * robots.txt
 *
 *  - Allow everything public to the big engines (Google, Bing, DuckDuckGo).
 *  - Block private/admin/api surfaces.
 *  - Block query-string noise that would otherwise multiply the index
 *    with duplicate pages (sort, page, utm, etc).
 *  - Give AI crawlers explicit access — they drive a growing share of
 *    traffic via direct answers and link citations.
 *  - Slow down aggressive generic bots via crawl-delay.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Default rule — public site is crawlable.
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/admin",
          "/api/",
          "/checkout",
          "/orders",
          "/*?*utm_*",
          "/*?*fbclid=*",
          "/*?*gclid=*",
          "/*?*ref=*",
          "/*?*session*",
          "/*?*sort=*",
          "/*?*page=*",
        ],
      },
      // Explicit allowlist for Google/Bing — ensures critical crawlers
      // aren't accidentally slowed by any later "*" rule additions.
      { userAgent: "Googlebot", allow: "/", disallow: ["/admin/", "/api/", "/checkout", "/orders"] },
      { userAgent: "Googlebot-Image", allow: "/" },
      { userAgent: "Bingbot", allow: "/", disallow: ["/admin/", "/api/", "/checkout", "/orders"] },
      { userAgent: "DuckDuckBot", allow: "/", disallow: ["/admin/", "/api/", "/checkout", "/orders"] },
      { userAgent: "YandexBot", allow: "/", disallow: ["/admin/", "/api/", "/checkout", "/orders"], crawlDelay: 2 },
      { userAgent: "Applebot", allow: "/" },
      // AI crawlers — leave open; they cite the site in chat answers.
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "ChatGPT-User", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "Google-Extended", allow: "/" },
      // Slow down generic aggressive scrapers.
      { userAgent: "AhrefsBot", crawlDelay: 10, allow: "/" },
      { userAgent: "SemrushBot", crawlDelay: 10, allow: "/" },
      { userAgent: "MJ12bot", crawlDelay: 10, allow: "/" },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
