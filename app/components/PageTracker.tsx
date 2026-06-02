"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sessionId = sessionStorage.getItem("analytics_session_id");
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    sessionStorage.setItem("analytics_session_id", sessionId);
  }
  return sessionId;
}

/**
 * Capture the original referer ONCE per session (first PageView only).
 * Subsequent navigations within the site overwrite document.referrer with
 * the previous internal page — we want the first-touch external source.
 */
function getFirstTouchReferer(): string {
  if (typeof window === "undefined") return "";
  const KEY = "analytics_first_referer";
  const existing = sessionStorage.getItem(KEY);
  if (existing !== null) return existing;
  const ref = document.referrer || "";
  sessionStorage.setItem(KEY, ref);
  return ref;
}

/**
 * Detect if launched from PWA installed on home screen vs browser tab.
 * standalone / minimal-ui / fullscreen = PWA launch (no referer to capture).
 * browser = regular web visit (real referer available).
 */
function getDisplayMode(): string {
  if (typeof window === "undefined") return "browser";
  if (window.matchMedia("(display-mode: standalone)").matches) return "standalone";
  if (window.matchMedia("(display-mode: minimal-ui)").matches) return "minimal-ui";
  if (window.matchMedia("(display-mode: fullscreen)").matches) return "fullscreen";
  // iOS PWA detection (Apple doesn't fully support display-mode media query)
  if ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone) return "standalone";
  return "browser";
}

export default function PageTracker() {
  const pathname = usePathname();
  const lastTracked = useRef("");

  useEffect(() => {
    // Skip admin pages
    if (pathname.startsWith("/admin")) return;
    // Avoid double-tracking same page
    if (lastTracked.current === pathname) return;
    lastTracked.current = pathname;

    // Capture full URL (with query string for UTM params), NOT just pathname.
    // The old behavior of pathname-only meant UTM tags from external links
    // (e.g. ?utm_source=motion) got dropped entirely.
    const fullUrl = window.location.pathname + window.location.search;
    const firstTouchReferer = getFirstTouchReferer();
    const displayMode = getDisplayMode();

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "pageview",
        page: fullUrl,
        sessionId: getSessionId(),
        clientReferer: firstTouchReferer,
        displayMode,
      }),
    }).catch(console.error);
  }, [pathname]);

  return null;
}
