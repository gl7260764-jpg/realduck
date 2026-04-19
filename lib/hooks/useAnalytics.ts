"use client";

import { useEffect, useRef } from "react";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sessionId = sessionStorage.getItem("analytics_session_id");
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    sessionStorage.setItem("analytics_session_id", sessionId);
  }
  return sessionId;
}

export function useTrackPageView(page: string) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "pageview", page, sessionId: getSessionId() }),
    }).catch(console.error);
  }, [page]);
}

export function useTrackProductView(productId: string) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current || !productId) return;
    tracked.current = true;

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "productview", productId, sessionId: getSessionId() }),
    }).catch(console.error);
  }, [productId]);
}
