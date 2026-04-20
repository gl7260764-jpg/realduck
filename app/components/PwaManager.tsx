"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { Bell, X, Download, Gift, Check, Share, Megaphone, BellRing, Settings, Sparkles } from "lucide-react";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem("analytics_session_id");
  if (!id) {
    id = Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem("analytics_session_id", id);
  }
  return id;
}

function getFingerprint(): string {
  if (typeof window === "undefined") return "";
  const nav = window.navigator;
  const raw = [nav.userAgent, nav.language, screen.width, screen.height, screen.colorDepth, new Date().getTimezoneOffset()].join("|");
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function detectPlatform(): "ios" | "android" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
}

interface ForegroundNotification {
  title: string;
  body: string;
  url: string;
  image?: string;
}

export default function PwaManager() {
  const [showNotifBanner, setShowNotifBanner] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showIOSInstall, setShowIOSInstall] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [installed, setInstalled] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [discountEarned, setDiscountEarned] = useState(false);
  const [platform] = useState(detectPlatform);
  const [foregroundNotif, setForegroundNotif] = useState<ForegroundNotification | null>(null);
  // Notification opt-in modal state — shown to installed PWA users that
  // haven't yet accepted notifications. Re-shown on every app open.
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [notifModalMode, setNotifModalMode] = useState<"prompt" | "denied">("prompt");
  const [enablingNotif, setEnablingNotif] = useState(false);
  const foregroundTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Subscribe to push notifications ──
  const subscribeToPush = useCallback(async (reg: ServiceWorkerRegistration) => {
    try {
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        console.warn("VAPID public key not set — push disabled");
        return;
      }

      if (!reg.pushManager) return;

      const keyBytes = urlBase64ToUint8Array(vapidKey);

      let sub: PushSubscription | null = null;
      try {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          // Use the underlying ArrayBuffer — compatible across all browsers including iOS Safari
          applicationServerKey: keyBytes.buffer as ArrayBuffer,
        });
      } catch (subErr) {
        console.error("PushManager.subscribe failed:", subErr);
        return;
      }

      const json = sub.toJSON();
      if (!json.endpoint || !json.keys) {
        console.error("Invalid subscription — missing endpoint or keys");
        return;
      }

      const res = await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: { endpoint: json.endpoint, keys: json.keys },
          sessionId: getSessionId(),
        }),
      });

      if (res.ok) {
        setSubscribed(true);
        setShowNotifBanner(false);
        localStorage.setItem("nobu_push_subscribed", "1");
      }
    } catch (err) {
      console.error("Push subscribe error:", err);
    }
  }, []);

  // ── Show foreground notification toast ──
  const showForegroundToast = useCallback((data: ForegroundNotification) => {
    if (foregroundTimer.current) clearTimeout(foregroundTimer.current);
    setForegroundNotif(data);
    foregroundTimer.current = setTimeout(() => setForegroundNotif(null), 6000);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setInstalled(true);
      checkPwaDiscount();
      // Ping the server so PwaInstall.lastOpenedAt is bumped every app open.
      trackInstall();

      // PWA user — check if they've accepted push notifications.
      // We do NOT auto-call Notification.requestPermission() silently any
      // more: instead we show a branded modal, and the user triggers the
      // native prompt by clicking Enable. The modal reappears on every app
      // open until they accept (or hard-deny via browser settings).
      (async () => {
        if (!("serviceWorker" in navigator) || !("Notification" in window)) return;
        try {
          const reg = await navigator.serviceWorker.ready;
          if (!reg.pushManager) return;

          const existingSub = await reg.pushManager.getSubscription();
          const perm = Notification.permission;

          if (existingSub && perm === "granted") {
            // Already accepted — sync server record and flag.
            setSubscribed(true);
            const json = existingSub.toJSON();
            fetch("/api/push", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                subscription: { endpoint: json.endpoint, keys: json.keys },
                sessionId: getSessionId(),
              }),
            })
              .then((r) => { if (r.ok) localStorage.setItem("nobu_push_subscribed", "1"); })
              .catch(() => {});
            return;
          }

          if (perm === "denied") {
            // User previously hard-denied in browser settings — show
            // instructions modal so they know how to fix it.
            setNotifModalMode("denied");
            setShowNotifModal(true);
            return;
          }

          // Permission is "default" OR granted-but-missing-sub — show modal.
          setNotifModalMode("prompt");
          setShowNotifModal(true);
        } catch {}
      })();
    }

    // ── Listen for foreground push messages from service worker ──
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === "PUSH_RECEIVED") {
        showForegroundToast({
          title: event.data.title,
          body: event.data.body,
          url: event.data.url || "/announcements",
          image: event.data.image,
        });
      }
    };
    navigator.serviceWorker?.addEventListener("message", handleSWMessage);

    // ── Service Worker + Push Registration ──
    if ("serviceWorker" in navigator) {
      (async () => {
        try {
          const registration = await navigator.serviceWorker.register("/sw.js", {
            updateViaCache: "none",
          });

          // Wait for the SW to be active — critical for first-time visitors
          const reg = await navigator.serviceWorker.ready;

          // Check if push manager exists (not available on iOS Safari outside PWA mode)
          if (!reg.pushManager) {
            // iOS not in PWA mode or old browser — show install prompt instead
            if (platform === "ios" && !isStandalone) {
              const dismissed = localStorage.getItem("nobu_install_dismissed");
              if (!dismissed) setTimeout(() => setShowIOSInstall(true), 15000);
            }
            return;
          }

          const existingSub = await reg.pushManager.getSubscription();

          if (existingSub) {
            // Already subscribed — refresh server-side record
            setSubscribed(true);
            const json = existingSub.toJSON();
            fetch("/api/push", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                subscription: { endpoint: json.endpoint, keys: json.keys },
                sessionId: getSessionId(),
              }),
            })
              .then((r) => {
                if (r.ok) localStorage.setItem("nobu_push_subscribed", "1");
              })
              .catch((err) => {
                console.warn("Failed to refresh push subscription:", err);
              });
          } else if ("Notification" in window && Notification.permission === "granted") {
            // Permission already granted but no subscription — re-subscribe
            await subscribeToPush(reg);
          } else if ("Notification" in window && Notification.permission === "default") {
            // Standalone/PWA mode is handled by the modal flow above; only
            // show the bottom banner for regular-browser users, once.
            if (!isStandalone) {
              setTimeout(() => setShowNotifBanner(true), 12000);
            }
          }

          // Check for SW updates periodically
          if (registration.waiting) {
            registration.waiting.postMessage({ type: "SKIP_WAITING" });
          }
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "activated") {
                  // New SW activated — resubscribe in case keys changed
                  if (localStorage.getItem("nobu_push_subscribed")) {
                    subscribeToPush(reg).catch(() => {});
                  }
                }
              });
            }
          });
        } catch (err) {
          console.error("SW registration error:", err);
        }
      })();
    }

    // ── Install Prompt (Android/Desktop Chrome) ──
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      if (!isStandalone) {
        setTimeout(() => setShowInstallBanner(true), 20000);
      }
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
      setShowInstallBanner(false);
      setShowIOSInstall(false);
      trackInstall();

      // After install, show the notifications opt-in modal so the user can
      // explicitly accept. The modal handles the native prompt + DB record.
      setTimeout(() => {
        if ("Notification" in window) {
          setNotifModalMode(Notification.permission === "denied" ? "denied" : "prompt");
          setShowNotifModal(true);
        }
      }, 1500);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    // ── iOS Install Banner ──
    if (platform === "ios" && !isStandalone) {
      setTimeout(() => setShowIOSInstall(true), 20000);
    }

    // ── Recurring install prompt (notifications are no longer nagged by
    //    timer — notification acceptance is now checked once per app open
    //    and surfaced via the full opt-in modal above when in PWA mode). ──
    const recurringInterval = setInterval(() => {
      const stillStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;

      if (stillStandalone) return; // App installed, no need to nag

      if (installPrompt) setShowInstallBanner(true);
      if (platform === "ios") setShowIOSInstall(true);
    }, 20000);

    return () => {
      clearInterval(recurringInterval);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
      navigator.serviceWorker?.removeEventListener("message", handleSWMessage);
      if (foregroundTimer.current) clearTimeout(foregroundTimer.current);
    };
  }, [subscribeToPush, platform, showForegroundToast, installPrompt]);

  // ── Handlers ──

  const handleEnableNotifications = async () => {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const reg = await navigator.serviceWorker.ready;
      await subscribeToPush(reg);
    }
    setShowNotifBanner(false);
  };

  // Accept from the big PWA opt-in modal. Triggers the native prompt, then
  // subscribes. If the user hard-denies, we flip the modal into the
  // "show settings instructions" mode. Closing the modal (without accepting)
  // will make it reappear the next time the app is opened.
  const handleAcceptNotifModal = async () => {
    if (!("Notification" in window)) return;
    setEnablingNotif(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        if ("serviceWorker" in navigator) {
          const reg = await navigator.serviceWorker.ready;
          await subscribeToPush(reg);
        }
        setShowNotifModal(false);
      } else if (permission === "denied") {
        setNotifModalMode("denied");
      }
      // "default" means the browser suppressed the prompt (rare) — keep modal open.
    } finally {
      setEnablingNotif(false);
    }
  };

  const dismissNotifModal = () => {
    setShowNotifModal(false);
    // No persistent snooze — the modal re-checks on next app open/refresh.
  };

  const dismissNotifBanner = () => {
    setShowNotifBanner(false);
    // Banner will reappear in 20 seconds if still not subscribed
  };

  const handleInstall = async () => {
    if (!installPrompt) return;
    (installPrompt as unknown as { prompt: () => void }).prompt();
    const result = await (installPrompt as unknown as { userChoice: Promise<{ outcome: string }> }).userChoice;
    if (result.outcome === "accepted") {
      setInstalled(true);
      trackInstall();
      // Prompt for notifications after install
      setTimeout(async () => {
        if ("Notification" in window && Notification.permission === "default") {
          const permission = await Notification.requestPermission();
          if (permission === "granted") {
            const reg = await navigator.serviceWorker.ready;
            await subscribeToPush(reg);
          }
        }
      }, 2000);
    }
    setInstallPrompt(null);
    setShowInstallBanner(false);
  };

  const dismissInstallBanner = () => {
    setShowInstallBanner(false);
    setShowIOSInstall(false);
    // Banner will reappear in 20 seconds if still not installed
  };

  const trackInstall = async () => {
    try {
      const res = await fetch("/api/pwa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: getSessionId(), fingerprint: getFingerprint() }),
      });
      const data = await res.json();
      if (data.discountEligible) {
        setDiscountEarned(true);
        localStorage.setItem("nobu_pwa_discount", "1");
        setTimeout(() => setDiscountEarned(false), 5000);
      }
    } catch {}
  };

  const checkPwaDiscount = async () => {
    if (localStorage.getItem("nobu_pwa_discount")) return;
    try {
      const res = await fetch(`/api/pwa?sessionId=${getSessionId()}`);
      const data = await res.json();
      if (data.discountEligible) localStorage.setItem("nobu_pwa_discount", "1");
    } catch {}
  };

  return (
    <>
      {/* ── Foreground Push Notification Toast ── */}
      {/* Shows when user has the app open and a push arrives — like WhatsApp in-app banner */}
      {foregroundNotif && (
        <div
          className="fixed top-0 left-0 right-0 z-[90] animate-[slideDown_0.3s_ease-out] cursor-pointer"
          onClick={() => {
            window.location.href = foregroundNotif.url;
            setForegroundNotif(null);
          }}
        >
          <div className="bg-slate-900/95 backdrop-blur-lg border-b border-white/10 px-4 py-3 mx-auto max-w-lg safe-top">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                <Megaphone className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-bold truncate">{foregroundNotif.title}</p>
                <p className="text-white/60 text-xs mt-0.5 line-clamp-2">{foregroundNotif.body}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setForegroundNotif(null);
                }}
                className="text-white/30 hover:text-white/60 p-1 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Full-screen Notification Opt-In Modal ──
           Shown to installed PWA users (and right after install) until they
           accept. Re-appears on every app open. Dismiss is session-only. */}
      {showNotifModal && !subscribed && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="rdd-notif-title"
          className="fixed inset-0 z-[95] flex items-center justify-center p-4 sm:p-6 animate-[rdd-notif-fade_200ms_ease-out]"
        >
          <div
            className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
            onClick={dismissNotifModal}
            aria-hidden="true"
          />
          <div
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            style={{ animation: "rdd-notif-pop 260ms cubic-bezier(0.22, 1, 0.36, 1)" }}
          >
            <button
              type="button"
              onClick={dismissNotifModal}
              aria-label="Close"
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-slate-600 hover:text-slate-900 backdrop-blur flex items-center justify-center border border-slate-200"
            >
              <X className="w-4 h-4" strokeWidth={2.2} />
            </button>

            {/* Hero */}
            <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 pt-9 pb-7 sm:px-8 text-center overflow-hidden">
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-40"
                style={{
                  backgroundImage:
                    "radial-gradient(600px 200px at 20% -10%, rgba(56,189,248,0.25), transparent 60%), radial-gradient(500px 200px at 90% 120%, rgba(168,85,247,0.25), transparent 60%)",
                }}
              />
              <div className="relative flex flex-col items-center">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-2xl bg-blue-500/30 blur-xl animate-pulse" />
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden ring-4 ring-white/10 shadow-lg bg-white flex items-center justify-center">
                    <Image
                      src="/images/logo.jpg"
                      alt="Real Duck Distro"
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                      priority
                    />
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-blue-500 ring-4 ring-slate-900 flex items-center justify-center">
                      <BellRing className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                    </div>
                  </div>
                </div>
                <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80">
                  <Sparkles className="w-3 h-3" />
                  {notifModalMode === "denied" ? "Notifications disabled" : "One last step"}
                </div>
                <h2
                  id="rdd-notif-title"
                  className="mt-3 text-2xl sm:text-[26px] font-extrabold text-white tracking-tight leading-tight"
                >
                  {notifModalMode === "denied"
                    ? "Re-enable notifications"
                    : "Never miss a drop"}
                </h2>
                <p className="mt-2 text-sm sm:text-[15px] text-white/70 max-w-sm leading-relaxed">
                  {notifModalMode === "denied"
                    ? "Notifications are currently blocked in your browser settings. Turn them on to start receiving drop alerts."
                    : "Turn on push notifications to get instant alerts for new drops, restocks, and subscriber-only offers — right on your device."}
                </p>
              </div>
            </div>

            {/* Body */}
            {notifModalMode === "prompt" ? (
              <div className="px-6 sm:px-8 py-6 sm:py-7">
                <ul className="space-y-3">
                  {[
                    { icon: "🔥", title: "Instant drop alerts", desc: "Rare strains, limited runs — be the first to know." },
                    { icon: "💸", title: "Subscriber-only codes", desc: "Quiet discounts sent to notification subscribers first." },
                    { icon: "📦", title: "Order & restock updates", desc: "Tracking and back-in-stock pings, no refresh needed." },
                  ].map((p) => (
                    <li key={p.title} className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-lg flex-shrink-0">
                        {p.icon}
                      </div>
                      <div>
                        <div className="text-[14px] font-bold text-slate-900 leading-tight">{p.title}</div>
                        <div className="text-[13px] text-slate-500 leading-snug mt-0.5">{p.desc}</div>
                      </div>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={handleAcceptNotifModal}
                  disabled={enablingNotif}
                  className="mt-5 w-full h-12 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[15px] shadow-[0_8px_24px_-8px_rgba(15,23,42,0.5)] disabled:opacity-70 flex items-center justify-center gap-2 transition-all"
                >
                  {enablingNotif ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                      Enabling…
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4" /> Enable notifications
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={dismissNotifModal}
                  className="mt-2 w-full h-10 text-[13px] font-medium text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Not now
                </button>
                <p className="mt-2 text-[11px] text-slate-400 text-center leading-relaxed">
                  You can turn this off anytime in your device settings.
                </p>
              </div>
            ) : (
              <div className="px-6 sm:px-8 py-6 sm:py-7">
                <div className="rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3 text-[13px] text-amber-900 leading-relaxed flex gap-3">
                  <Settings className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    Your browser is currently blocking notifications. Open your app/browser
                    settings for this site and switch <strong>Notifications</strong> to{" "}
                    <strong>Allow</strong>, then reload.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-5 w-full h-12 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[15px] flex items-center justify-center gap-2 transition-all"
                >
                  Reload the app
                </button>
                <button
                  type="button"
                  onClick={dismissNotifModal}
                  className="mt-2 w-full h-10 text-[13px] font-medium text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Not now
                </button>
              </div>
            )}
          </div>

          <style jsx>{`
            @keyframes rdd-notif-fade {
              from { opacity: 0; }
              to   { opacity: 1; }
            }
            @keyframes rdd-notif-pop {
              from { opacity: 0; transform: translateY(14px) scale(0.96); }
              to   { opacity: 1; transform: translateY(0)    scale(1);    }
            }
          `}</style>
        </div>
      )}

      {/* ── Notification Permission Banner (non-PWA browsers only) ── */}
      {showNotifBanner && !subscribed && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-[380px] bg-slate-900 text-white rounded-2xl shadow-2xl shadow-black/30 z-[70] animate-[slideUp_0.4s_ease-out]">
          <div className="p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold">Stay Updated</h3>
                <p className="text-xs text-white/60 mt-1 leading-relaxed">
                  Get instant notifications for new drops, exclusive offers &amp; announcements — just like a message.
                </p>
              </div>
              <button onClick={dismissNotifBanner} className="text-white/30 hover:text-white/60 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleEnableNotifications}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                <Bell className="w-3.5 h-3.5" /> Enable Notifications
              </button>
              <button onClick={dismissNotifBanner} className="px-4 py-2.5 text-white/40 text-sm font-medium rounded-xl">
                Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Android/Desktop Install Banner ── */}
      {showInstallBanner && installPrompt && !installed && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-[380px] bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl shadow-2xl shadow-black/30 z-[70] animate-[slideUp_0.4s_ease-out]">
          <div className="p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Gift className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold">Install & Save 10%</h3>
                <p className="text-xs text-white/60 mt-1 leading-relaxed">
                  Add Real Duck Distro to your home screen and get 10% off your next order.
                </p>
              </div>
              <button onClick={dismissInstallBanner} className="text-white/30 hover:text-white/60 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleInstall}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Install App
              </button>
              <button onClick={dismissInstallBanner} className="px-4 py-2.5 text-white/40 text-sm font-medium rounded-xl">
                Not Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── iOS Install Instructions ── */}
      {showIOSInstall && !installed && (
        <div className="fixed bottom-0 left-0 right-0 z-[70] animate-[slideUp_0.3s_ease-out]">
          <div className="bg-slate-900 border-t border-white/10 rounded-t-2xl p-5 pb-8 mx-auto max-w-lg">
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Gift className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Install & Get Notifications</h3>
                <p className="text-xs text-white/50 mt-0.5">
                  Add to Home Screen to get push notifications + 10% off
                </p>
              </div>
              <button onClick={dismissInstallBanner} className="text-white/30 hover:text-white/60 p-1 ml-auto">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Share className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-sm text-white/80">
                  Tap the <strong className="text-white">Share</strong> button in Safari
                </p>
              </div>
              <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Download className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-sm text-white/80">
                  Scroll down and tap <strong className="text-white">Add to Home Screen</strong>
                </p>
              </div>
              <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bell className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-sm text-white/80">
                  Open the app &amp; tap <strong className="text-white">Allow Notifications</strong> when prompted
                </p>
              </div>
            </div>
            <button onClick={dismissInstallBanner} className="w-full mt-4 py-3 bg-white text-slate-900 font-semibold text-sm rounded-xl">
              Got it
            </button>
          </div>
        </div>
      )}

      {/* ── Discount Earned Toast ── */}
      {discountEarned && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-emerald-600 text-white rounded-2xl shadow-2xl z-[80] px-5 py-3 flex items-center gap-3 animate-[slideDown_0.3s_ease-out]">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Check className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold">10% Discount Unlocked!</p>
            <p className="text-xs text-white/70">Applied to your next order</p>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .safe-top {
          padding-top: max(12px, env(safe-area-inset-top));
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </>
  );
}
