"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X, Mail, CheckCircle2, Loader2, Sparkles } from "lucide-react";

/**
 * Newsletter subscription popup.
 *
 * Triggers (first to fire wins):
 *   - 18 seconds after first paint
 *   - exit-intent on desktop (cursor leaves top of viewport)
 *   - scroll past 55% of the page
 *
 * Re-shows only after a cooldown stored in localStorage:
 *   - 30 days after a successful subscribe
 *   -  7 days after an explicit dismiss
 */

const LS_KEY = "rdd_newsletter_popup_v1";
const DISMISS_DAYS = 7;
const SUBSCRIBED_DAYS = 30;
const SHOW_DELAY_MS = 18_000;
const SCROLL_THRESHOLD = 0.55;

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem("analytics_session_id");
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem("analytics_session_id", id);
  }
  return id;
}

function readSnooze(): number {
  if (typeof window === "undefined") return 0;
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function writeSnooze(days: number) {
  const until = Date.now() + days * 24 * 60 * 60 * 1000;
  localStorage.setItem(LS_KEY, String(until));
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function NewsletterPopup() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [alreadyIn, setAlreadyIn] = useState(false);
  const triggered = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const shouldShow = useCallback(() => {
    if (triggered.current) return false;
    if (typeof window === "undefined") return false;
    if (readSnooze() > Date.now()) return false;
    // Never show inside admin/checkout — they have their own flow
    const path = window.location.pathname;
    if (path.startsWith("/admin") || path.startsWith("/checkout")) return false;
    return true;
  }, []);

  const trigger = useCallback(() => {
    if (!shouldShow()) return;
    triggered.current = true;
    setOpen(true);
  }, [shouldShow]);

  // Timer + scroll + exit-intent triggers
  useEffect(() => {
    if (!shouldShow()) return;

    const timer = window.setTimeout(trigger, SHOW_DELAY_MS);

    const onScroll = () => {
      const scrolled = window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      if (scrolled > SCROLL_THRESHOLD) trigger();
    };

    const onMouseLeave = (e: MouseEvent) => {
      // Only desktop: cursor leaves the top edge → exit intent
      if (e.clientY <= 0 && window.matchMedia("(min-width: 768px)").matches) trigger();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [shouldShow, trigger]);

  // Escape closes, body scroll lock, autofocus
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleDismiss();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 120);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(focusTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleDismiss() {
    setOpen(false);
    // Only snooze "dismiss" if they didn't succeed
    if (status !== "success") writeSnooze(DISMISS_DAYS);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_RE.test(trimmed)) {
      setStatus("error");
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          source: "popup",
          sessionId: getSessionId(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error || "Something went wrong. Please try again.");
        return;
      }
      setAlreadyIn(Boolean(data.alreadySubscribed));
      setStatus("success");
      writeSnooze(SUBSCRIBED_DAYS);
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Please try again.");
    }
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rdd-newsletter-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-[rdd-fade_200ms_ease-out]"
    >
      <style jsx>{`
        @keyframes rdd-fade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes rdd-pop {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>

      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={handleDismiss}
        aria-hidden="true"
      />

      <div
        className="relative w-full max-w-md sm:max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
        style={{ animation: "rdd-pop 260ms cubic-bezier(0.22, 1, 0.36, 1)" }}
      >
        {/* Close */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Close newsletter popup"
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-slate-600 hover:text-slate-900 backdrop-blur flex items-center justify-center transition-colors border border-slate-200"
        >
          <X className="w-4.5 h-4.5" strokeWidth={2.2} />
        </button>

        {/* Hero banner */}
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
            <div className="w-16 h-16 rounded-2xl overflow-hidden ring-4 ring-white/10 shadow-lg bg-white/5">
              <Image
                src="/images/logo.jpg"
                alt="Real Duck Distro"
                width={64}
                height={64}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80">
              <Sparkles className="w-3 h-3" /> Exclusive access
            </div>
            <h2
              id="rdd-newsletter-title"
              className="mt-3 text-2xl sm:text-[26px] font-extrabold text-white tracking-tight leading-tight"
            >
              Get first dibs on every drop
            </h2>
            <p className="mt-2 text-sm sm:text-[15px] text-white/70 max-w-sm leading-relaxed">
              Subscribe to our newsletter for subscriber-only discounts, new strain alerts, and the good stuff — straight to your inbox.
            </p>
          </div>
        </div>

        {/* Form area */}
        <div className="px-6 sm:px-8 py-6 sm:py-7">
          {status === "success" ? (
            <div className="text-center py-2">
              <div className="mx-auto w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center ring-4 ring-emerald-100">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">
                {alreadyIn ? "You're already on the list" : "You're in — welcome."}
              </h3>
              <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
                {alreadyIn
                  ? "Thanks for the enthusiasm! You'll keep getting all our updates."
                  : "Check your inbox — we just sent you a welcome note. Next drop alert is on its way."}
              </p>
              <button
                onClick={handleDismiss}
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
              >
                Keep browsing
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <label htmlFor="rdd-newsletter-email" className="sr-only">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400 pointer-events-none" />
                <input
                  ref={inputRef}
                  id="rdd-newsletter-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status === "error") setStatus("idle");
                  }}
                  disabled={status === "loading"}
                  aria-invalid={status === "error"}
                  aria-describedby={status === "error" ? "rdd-newsletter-error" : undefined}
                  className="w-full h-12 pl-11 pr-4 rounded-full border border-slate-200 bg-slate-50 text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-900/10 focus:border-slate-400 transition-all disabled:opacity-60"
                />
              </div>

              {status === "error" && (
                <p id="rdd-newsletter-error" className="mt-2 text-sm text-red-600 flex items-start gap-1.5">
                  <span aria-hidden>⚠</span>
                  <span>{errorMsg}</span>
                </p>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="mt-3 w-full h-12 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[15px] shadow-[0_8px_24px_-8px_rgba(15,23,42,0.5)] disabled:opacity-70 flex items-center justify-center gap-2 transition-all"
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Subscribing…
                  </>
                ) : (
                  <>Subscribe for updates</>
                )}
              </button>

              <p className="mt-4 text-[11px] text-slate-400 text-center leading-relaxed">
                By subscribing you agree to receive marketing emails from Real Duck Distro. No spam, unsubscribe anytime.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
