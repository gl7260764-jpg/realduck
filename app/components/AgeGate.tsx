"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const KEY = "rdd_age_verified";

/**
 * 21+ age gate — expected legitimacy signal for a cannabis storefront.
 * Renders children normally (so content still SSRs for SEO/crawlers) and lays a
 * one-time overlay on top until the visitor confirms. Choice is remembered in
 * localStorage, so it only appears on first visit.
 */
export default function AgeGate({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) !== "1") setShow(true);
    } catch {
      /* localStorage blocked — don't gate */
    }
  }, []);

  const confirm = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  const decline = () => {
    window.location.href = "https://www.google.com";
  };

  return (
    <>
      {children}
      {show && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Age verification"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-7 text-center shadow-2xl">
            <div
              className="mx-auto mb-4 h-14 w-14 relative"
              style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
            >
              <Image src="/images/logo.jpg" alt="Real Duck Distro" fill className="object-cover" />
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Are you 21 or older?</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              You must be at least 21 years old to enter Real Duck Distro. Please confirm your age to continue.
            </p>
            <div className="mt-6 space-y-2.5">
              <button
                onClick={confirm}
                className="w-full rounded-full bg-slate-900 py-3 text-sm font-semibold text-white transition-transform duration-300 hover:bg-slate-800 active:scale-[0.98]"
              >
                Yes, I&apos;m 21 or older
              </button>
              <button
                onClick={decline}
                className="w-full rounded-full border border-gray-200 py-3 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50"
              >
                No, take me back
              </button>
            </div>
            <p className="mt-4 text-[10px] leading-relaxed text-gray-400">
              By entering you confirm you are of legal age and agree to shop responsibly. Please follow the laws in your area.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
