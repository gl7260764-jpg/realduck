"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import CloudImage from "@/app/components/CloudImage";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  Star,
  ChevronLeft,
  ChevronRight,
  Check,
  Truck,
  Package,
  Minus,
  Plus,
  X,
  MapPin,
  Send,
  Shield,
  Mail,
  ArrowLeft,
  CheckCircle,
  Link2,
  MessageCircle,
  Loader2,
  Zap,
  ClipboardList,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCart } from "../../context/CartContext";
import { useSettings } from "../../context/SettingsContext";
import { optimizeImage, blurUrl } from "@/lib/cloudinary";
import { formatPrice } from "@/lib/formatPrice";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import { slashedPrice, nthLine } from "@/lib/slashedPrice";

interface Product {
  id: string;
  slug?: string | null;
  title: string;
  category: string;
  indoor: boolean;
  rating: string;
  priceLocal: string;
  priceShip: string;
  slashedPriceLocal?: string | null;
  slashedPriceShip?: string | null;
  isSoldOut: boolean;
  imageUrl: string;
  images?: string[];
}

import { generateProductDescription } from "@/lib/descriptionEngine";

interface ProductDetailClientProps {
  product: Product;
  relatedProducts: Product[];
}

export default function ProductDetailClient({
  product,
  relatedProducts,
}: ProductDetailClientProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"description" | "shipping">("description");
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buyStep, setBuyStep] = useState<"choose" | "fast-contact" | "success">("choose");
  const [copied, setCopied] = useState(false);
  const [alreadyInCart, setAlreadyInCart] = useState(false);
  const [fastLoading, setFastLoading] = useState(false);
  const [fastError, setFastError] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const router = useRouter();
  const { addItem, isInCart, setIsOpen, items } = useCart();
  const settings = useSettings();

  useEffect(() => {
    setAlreadyInCart(isInCart(product.id));
  }, [items, product.id, isInCart]);

  // Track product view
  const tracked = useRef(false);
  useEffect(() => {
    if (tracked.current || !product.id) return;
    tracked.current = true;
    const sessionId = typeof window !== "undefined"
      ? sessionStorage.getItem("analytics_session_id") || ""
      : "";
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "productview", productId: product.id, sessionId }),
    }).catch(console.error);
  }, [product.id]);

  // Build images array: main image + additional images from product.images
  const images = product.images && product.images.length > 0
    ? [product.imageUrl, ...product.images]
    : [product.imageUrl];

  const hasMultipleImages = images.length > 1;

  const priceLocalLines = formatPrice(product.priceLocal).split("\n");
  const priceShipLines = formatPrice(product.priceShip).split("\n");

  const ratingMatch = product.rating.match(/(\d+\.?\d*)/);
  const ratingNumber = ratingMatch ? parseFloat(ratingMatch[1]) : 0;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const incrementQuantity = () => setQuantity((prev) => Math.min(prev + 1, 10));
  const decrementQuantity = () => setQuantity((prev) => Math.max(prev - 1, 1));

  const FAST_ORDER_MIN = 200;
  const fastUnitPrice = (() => {
    const m = priceShipLines[0]?.match(/\$?([\d,]+(?:\.\d+)?)/);
    return m ? parseFloat(m[1].replace(",", "")) : 0;
  })();
  const fastMinQty = fastUnitPrice > 0 ? Math.ceil(FAST_ORDER_MIN / fastUnitPrice) : 0;
  const fastLineTotal = fastUnitPrice * quantity;
  const fastBelowMin = fastUnitPrice > 0 && fastLineTotal < FAST_ORDER_MIN;

  const handleFastOrder = async () => {
    const emailTrimmed = customerEmail.trim();
    if (!emailTrimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailTrimmed)) {
      setFastError("Please enter a valid email");
      return;
    }
    if (fastBelowMin) {
      setFastError(`Fast order minimum is $${FAST_ORDER_MIN}. You need at least ${fastMinQty} unit${fastMinQty === 1 ? "" : "s"}.`);
      return;
    }

    setFastLoading(true);
    setFastError("");

    const priceStr = priceShipLines[0];
    const sessionId = sessionStorage.getItem("analytics_session_id") || "";

    fetch("/api/orders/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        items: [{ productId: product.id, title: product.title, category: product.category, price: priceStr, deliveryType: "ship", quantity }],
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
          items: [{
            id: product.id,
            title: product.title,
            category: product.category,
            imageUrl: product.imageUrl,
            price: priceStr,
            quantity,
            deliveryType: "ship",
          }],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFastError(data.error || "Failed to send order. Please try again.");
        return;
      }

      setBuyStep("success");
    } catch {
      setFastError("Network error. Please try again.");
    } finally {
      setFastLoading(false);
    }
  };

  const handleDetailedOrder = () => {
    if (!alreadyInCart) {
      addItem({
        id: product.id,
        title: product.title,
        category: product.category,
        imageUrl: product.imageUrl,
        priceLocal: product.priceLocal,
        priceShip: product.priceShip,
        priceType: "ship",
      });
    }
    closeBuyModal();
    router.push("/checkout");
  };

  const handleAddToCart = () => {
    if (alreadyInCart) {
      setIsOpen(true);
      return;
    }
    addItem({
      id: product.id,
      title: product.title,
      category: product.category,
      imageUrl: product.imageUrl,
      priceLocal: product.priceLocal,
      priceShip: product.priceShip,
      priceType: "ship",
    });
    setIsOpen(true);
  };

  const closeBuyModal = useCallback(() => {
    setShowBuyModal(false);
    setBuyStep("choose");
    setCustomerPhone("");
    setCustomerEmail("");
    setFastError("");
  }, []);
  const buyModalRef = useFocusTrap(closeBuyModal);

  return (
    <>
      {/* Buy Now Modal */}
      {showBuyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Buy product">
          <div ref={buyModalRef} className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden">
            <div className="relative p-4 border-b border-gray-100 bg-slate-900">
              {buyStep === "fast-contact" && (
                <button
                  onClick={() => {
                    setBuyStep("choose");
                    setFastError("");
                  }}
                  className="absolute left-3 top-3 p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <h3 className="text-lg font-semibold text-white text-center">Buy Now</h3>
              <button
                onClick={closeBuyModal}
                className="absolute right-3 top-3 p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <div className="flex gap-3 mb-4">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  <CloudImage src={optimizeImage(product.imageUrl, "thumbnail")} alt={`${product.title} - ${product.category.toLowerCase()}`} fill sizes="64px" className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 text-sm line-clamp-2">{product.title}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{product.category}</p>
                  <p className="text-xs font-medium text-slate-900 mt-1">Qty: {quantity}</p>
                </div>
              </div>

              {/* Step 1: Fast Order or Detailed Order */}
              {buyStep === "choose" && (
                <>
                  <p className="text-xs text-gray-500 mb-3 text-center">How would you like to order?</p>
                  <div className="space-y-2">
                    <button
                      onClick={() => setBuyStep("fast-contact")}
                      className="w-full flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-amber-500 hover:bg-amber-50 transition-all group"
                    >
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                        <Zap className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-900 text-sm">Fast Order</p>
                        <p className="text-xs text-gray-500">Just your contact info & done</p>
                      </div>
                    </button>
                    <button
                      onClick={handleDetailedOrder}
                      className="w-full flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-slate-900 hover:bg-slate-50 transition-all group"
                    >
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                        <ClipboardList className="w-5 h-5 text-slate-700" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-900 text-sm">Detailed Order</p>
                        <p className="text-xs text-gray-500">Full checkout with address & payment</p>
                      </div>
                    </button>
                  </div>
                </>
              )}

              {/* Step 2: Fast Order - Enter contact info */}
              {buyStep === "fast-contact" && (
                <>
                  <p className="text-xs text-gray-500 mb-3 text-center">Email is required — phone number is optional</p>
                  {fastBelowMin && (
                    <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-xs font-semibold text-amber-900">Fast order minimum is ${FAST_ORDER_MIN}</p>
                      <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                        At {fastUnitPrice ? `$${fastUnitPrice.toFixed(2)}` : "this price"} each, you need at least <strong>{fastMinQty}</strong> unit{fastMinQty === 1 ? "" : "s"} to reach ${FAST_ORDER_MIN}. Use the quantity selector below to bump it up, or switch to Detailed Order.
                      </p>
                    </div>
                  )}
                  <div className="space-y-3">
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
                    {fastError && (
                      <p className="text-xs text-red-600 text-center bg-red-50 p-2 rounded-lg">{fastError}</p>
                    )}
                    <button
                      onClick={handleFastOrder}
                      disabled={fastLoading || fastBelowMin}
                      className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors text-sm"
                    >
                      {fastLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : fastBelowMin ? (
                        `Min ${fastMinQty} unit${fastMinQty === 1 ? "" : "s"} required`
                      ) : (
                        "Submit Order"
                      )}
                    </button>
                  </div>
                </>
              )}

              {/* Success */}
              {buyStep === "success" && (
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-3">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <p className="font-bold text-gray-900 text-base">Order Placed!</p>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed px-2">
                    Our team will process your order and contact you through the email or phone number you provided. Please check it shortly.
                  </p>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed px-2">
                    If it takes more than 5 minutes, reach out to us directly:
                  </p>
                  <div className="flex flex-col gap-2 mt-3 w-full">
                    <a
                      href={settings.telegramOrder}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 py-2.5 bg-[#29B6F6]/10 text-[#0288D1] rounded-lg text-sm font-medium hover:bg-[#29B6F6]/20 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      Message us on Telegram
                    </a>
                    <a
                      href={`mailto:${settings.companyEmail}`}
                      className="flex items-center justify-center gap-2 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      {settings.companyEmail}
                    </a>
                  </div>
                  <button
                    onClick={closeBuyModal}
                    className="mt-4 w-full py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 bg-white">
        {/* Back Button - Links to Telegram */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
          <a
            href={settings.telegramChannel}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-[#29B6F6] transition-colors duration-200"
          >
            <Send className="w-4 h-4" />
            <span className="text-sm font-medium">Contact on Telegram</span>
          </a>
        </div>

        {/* Product Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 lg:items-start">
            {/* Image Gallery */}
            <div className="space-y-3 lg:sticky lg:top-24">
              {/* Main Image */}
              <div className="relative aspect-[5/4] sm:aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden shadow-lg group">
                <CloudImage
                  src={optimizeImage(images[currentImageIndex], "detail")}
                  alt={`${product.title} - premium ${product.category.toLowerCase()} from Real Duck Distro`}
                  title={`${product.title} | Real Duck Distro`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                  placeholder={blurUrl(images[currentImageIndex]) ? "blur" : "empty"}
                  blurDataURL={blurUrl(images[currentImageIndex]) || undefined}
                />

                {/* Navigation Arrows - Only show if multiple images */}
                {hasMultipleImages && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-700" />
                    </button>
                  </>
                )}

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  <span className="bg-slate-900 text-white text-[10px] font-medium px-2.5 py-1 rounded uppercase tracking-wide">
                    {product.category}
                  </span>
                  {product.indoor && product.category === "FLOWER" && (
                    <span className="bg-white/90 backdrop-blur-sm text-slate-700 text-[10px] font-medium px-2.5 py-1 rounded">
                      Indoor
                    </span>
                  )}
                </div>


                {/* Sold Out Overlay */}
                {product.isSoldOut && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="bg-white text-slate-900 text-sm font-semibold px-5 py-2.5 rounded">
                      SOLD OUT
                    </span>
                  </div>
                )}

                {/* Image Counter - Only show if multiple images */}
                {hasMultipleImages && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                )}
              </div>

              {/* Thumbnail Strip - Only show if multiple images */}
              {hasMultipleImages && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 transition-all duration-200 ${currentImageIndex === idx
                          ? "ring-2 ring-slate-900 ring-offset-2"
                          : "opacity-60 hover:opacity-100"
                        }`}
                    >
                      <CloudImage
                        src={optimizeImage(img, "thumbnail")}
                        alt={`${product.title} - photo ${idx + 1}`}
                        fill
                        loading="lazy"
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex flex-col justify-between lg:self-start">
              {/* Title & Rating */}
              <div className="mb-3">
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 tracking-tight">
                  {product.title}
                </h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < Math.floor(ratingNumber / 2)
                            ? "fill-amber-400 text-amber-400"
                            : "fill-gray-200 text-gray-200"
                          }`}
                      />
                    ))}
                  </div>
                  <span className="text-gray-600 text-xs">{product.rating}</span>
                </div>
              </div>

              {/* Share Bar */}
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mr-1">Share</span>
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/product/${product.slug || product.id}`;
                    const text = `Check out ${product.title} on Real Duck Distro! 🔥`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(text + "\n" + url)}`, "_blank");
                  }}
                  className="p-2 rounded-lg bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 active:scale-90 transition-all"
                  title="Share on WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/product/${product.slug || product.id}`;
                    const text = `Check out ${product.title} on Real Duck Distro! 🔥\n${url}`;
                    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, "_blank");
                  }}
                  className="p-2 rounded-lg bg-[#29B6F6]/10 text-[#29B6F6] hover:bg-[#29B6F6]/20 active:scale-90 transition-all"
                  title="Share on Telegram"
                >
                  <Send className="w-4 h-4" />
                </button>
                <button
                  onClick={async () => {
                    const url = `${window.location.origin}/product/${product.slug || product.id}`;
                    if (navigator.share) {
                      try {
                        await navigator.share({ title: product.title, text: `Check out ${product.title} on Real Duck Distro!`, url });
                      } catch {}
                    } else {
                      await navigator.clipboard.writeText(url);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }
                  }}
                  className={`p-2 rounded-lg transition-all active:scale-90 ${
                    copied ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                  title={copied ? "Copied!" : "Copy link"}
                >
                  {copied ? <CheckCircle className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                </button>
              </div>

              {/* Price Section */}
              <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100/70 transition-colors duration-300 mb-3">
                <h3 className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Pricing
                </h3>
                <div className="space-y-1.5">
                  {priceLocalLines.map((line, idx) => {
                    const shipLine = priceShipLines[idx] || "N/A";
                    const localSlash = slashedPrice(line, nthLine(product.slashedPriceLocal, idx));
                    const shipSlash = slashedPrice(shipLine, nthLine(product.slashedPriceShip, idx));
                    return (
                      <div
                        key={idx}
                        className="flex justify-between items-center py-1.5 px-2 -mx-2 border-b border-gray-200 last:border-0 rounded hover:bg-white transition-colors duration-200"
                      >
                        <div>
                          <span className="text-gray-500 text-xs">Intown: </span>
                          {localSlash && (
                            <span className="text-xs text-red-600 line-through font-bold mr-1.5">{localSlash}</span>
                          )}
                          <span className="font-semibold text-gray-900 text-sm">{line}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs">Shipped: </span>
                          {shipSlash && (
                            <span className="text-xs text-red-600 line-through font-bold mr-1.5">{shipSlash}</span>
                          )}
                          <span className="font-semibold text-gray-900 text-sm">{shipLine}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="mb-3">
                <h3 className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Quantity
                </h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors duration-200">
                    <button
                      onClick={decrementQuantity}
                      disabled={quantity <= 1}
                      className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:scale-90 transition-all duration-150 disabled:opacity-40 disabled:hover:bg-transparent"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-medium text-sm select-none">
                      {quantity}
                    </span>
                    <button
                      onClick={incrementQuantity}
                      disabled={quantity >= 10}
                      className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:scale-90 transition-all duration-150 disabled:opacity-40 disabled:hover:bg-transparent"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                <Button
                  size="lg"
                  className="w-full h-11 text-sm font-medium bg-slate-900 hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/25 active:scale-[0.98] text-white rounded-lg transition-all duration-200"
                  disabled={product.isSoldOut}
                  onClick={() => setShowBuyModal(true)}
                >
                  Buy Now
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className={`w-full h-11 text-sm font-medium border active:scale-[0.98] rounded-lg transition-all duration-200 ${
                    alreadyInCart
                      ? "border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
                      : "border-gray-200 hover:border-slate-900 hover:bg-slate-900 hover:text-white text-gray-700"
                  }`}
                  disabled={product.isSoldOut}
                  onClick={handleAddToCart}
                >
                  {alreadyInCart ? (
                    <><Check className="w-4 h-4 mr-2" />Already in Cart</>
                  ) : (
                    <><ShoppingCart className="w-4 h-4 mr-2" />Add to Cart</>
                  )}
                </Button>
              </div>

              {/* REALDUCKDISTRO Branding */}
              <a
                href={settings.telegramChannel}
                target="_blank"
                rel="noopener noreferrer"
                className="pt-3 flex items-center justify-center gap-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="text-base tracking-[0.25em] font-semibold uppercase hover:scale-105 transition-transform duration-200">REALDUCKDISTRO</span>
              </a>
            </div>
          </div>

          {/* Tabs Section */}
          <div className="mt-12 sm:mt-16">
            {/* Tab Buttons */}
            <div className="flex border-b border-gray-200">
              {[
                { id: "description", label: "Description" },
                { id: "shipping", label: "Shipping Info" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`px-5 py-3 text-sm font-medium transition-all duration-200 relative ${activeTab === tab.id
                      ? "text-gray-900"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="py-6">
              {activeTab === "description" && (() => {
                const desc = generateProductDescription(product, relatedProducts);
                const catLabel = product.category.charAt(0) + product.category.slice(1).toLowerCase();

                // Render text with embedded [PRODUCT:id:title] and [CATEGORY:cat:label] links
                const renderContent = (text: string) => {
                  const parts = text.split(/(\[PRODUCT:[^\]]+\]|\[CATEGORY:[^\]]+\])/g);
                  return parts.map((part, i) => {
                    const productMatch = part.match(/\[PRODUCT:([^:]+):([^\]]+)\]/);
                    if (productMatch) {
                      return (
                        <Link key={i} href={`/product/${productMatch[1]}`} className="text-slate-900 font-medium underline underline-offset-2 decoration-slate-300 hover:decoration-slate-900 transition-colors">
                          {productMatch[2]}
                        </Link>
                      );
                    }
                    const catMatch = part.match(/\[CATEGORY:([^:]+):([^\]]+)\]/);
                    if (catMatch) {
                      return (
                        <Link key={i} href={`/?category=${catMatch[1]}`} className="text-slate-900 font-medium underline underline-offset-2 decoration-slate-300 hover:decoration-slate-900 transition-colors">
                          {catMatch[2]}
                        </Link>
                      );
                    }
                    return <span key={i}>{part}</span>;
                  });
                };

                return (
                  <div className="prose max-w-none">
                    {desc.blocks.map((block, i) => (
                      <div key={i}>
                        {block.heading && (
                          <h3 className="text-base font-semibold text-gray-900 mt-6 mb-2">
                            {block.heading}
                          </h3>
                        )}
                        {block.content.split("\n\n").map((para, j) => (
                          <p key={j} className={`${i === 0 && j === 0 ? "text-gray-700 text-[15px]" : "text-gray-600 text-sm"} leading-relaxed ${j > 0 ? "mt-3" : i > 0 ? "" : ""}`}>
                            {renderContent(para)}
                          </p>
                        ))}
                      </div>
                    ))}

                    {/* Quality Points */}
                    <h3 className="text-base font-semibold text-gray-900 mt-6 mb-3">Key Highlights</h3>
                    <ul className="space-y-2">
                      {desc.qualities.map((q, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-gray-600 text-sm hover:text-gray-900 hover:translate-x-1 transition-all duration-200">
                          <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{q}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Related Products Links */}
                    {relatedProducts.length > 0 && (
                      <div className="mt-8 pt-6 border-t border-gray-200">
                        <h3 className="text-base font-semibold text-gray-900 mb-3">
                          More {catLabel} from Real Duck Distro
                        </h3>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {relatedProducts.slice(0, 4).map((rp) => (
                            <Link key={rp.id} href={`/product/${rp.slug || rp.id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-slate-900 hover:text-white text-gray-700 rounded-full text-xs font-medium transition-all duration-200">
                              {rp.title}
                            </Link>
                          ))}
                        </div>
                        <p className="text-sm text-gray-500">
                          Browse our full{" "}
                          <Link href={`/?category=${product.category}`} className="text-slate-900 font-medium underline underline-offset-2 hover:text-slate-700">{catLabel} collection</Link>
                          {" "}or explore{" "}
                          <Link href="/?category=FLOWER" className="text-slate-900 font-medium underline underline-offset-2 hover:text-slate-700">Flower</Link>,{" "}
                          <Link href="/?category=EDIBLES" className="text-slate-900 font-medium underline underline-offset-2 hover:text-slate-700">Edibles</Link>,{" "}
                          <Link href="/?category=CONCENTRATES" className="text-slate-900 font-medium underline underline-offset-2 hover:text-slate-700">Concentrates</Link>,{" "}
                          <Link href="/?category=VAPES" className="text-slate-900 font-medium underline underline-offset-2 hover:text-slate-700">Vapes</Link>,{" "}
                          <Link href="/?category=ROSIN" className="text-slate-900 font-medium underline underline-offset-2 hover:text-slate-700">Rosin</Link>, and{" "}
                          <Link href="/?category=PREROLLS" className="text-slate-900 font-medium underline underline-offset-2 hover:text-slate-700">Pre-Rolls</Link>.
                        </p>
                      </div>
                    )}

                    {/* Closing */}
                    <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {product.title} is available for delivery across the USA and Australia, with fast worldwide shipping on all orders. Headquartered in Los Angeles, USA and Sydney, Australia — with priority delivery to Kentucky, Michigan, Florida and Mississippi — every Real Duck Distro product is backed by our commitment to quality. If it&apos;s not premium, we don&apos;t carry it.
                      </p>
                    </div>
                  </div>
                );
              })()}
              {activeTab === "shipping" && (
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100/80 hover:shadow-sm transition-all duration-200 cursor-default">
                    <Truck className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">Fast Shipping</h4>
                      <p className="text-gray-600 text-sm mt-1">
                        Orders are processed within 24 hours. Delivery times vary by location.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100/80 hover:shadow-sm transition-all duration-200 cursor-default">
                    <Package className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">Discreet Packaging</h4>
                      <p className="text-gray-600 text-sm mt-1">
                        All orders are shipped in plain, unmarked packaging for your privacy.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100/80 hover:shadow-sm transition-all duration-200 cursor-default">
                    <Shield className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">Secure Delivery</h4>
                      <p className="text-gray-600 text-sm mt-1">
                        Tracking provided for all shipments. Contact us for any delivery concerns.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-12 sm:mt-16">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">You May Also Like</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {relatedProducts.map((item) => (
                  <Link
                    key={item.id}
                    href={`/product/${item.slug || item.id}`}
                    className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-gray-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="relative aspect-square overflow-hidden bg-gray-50">
                      <CloudImage
                        src={optimizeImage(item.imageUrl, "card")}
                        alt={`${item.title} - ${item.category.toLowerCase()} from Real Duck Distro`}
                        title={`${item.title} | Real Duck Distro`}
                        fill
                        loading="lazy"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-gray-600 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">{item.category}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* SEO Block - Brand Positioning */}
          <section className="mt-12 sm:mt-16 pt-10 border-t border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 leading-tight">
                  The World&apos;s Leading Premium Cannabis Brand
                </h2>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                  {product.title} is part of the Real Duck Distro premium collection — the world&apos;s leading cannabis lifestyle brand, headquartered in Los Angeles, USA and Sydney, Australia, with priority delivery to Kentucky, Michigan, Florida and Mississippi. Trusted by thousands of customers across the USA, Australia and worldwide, every product is hand-selected for uncompromising quality. We deliver across the entire United States and Australia with fast, discreet worldwide shipping to all major regions.
                </p>
              </div>
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-lg bg-gray-100">
                <CloudImage
                  src={optimizeImage(product.imageUrl, "detail")}
                  alt={`${product.title} - Premium Cannabis | Real Duck Distro USA & Australia | Priority delivery to KY, MI, FL, MS`}
                  title={`Premium Cannabis | Real Duck Distro - HQ in LA & Sydney · KY/MI/FL/MS priority`}
                  fill
                  loading="lazy"
                  placeholder={blurUrl(product.imageUrl) ? "blur" : "empty"}
                  blurDataURL={blurUrl(product.imageUrl) || undefined}
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
