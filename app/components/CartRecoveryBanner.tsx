"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag, ArrowRight, X } from "lucide-react";
import { useCart } from "@/app/context/CartContext";

const SESSION_DISMISS_KEY = "rdd_cart_recovery_dismissed";

/**
 * Slim top banner that surfaces when a returning visitor has items saved in
 * their cart (from a previous session, since cart state lives in localStorage).
 *
 * Why this exists: 80%+ of the Motion-driven traffic from May 2026 was return
 * visitors with abandoned carts. The Winter Springs converter went /
 * → /checkout in 13 seconds because they already knew their cart was saved.
 * Most users don't know that — surfacing it removes the friction.
 *
 * Behavior:
 *   • Hidden during SSR (no flash)
 *   • Hidden when cart is empty
 *   • Hidden after dismiss in this tab (sessionStorage flag)
 *   • Tiny slide-down animation on first appearance
 */
export default function CartRecoveryBanner() {
  const { items, totalItems, cartTotal } = useCart();
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      if (sessionStorage.getItem(SESSION_DISMISS_KEY) === "1") setDismissed(true);
    } catch {
      // sessionStorage disabled — silently no-op
    }
  }, []);

  if (!mounted || dismissed || items.length === 0) return null;

  const itemCount = totalItems || items.reduce((sum, it) => sum + it.quantity, 0);
  const total = cartTotal > 0 ? `$${cartTotal.toFixed(2)}` : "";

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(SESSION_DISMISS_KEY, "1");
    } catch {
      // ignore
    }
    setDismissed(true);
  };

  return (
    <div
      role="region"
      aria-label="Cart recovery"
      className="relative w-full bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-b border-amber-200/70 animate-in slide-in-from-top-2 duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-sm">
            <ShoppingBag className="w-4 h-4 sm:w-4.5 sm:h-4.5" strokeWidth={2.4} />
          </div>

          {/* Message */}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] sm:text-sm font-semibold text-amber-900 leading-tight">
              <span className="hidden sm:inline">Welcome back — you have </span>
              <span className="sm:hidden">You have </span>
              <span className="text-amber-700">
                {itemCount} item{itemCount === 1 ? "" : "s"}
              </span>
              <span> in your cart</span>
              {total && <span className="hidden sm:inline text-amber-700"> · {total}</span>}
            </p>
            <p className="hidden sm:block text-[11px] text-amber-700/80 leading-tight mt-0.5">
              Pick up where you left off — checkout takes under a minute
            </p>
          </div>

          {/* CTA */}
          <Link
            href="/checkout"
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-amber-900 hover:bg-amber-950 text-white text-[12px] sm:text-sm font-semibold rounded-full shadow-sm transition-colors"
          >
            <span className="hidden sm:inline">Resume checkout</span>
            <span className="sm:hidden">Resume</span>
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
          </Link>

          {/* Dismiss */}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss cart reminder"
            className="flex-shrink-0 p-1.5 text-amber-700 hover:text-amber-900 hover:bg-amber-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </div>
  );
}
