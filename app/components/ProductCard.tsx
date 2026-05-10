"use client";

import CloudImage from "./CloudImage";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Star, Heart, X, ArrowLeft, Check, Loader2, CheckCircle, Zap, ClipboardList, Send, Mail } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";
import { useSettings } from "../context/SettingsContext";
import { optimizeImage, blurUrl } from "@/lib/cloudinary";
import { formatPrice } from "@/lib/formatPrice";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";

import { slashedPrice, nthLine } from "@/lib/slashedPrice";

interface ProductCardProps {
  id: string;
  slug?: string | null;
  title: string;
  category: string;
  indoor: boolean;
  rating: string;
  priceLocal: string;
  priceShip: string;
  /** Optional admin-set "compare-at" price shown crossed out next to priceLocal. */
  slashedPriceLocal?: string | null;
  /** Optional admin-set "compare-at" price shown crossed out next to priceShip. */
  slashedPriceShip?: string | null;
  isSoldOut: boolean;
  imageUrl: string;
  videoUrl?: string | null;
}

export default function ProductCard({
  id,
  slug,
  title,
  category,
  indoor,
  rating,
  priceLocal,
  priceShip,
  slashedPriceLocal,
  slashedPriceShip,
  isSoldOut,
  imageUrl,
  videoUrl,
}: ProductCardProps) {
  const router = useRouter();
  const settings = useSettings();
  const [isLiked, setIsLiked] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buyStep, setBuyStep] = useState<"choose" | "fast-contact" | "success">("choose");
  const [alreadyInCart, setAlreadyInCart] = useState(false);
  const [fastLoading, setFastLoading] = useState(false);
  const [fastError, setFastError] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [fastQty, setFastQty] = useState(category === "DISPOSABLES" ? 25 : 1);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRef = useRef<HTMLAnchorElement>(null);
  const { addItem, isInCart, setIsOpen, items } = useCart();

  const closeBuyModal = useCallback(() => {
    setShowBuyModal(false);
    setBuyStep("choose");
    setCustomerPhone("");
    setCustomerEmail("");
    setFastError("");
  }, []);
  const modalRef = useFocusTrap(closeBuyModal);

  useEffect(() => {
    setAlreadyInCart(isInCart(id));
  }, [items, id, isInCart]);

  // Touch devices: autoplay the preview video when the card is scrolled into view,
  // and skip the mouse hover handlers (which otherwise fire on press-and-hold).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const touch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    setIsTouchDevice(touch);

    if (!touch || !videoUrl || !mediaRef.current) return;

    const el = mediaRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const video = videoRef.current;
        if (!video) return;
        if (entry.isIntersecting) {
          setIsHovering(true);
          video.play().catch(() => {});
        } else {
          setIsHovering(false);
          video.pause();
          video.currentTime = 0;
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [videoUrl]);

  const priceLocalLines = formatPrice(priceLocal).split("\n");
  const priceShipLines = formatPrice(priceShip).split("\n");
  const isSinglePrice = priceLocalLines.length === 1 && !priceLocal.includes("/HP") && !priceLocal.includes("/P");

  const ratingMatch = rating.match(/(\d+\.?\d*)/);
  const ratingNumber = ratingMatch ? parseFloat(ratingMatch[1]) : 0;

  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  const handleAddToCart = () => {
    if (alreadyInCart) {
      setIsOpen(true);
      return;
    }
    const added = addItem({
      id,
      title,
      category,
      imageUrl,
      priceLocal,
      priceShip,
      priceType: "ship",
    });
    if (added) {
      setIsOpen(true);
    }
  };

  const isDisposables = category === "DISPOSABLES";
  const DISPOSABLES_MIN_QTY = 25;
  const FAST_ORDER_MIN = 200;
  const fastUnitPrice = (() => {
    const m = priceShip.split("\n")[0]?.match(/\$?([\d,]+(?:\.\d+)?)/);
    return m ? parseFloat(m[1].replace(",", "")) : 0;
  })();
  // For disposables, the "min qty" is fixed at 25 — the $200 dollar floor doesn't apply.
  const fastMinQty = isDisposables
    ? DISPOSABLES_MIN_QTY
    : (fastUnitPrice > 0 ? Math.ceil(FAST_ORDER_MIN / fastUnitPrice) : 1);
  const fastLineTotal = fastUnitPrice * fastQty;
  const fastBelowMin = isDisposables
    ? fastQty < DISPOSABLES_MIN_QTY
    : (fastUnitPrice > 0 && fastLineTotal < FAST_ORDER_MIN);

  const handleFastOrder = async () => {
    const emailTrimmed = customerEmail.trim();
    if (!emailTrimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailTrimmed)) {
      setFastError("Please enter a valid email");
      return;
    }
    if (fastBelowMin) {
      setFastError(
        isDisposables
          ? `Minimum order for disposables is ${DISPOSABLES_MIN_QTY} units. You currently have ${fastQty}.`
          : `Fast order minimum is $${FAST_ORDER_MIN}. You need at least ${fastMinQty} unit${fastMinQty === 1 ? "" : "s"}.`,
      );
      return;
    }

    setFastLoading(true);
    setFastError("");

    const price = priceShip.split("\n")[0];
    const sessionId = sessionStorage.getItem("analytics_session_id") || "";

    fetch("/api/orders/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        items: [{ productId: id, title, category, price, deliveryType: "ship", quantity: fastQty }],
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
            id,
            title,
            category,
            imageUrl,
            price,
            quantity: fastQty,
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
        id,
        title,
        category,
        imageUrl,
        priceLocal,
        priceShip,
        priceType: "ship",
      });
    }
    closeBuyModal();
    router.push("/checkout");
  };


  return (
    <>
      {/* Buy Now Modal */}
      {showBuyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Buy product">
          <div ref={modalRef} className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden">
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
                  <CloudImage src={optimizeImage(imageUrl, "thumbnail")} alt={`Buy ${title} ${category.toLowerCase()} online from Real Duck Distro Los Angeles`} fill sizes="64px" className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 text-sm line-clamp-2">{title}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{category}</p>
                </div>
              </div>

              {/* Step 1: Fast Order or Detailed Order */}
              {buyStep === "choose" && (
                <>
                  <p className="text-xs text-gray-500 mb-3 text-center">How would you like to order?</p>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setFastQty(fastMinQty);
                        setBuyStep("fast-contact");
                      }}
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
                  {isDisposables ? (
                    fastBelowMin && (
                      <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs font-semibold text-amber-900">Minimum order is {DISPOSABLES_MIN_QTY} units for disposables</p>
                        <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                          You currently have <strong>{fastQty}</strong> unit{fastQty === 1 ? "" : "s"}. Use the quantity selector below to reach <strong>{DISPOSABLES_MIN_QTY}</strong>.
                        </p>
                      </div>
                    )
                  ) : (
                    fastUnitPrice > 0 && fastUnitPrice < FAST_ORDER_MIN && (
                      <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs font-semibold text-amber-900">Fast order minimum is ${FAST_ORDER_MIN}</p>
                        <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                          At ${fastUnitPrice.toFixed(2)} each, you need at least <strong>{fastMinQty}</strong> unit{fastMinQty === 1 ? "" : "s"} to reach ${FAST_ORDER_MIN}.
                        </p>
                      </div>
                    )
                  )}
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-medium text-gray-500 mb-1 block">Quantity</label>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setFastQty((q) => Math.max(fastMinQty, q - 1))}
                            disabled={fastQty <= fastMinQty}
                            className="w-9 h-9 flex items-center justify-center text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            −
                          </button>
                          <span className="w-10 text-center text-sm font-semibold text-gray-900">{fastQty}</span>
                          <button
                            type="button"
                            onClick={() => setFastQty((q) => Math.min(isDisposables ? 1000 : 99, q + 1))}
                            className="w-9 h-9 flex items-center justify-center text-gray-700 hover:bg-gray-100"
                          >
                            +
                          </button>
                        </div>
                        <p className="text-xs text-gray-500">
                          Line total: <strong className="text-gray-900">${fastLineTotal.toFixed(2)}</strong>
                        </p>
                      </div>
                    </div>
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

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden group hover:border-gray-300 hover:shadow-lg transition-all duration-300">
        {/* Product Image/Video */}
        <Link
          ref={mediaRef}
          href={`/product/${slug || id}`}
          className="block relative aspect-[5/4] sm:aspect-square overflow-hidden bg-gray-100"
          onMouseEnter={isTouchDevice ? undefined : () => {
            setIsHovering(true);
            if (videoRef.current && videoUrl) {
              videoRef.current.play().catch(() => {});
            }
          }}
          onMouseLeave={isTouchDevice ? undefined : () => {
            setIsHovering(false);
            if (videoRef.current) {
              videoRef.current.pause();
              videoRef.current.currentTime = 0;
            }
          }}
        >
          <CloudImage
            src={optimizeImage(imageUrl, "card")}
            alt={`${title} — premium ${category.toLowerCase()} from Real Duck Distro Los Angeles, nationwide cannabis shipping`}
            title={`${title} | Real Duck Distro`}
            fill
            loading="lazy"
            placeholder={blurUrl(imageUrl) ? "blur" : "empty"}
            blurDataURL={blurUrl(imageUrl) || undefined}
            className={`object-cover transition-all duration-500 ${
              isHovering && videoUrl ? "opacity-0" : "opacity-100 group-hover:scale-105"
            }`}
            sizes="(max-width: 480px) 50vw, (max-width: 768px) 33vw, 25vw"
          />

          {/* Video Overlay — preload=metadata loads just the first frame, not the whole file */}
          {videoUrl && (
            <video
              ref={videoRef}
              src={videoUrl}
              muted
              loop
              playsInline
              preload="metadata"
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                isHovering ? "opacity-100" : "opacity-0"
              }`}
            />
          )}

          {/* Category Badge */}
          <div className="absolute top-2.5 left-2.5">
            <span className="bg-slate-900 text-white text-[10px] font-medium px-2.5 py-1 rounded uppercase tracking-wide">
              {category}
            </span>
          </div>

          {/* Indoor Badge - Only for Flower */}
          {indoor && category === "FLOWER" && (
            <div className="absolute top-2.5 right-2.5">
              <span className="bg-white/90 backdrop-blur-sm text-slate-700 text-[10px] font-medium px-2.5 py-1 rounded">
                Indoor
              </span>
            </div>
          )}

          {/* Like Button */}
          <button
            onClick={handleLikeClick}
            aria-label="Like product"
            className="absolute bottom-2.5 right-2.5 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white"
          >
            <Heart
              className={`w-4 h-4 transition-colors duration-200 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-500 hover:text-red-500'
                }`}
            />
          </button>

          {/* Sold Out Overlay */}
          {isSoldOut && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-white text-slate-900 text-xs font-semibold px-4 py-2 rounded">
                SOLD OUT
              </span>
            </div>
          )}
        </Link>

        {/* Product Info */}
        <div className="p-4">
          {/* Title */}
          <Link href={`/product/${slug || id}`}>
            <h2 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[40px] hover:text-gray-600 transition-colors duration-200">
              {title}
            </h2>
          </Link>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mb-3">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${i < Math.floor(ratingNumber / 2)
                      ? "fill-amber-400 text-amber-400"
                      : "fill-gray-200 text-gray-200"
                    }`}
                />
              ))}
            </div>
            <span className="text-[10px] text-gray-500">{rating}</span>
          </div>

          {/* Pricing */}
          <div className="bg-gray-50 rounded-md p-3 mb-4">
            <div className="space-y-1.5 text-xs">
              {isSinglePrice ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Intown:</span>
                    <div className="flex items-center gap-1.5">
                      {slashedPrice(priceLocalLines[0], nthLine(slashedPriceLocal, 0)) && (
                        <span className="text-[10px] text-red-600 line-through font-bold">{slashedPrice(priceLocalLines[0], nthLine(slashedPriceLocal, 0))}</span>
                      )}
                      <span className="font-semibold text-gray-900">{priceLocalLines[0]}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Shipped:</span>
                    <div className="flex items-center gap-1.5">
                      {slashedPrice(priceShipLines[0], nthLine(slashedPriceShip, 0)) && (
                        <span className="text-[10px] text-red-600 line-through font-bold">{slashedPrice(priceShipLines[0], nthLine(slashedPriceShip, 0))}</span>
                      )}
                      <span className="font-semibold text-gray-900">{priceShipLines[0]}</span>
                    </div>
                  </div>
                </>
              ) : (
                priceLocalLines.map((localLine, idx) => {
                  const shipLine = priceShipLines[idx] || "";
                  const localSlash = slashedPrice(localLine, nthLine(slashedPriceLocal, idx));
                  const shipSlash = slashedPrice(shipLine, nthLine(slashedPriceShip, idx));
                  return (
                    <div key={idx} className="flex justify-between text-[10px]">
                      <div className="flex items-center gap-1">
                        {localSlash && (
                          <span className="text-red-600 line-through font-bold">{localSlash}</span>
                        )}
                        <span className="text-gray-700 font-medium">{localLine}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {shipSlash && (
                          <span className="text-red-600 line-through font-bold">{shipSlash}</span>
                        )}
                        <span className="text-gray-700 font-medium">{shipLine}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <Button
              className="w-full h-10 text-sm font-medium bg-slate-900 hover:bg-slate-800 text-white rounded-md transition-colors duration-200"
              disabled={isSoldOut}
              onClick={() => setShowBuyModal(true)}
            >
              Buy Now
            </Button>
            <Button
              variant="outline"
              className={`w-full h-9 text-xs font-medium border rounded-md transition-colors duration-200 ${
                alreadyInCart
                  ? "border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700"
              }`}
              disabled={isSoldOut}
              onClick={handleAddToCart}
            >
              {alreadyInCart ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-2" />
                  Already in Cart
                </>
              ) : (
                <>
                  <ShoppingCart className="h-3.5 w-3.5 mr-2" />
                  Add to Cart
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
