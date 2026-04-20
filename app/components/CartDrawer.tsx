"use client";

import { useEffect, useState, useCallback } from "react";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import { useRouter } from "next/navigation";
import CloudImage from "./CloudImage";
import { X, Minus, Plus, Trash2, ShoppingBag, Mail, AlertTriangle, Loader2, CheckCircle, Send } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useSettings } from "../context/SettingsContext";
import { optimizeImage } from "@/lib/cloudinary";

const TelegramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, clearCart, getItemPrice, isLowPriceItem, getMinQty, cartMeetsMinimum } = useCart();
  const settings = useSettings();
  const router = useRouter();
  const closeDrawer = useCallback(() => setIsOpen(false), [setIsOpen]);
  const drawerRef = useFocusTrap(closeDrawer);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [telegramSuccess, setTelegramSuccess] = useState(false);
  const [telegramError, setTelegramError] = useState("");
  const [showFastContact, setShowFastContact] = useState(false);
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  // Prevent body scroll when cart is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleEmailCheckout = () => {
    if (items.length === 0) return;
    setIsOpen(false);
    router.push("/checkout");
  };

  const handleTelegramCheckout = async () => {
    if (items.length === 0) return;

    if (!customerPhone.trim() && !customerEmail.trim()) {
      setTelegramError("Please enter your email or phone number");
      return;
    }

    setTelegramLoading(true);
    setTelegramError("");
    setTelegramSuccess(false);

    const sessionId = sessionStorage.getItem("analytics_session_id") || "";

    // Track the order
    fetch("/api/orders/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        items: items.map((item) => ({
          productId: item.id,
          title: item.title,
          category: item.category,
          price: getItemPrice(item),
          deliveryType: item.priceType === "local" ? "local" : "ship",
          quantity: item.quantity,
        })),
      }),
    }).catch(() => {});

    try {
      const res = await fetch("/api/orders/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          customerPhone: customerPhone.trim() || undefined,
          customerEmail: customerEmail.trim() || undefined,
          items: items.map((item) => ({
            id: item.id,
            title: item.title,
            category: item.category,
            imageUrl: item.imageUrl,
            price: getItemPrice(item),
            quantity: item.quantity,
            deliveryType: item.priceType === "local" ? "local" : "ship",
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setTelegramError(data.error || "Failed to send order. Please try again.");
        return;
      }

      setTelegramSuccess(true);
      clearCart();
    } catch {
      setTelegramError("Network error. Please try again.");
    } finally {
      setTelegramLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] transition-opacity duration-300"
        onClick={() => setIsOpen(false)}
      />

      {/* Drawer */}
      <div ref={drawerRef} className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white z-[90] shadow-2xl flex flex-col" role="dialog" aria-modal="true" aria-label="Shopping cart">
        {/* Success Overlay */}
        {telegramSuccess ? (
          <>
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <h2 className="text-lg font-semibold text-gray-900">Order Placed</h2>
              </div>
              <button
                onClick={() => {
                  setTelegramSuccess(false);
                  setShowFastContact(false);
                  setCustomerPhone("");
                  setCustomerEmail("");
                  setIsOpen(false);
                }}
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <p className="font-bold text-gray-900 text-lg mb-3">Order Placed!</p>
              <p className="text-sm text-gray-500 leading-relaxed">
                Our team will process your order and contact you through the email or phone number you provided. Please check it shortly.
              </p>
              <p className="text-sm text-gray-500 mt-3 leading-relaxed">
                If it takes more than 5 minutes, reach out to us directly:
              </p>
              <div className="flex flex-col gap-2.5 mt-5 w-full">
                <a
                  href={settings.telegramOrder}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3 bg-[#29B6F6]/10 text-[#0288D1] rounded-lg text-sm font-medium hover:bg-[#29B6F6]/20 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Message us on Telegram
                </a>
                <a
                  href={`mailto:${settings.companyEmail}`}
                  className="flex items-center justify-center gap-2 py-3 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  {settings.companyEmail}
                </a>
                <button
                  onClick={() => {
                    setTelegramSuccess(false);
                    setShowFastContact(false);
                    setCustomerPhone("");
                    setCustomerEmail("");
                    setIsOpen(false);
                  }}
                  className="py-3 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </>
        ) : (
        <>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-slate-900" />
            <h2 className="text-lg font-semibold text-gray-900">Your Cart</h2>
            <span className="ml-1 px-2 py-0.5 bg-slate-900 text-white text-xs font-medium rounded-full">
              {items.length}
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag className="w-16 h-16 text-gray-200 mb-4" />
              <p className="text-gray-500 mb-2">Your cart is empty</p>
              <p className="text-sm text-gray-400">Add some products to get started</p>
              <button
                onClick={() => setIsOpen(false)}
                className="mt-4 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={`${item.id}-${item.priceType}`}
                  className="flex gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  {/* Image */}
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                    <CloudImage
                      src={optimizeImage(item.imageUrl, "thumbnail")}
                      alt={`${item.title} - ${item.category} Real Duck Distro`}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 text-sm truncate">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">{item.category}</p>
                    <p className="text-sm font-semibold text-slate-900 mt-1">
                      {getItemPrice(item)}
                    </p>
                    <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-medium rounded ${
                      item.priceType === "local"
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {item.priceType === "local" ? "Local Pickup" : "Shipped"}
                    </span>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.priceType, item.quantity - 1)}
                        disabled={isLowPriceItem(item) && item.quantity <= getMinQty(item)}
                        className="p-1 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm font-medium w-6 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.priceType, item.quantity + 1)}
                        className="p-1 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removeItem(item.id, item.priceType)}
                        className="ml-auto p-1 text-red-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {isLowPriceItem(item) && getMinQty(item) > 1 && item.quantity < getMinQty(item) && (
                      <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Min. order: {getMinQty(item)} units for items under $30
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {/* Clear Cart */}
              <button
                onClick={clearCart}
                className="w-full text-sm text-red-500 hover:text-red-600 py-2 transition-colors"
              >
                Clear Cart
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total Items:</span>
              <span className="font-semibold text-gray-900">
                {items.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            </div>
            {!cartMeetsMinimum && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-700">Items under $30 require a minimum order of 5 units, unless your cart total exceeds $300.</p>
              </div>
            )}
            <p className="text-xs text-gray-500">Choose how you&apos;d like to checkout:</p>
            <button
              onClick={handleEmailCheckout}
              disabled={!cartMeetsMinimum}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors"
            >
              <Mail className="w-5 h-5" />
              Checkout
            </button>
            {telegramError && (
              <p className="text-xs text-red-600 text-center bg-red-50 p-2 rounded-lg">{telegramError}</p>
            )}
            {showFastContact ? (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 text-center">Enter at least one way to reach you</p>
                <div>
                  <label className="text-[11px] font-medium text-gray-500 mb-1 block">Email Address</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-gray-500 mb-1 block">Phone Number</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+1 555 123 4567"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition-all"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowFastContact(false);
                      setCustomerPhone("");
                      setCustomerEmail("");
                      setTelegramError("");
                    }}
                    className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleTelegramCheckout}
                    disabled={telegramLoading}
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium text-sm transition-colors"
                  >
                    {telegramLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Submit Order"
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  if (!cartMeetsMinimum) return;
                  setShowFastContact(true);
                  setTelegramError("");
                }}
                disabled={!cartMeetsMinimum}
                className="w-full flex items-center justify-center gap-2 bg-[#29B6F6] hover:bg-[#0288D1] disabled:bg-sky-300 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors"
              >
                <TelegramIcon className="w-5 h-5" />
                Fast Order
              </button>
            )}
          </div>
        )}
        </>
        )}
      </div>
    </>
  );
}
