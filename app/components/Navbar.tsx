"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Home, Package, MessageCircle, ExternalLink, X, Download, FileText, Megaphone, Phone } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useSettings } from "../context/SettingsContext";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const { totalItems, setIsOpen: setCartOpen } = useCart();
  const settings = useSettings();

  // Listen for PWA install prompt
  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setIsInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSPrompt(true);
      return;
    }
    if (installPrompt) {
      await installPrompt.prompt();
      const result = await installPrompt.userChoice;
      if (result.outcome === "accepted") setIsInstalled(true);
      setInstallPrompt(null);
    }
  };

  // Close menu on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMenuOpen) setIsMenuOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMenuOpen]);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
      setIsAnimating(true);
    } else {
      document.body.style.overflow = "";
      const timer = setTimeout(() => setIsAnimating(false), 400);
      return () => clearTimeout(timer);
    }
  }, [isMenuOpen]);

  const menuItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/", label: "Products", icon: Package },
    { href: "/blog", label: "Blog", icon: FileText },
    { href: "/announcements", label: "Announcements", icon: Megaphone },
    ...(settings.telegramChannel
      ? [{ href: settings.telegramChannel, label: "Contact Us", icon: MessageCircle, external: true }]
      : []),
  ];

  return (
    <>
      <nav className="bg-slate-900 w-full sticky top-0 z-50 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between">
          {/* Left - Hamburger Menu */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="flex flex-col justify-center items-center w-10 h-10 rounded-md hover:bg-white/5 transition-colors duration-200"
            aria-label="Open menu"
          >
            <span className="block w-5 h-[1.5px] bg-white/90" />
            <span className="block w-5 h-[1.5px] bg-white/90 mt-[5px]" />
            <span className="block w-5 h-[1.5px] bg-white/90 mt-[5px]" />
          </button>

          {/* Center - Logo */}
          <Link href="/" className="flex items-center justify-center">
            <div
              className="relative w-[48px] h-[44px] sm:w-[56px] sm:h-[52px] lg:w-[64px] lg:h-[59px] transition-opacity duration-200 hover:opacity-80"
              style={{
                clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)"
              }}
            >
              <Image
                src="/images/logo.jpg"
                alt="Real Duck Distro logo"
                fill
                className="object-cover"
                priority
              />
            </div>
          </Link>

          {/* Right - Social & Cart */}
          <div className="flex items-center gap-1">
            {settings.phoneNumber && (
              <a
                href={`tel:${settings.phoneNumber.replace(/\s/g, "")}`}
                className="relative w-10 h-10 flex items-center justify-center rounded-md hover:bg-green-500/20 transition-colors duration-200 group"
                aria-label="Call us"
              >
                <Phone className="w-5 h-5 text-green-400 group-hover:scale-110 transition-transform duration-200" />
              </a>
            )}
            {!isInstalled && (isIOS || installPrompt) && (
              <button
                onClick={handleInstall}
                className="relative w-10 h-10 flex items-center justify-center rounded-md hover:bg-blue-500/20 transition-colors duration-200 group"
                aria-label="Add to home screen"
                title="Add to home screen"
              >
                <Download className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform duration-200" />
              </button>
            )}
            <button
              onClick={() => setCartOpen(true)}
              className="relative w-10 h-10 flex items-center justify-center rounded-md hover:bg-white/5 transition-colors duration-200"
              aria-label="Shopping cart"
            >
              <ShoppingCart className="w-5 h-5 text-white/90" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-white text-slate-900 text-[10px] font-semibold min-w-4 h-4 px-1 rounded-full flex items-center justify-center">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 ${
          isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMenuOpen(false)}
      />

      {/* Slide-out Menu */}
      <div
        className={`fixed top-0 left-0 h-full w-[300px] sm:w-[360px] bg-slate-900 z-[70] border-r border-white/5 transition-transform duration-300 ease-out ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Close Button */}
        <button
          onClick={() => setIsMenuOpen(false)}
          className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-md hover:bg-white/5 transition-colors duration-200"
          aria-label="Close menu"
        >
          <X className="w-5 h-5 text-white/70" />
        </button>

        {/* Menu Content */}
        <div className="p-6 sm:p-8 pt-16 h-full overflow-y-auto">
          {/* Logo and Title */}
          <div
            className={`flex items-center gap-4 mb-6 transition-all duration-300 ${
              isMenuOpen && isAnimating ? "opacity-100" : "opacity-0"
            }`}
            style={{ transitionDelay: isMenuOpen ? "100ms" : "0ms" }}
          >
            <div
              className="relative w-[48px] h-[44px] flex-shrink-0"
              style={{
                clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)"
              }}
            >
              <Image
                src="/images/logo.jpg"
                alt="Real Duck Distro logo"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
                Real Duck Distro
              </h2>
              <p className="text-white/60 text-[10px] font-semibold tracking-wider">HQ: LA, USA | SYDNEY, AUS</p>
              <p className="text-white/60 text-[10px] font-semibold tracking-wider">PRIORITY: KY · MI · FL · MS</p>
              <p className="text-white/60 text-[10px] font-semibold tracking-wider">USA | AUS | WORLDWIDE</p>
            </div>
          </div>

          {/* Description */}
          <div
            className={`mb-6 transition-all duration-300 ${
              isMenuOpen && isAnimating ? "opacity-100" : "opacity-0"
            }`}
            style={{ transitionDelay: isMenuOpen ? "150ms" : "0ms" }}
          >
            <p className="text-white/50 text-sm leading-relaxed">
              The world&apos;s leading premium cannabis lifestyle brand. Delivering across the USA, Australia &amp; worldwide — priority service to Kentucky, Michigan, Florida &amp; Mississippi.
            </p>
          </div>

          {/* View All Products Button */}
          <div
            className={`transition-all duration-300 ${
              isMenuOpen && isAnimating ? "opacity-100" : "opacity-0"
            }`}
            style={{ transitionDelay: isMenuOpen ? "200ms" : "0ms" }}
          >
            <Link
              href="/"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full bg-white text-slate-900 font-medium py-3 px-5 rounded-lg transition-opacity duration-200 hover:opacity-90"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>View All Products</span>
            </Link>
          </div>

          {/* Divider */}
          <div
            className={`my-6 h-px bg-white/10 transition-opacity duration-300 ${
              isMenuOpen && isAnimating ? "opacity-100" : "opacity-0"
            }`}
            style={{ transitionDelay: isMenuOpen ? "250ms" : "0ms" }}
          />

          {/* Menu Items */}
          <nav className="space-y-1">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const Component = item.external ? "a" : Link;
              const extraProps = item.external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : { onClick: () => setIsMenuOpen(false) };

              return (
                <div
                  key={item.label}
                  className={`transition-all duration-300 ${
                    isMenuOpen && isAnimating ? "opacity-100" : "opacity-0"
                  }`}
                  style={{ transitionDelay: isMenuOpen ? `${300 + index * 50}ms` : "0ms" }}
                >
                  <Component
                    href={item.href}
                    {...extraProps}
                    className="flex items-center gap-3 text-white/70 hover:text-white py-3 px-3 rounded-lg hover:bg-white/5 transition-colors duration-200"
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium text-sm">{item.label}</span>
                    {item.external && (
                      <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-50" />
                    )}
                  </Component>
                </div>
              );
            })}
          </nav>

          {/* Footer */}
          <div
            className={`absolute bottom-6 left-6 right-6 transition-all duration-300 ${
              isMenuOpen && isAnimating ? "opacity-100" : "opacity-0"
            }`}
            style={{ transitionDelay: isMenuOpen ? "450ms" : "0ms" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 opacity-40">
                <div
                  className="relative w-[24px] h-[22px]"
                  style={{
                    clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)"
                  }}
                >
                  <Image
                    src="/images/logo.jpg"
                    alt="Real Duck Distro logo"
                    fill
                    className="object-cover"
                  />
                </div>
                <span className="text-white text-xs font-medium tracking-wide">REAL DUCK DISTRO</span>
              </div>
              <span className="text-white/60 text-xs">LA</span>
            </div>
          </div>
        </div>
      </div>

      {/* iOS Install Instructions */}
      {showIOSPrompt && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]"
            onClick={() => setShowIOSPrompt(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-[90] bg-slate-900 border-t border-white/10 rounded-t-2xl p-6 pb-8 animate-slide-up">
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />
            <h3 className="text-white text-base font-semibold text-center mb-4">
              Add to Home Screen
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-blue-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                    <polyline strokeLinecap="round" strokeLinejoin="round" points="16,6 12,2 8,6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                </div>
                <p className="text-white/80 text-sm">
                  Tap the <span className="font-semibold text-white">Share</span> button in Safari
                </p>
              </div>
              <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-blue-400">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </div>
                <p className="text-white/80 text-sm">
                  Scroll down and tap <span className="font-semibold text-white">Add to Home Screen</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowIOSPrompt(false)}
              className="w-full mt-5 h-11 bg-white text-slate-900 font-medium text-sm rounded-lg transition-opacity duration-200 hover:opacity-90"
            >
              Got it
            </button>
          </div>
          <style jsx global>{`
            @keyframes slide-up {
              from { transform: translateY(100%); }
              to { transform: translateY(0); }
            }
            .animate-slide-up {
              animation: slide-up 0.3s ease-out;
            }
          `}</style>
        </>
      )}
    </>
  );
}
