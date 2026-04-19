"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Home, Package, MessageCircle, MessageSquare, ExternalLink, X, BadgeCheck, Download, FileText, Megaphone, Phone } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useSettings } from "../context/SettingsContext";

// Snapchat Ghost Icon
const SnapchatIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z"/>
  </svg>
);

// TikTok Icon
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46v-7.15a8.16 8.16 0 005.58 2.18v-3.45a4.85 4.85 0 01-1.68-.31 4.83 4.83 0 01-1.32-.74V6.69h3z"/>
  </svg>
);

// Telegram Icon
const TelegramIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

// Potato Chat Icon
const PotatoChatIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2C6.48 2 2 6.04 2 11c0 2.76 1.36 5.22 3.5 6.84V22l3.58-1.96C10.04 20.34 10.99 20.5 12 20.5c5.52 0 10-4.04 10-9S17.52 2 12 2zm1.07 12.13l-2.54-2.72L5.3 14.13l5.74-6.13 2.6 2.72 5.17-2.72-5.74 6.13z"/>
  </svg>
);

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
            {settings.potatoChat && (
              <a
                href={settings.potatoChat}
                target="_blank"
                rel="noopener noreferrer"
                className="relative w-10 h-10 flex items-center justify-center rounded-md hover:bg-orange-500/20 transition-colors duration-200 group"
                aria-label="Potato Chat"
              >
                <PotatoChatIcon className="w-5 h-5 text-orange-400 group-hover:scale-110 transition-transform duration-200" />
              </a>
            )}
            {settings.snapchatLink && (
              <a
                href={settings.snapchatLink}
                target="_blank"
                rel="noopener noreferrer"
                className="relative w-10 h-10 flex items-center justify-center rounded-md hover:bg-[#FFFC00]/20 transition-colors duration-200 group"
                aria-label="Snapchat"
              >
                <SnapchatIcon className="w-5 h-5 text-[#FFFC00] group-hover:scale-110 transition-transform duration-200" />
              </a>
            )}
            {settings.signalLink && (
              <a
                href={settings.signalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="relative w-10 h-10 flex items-center justify-center rounded-md hover:bg-[#3A76F0]/20 transition-colors duration-200 group"
                aria-label="Signal"
              >
                <MessageSquare className="w-5 h-5 text-[#3A76F0] group-hover:scale-110 transition-transform duration-200" />
              </a>
            )}
            {settings.tiktokLink && (
              <a
                href={settings.tiktokLink}
                target="_blank"
                rel="noopener noreferrer"
                className="relative w-10 h-10 flex items-center justify-center rounded-md hover:bg-white/10 transition-colors duration-200 group"
                aria-label="TikTok"
              >
                <TikTokIcon className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-200" />
              </a>
            )}
            {settings.telegramChannel && (
              <a
                href={settings.telegramChannel}
                target="_blank"
                rel="noopener noreferrer"
                className="relative w-10 h-10 flex items-center justify-center rounded-md hover:bg-[#29B6F6]/20 transition-colors duration-200 group"
                aria-label="Telegram"
              >
                <TelegramIcon className="w-5 h-5 text-[#29B6F6] group-hover:scale-110 transition-transform duration-200" />
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
              <p className="text-white/30 text-[10px] font-semibold tracking-wider">HQ: LA, USA | SYDNEY, AUS</p>
              <p className="text-white/20 text-[10px] font-semibold tracking-wider">USA | AUS | WORLDWIDE</p>
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
              The world&apos;s leading premium cannabis lifestyle brand. Delivering across the USA, Australia &amp; worldwide.
            </p>
            {settings.telegramChannel && (
              <a
                href={settings.telegramChannel}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[#29B6F6] hover:text-[#29B6F6]/80 transition-colors duration-200 text-sm mt-3"
              >
                <TelegramIcon className="w-4 h-4" />
                <span>Join our Telegram</span>
              </a>
            )}
          </div>

          {/* Snapchat Verification */}
          {settings.snapchatLink && (
            <div
              className={`mb-6 transition-all duration-300 ${
                isMenuOpen && isAnimating ? "opacity-100" : "opacity-0"
              }`}
              style={{ transitionDelay: isMenuOpen ? "175ms" : "0ms" }}
            >
              <a
                href={settings.snapchatLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#FFFC00] text-black font-medium py-2.5 px-4 rounded-lg hover:bg-[#FFFC00]/90 transition-all duration-200"
              >
                <BadgeCheck className="w-5 h-5" />
                <span className="text-sm">Verify On Snapchat</span>
              </a>
            </div>
          )}

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
              <span className="text-white/30 text-xs">LA</span>
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
