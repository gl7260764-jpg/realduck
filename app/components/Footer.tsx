"use client";

import Image from "next/image";
import Link from "next/link";
import { Send, FileText, MessageSquare, Megaphone, Phone, MessageCircle } from "lucide-react";
import { useSettings } from "../context/SettingsContext";

const TelegramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

const SnapchatIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z"/>
  </svg>
);

const PotatoChatIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2C6.48 2 2 6.04 2 11c0 2.76 1.36 5.22 3.5 6.84V22l3.58-1.96C10.04 20.34 10.99 20.5 12 20.5c5.52 0 10-4.04 10-9S17.52 2 12 2zm1.07 12.13l-2.54-2.72L5.3 14.13l5.74-6.13 2.6 2.72 5.17-2.72-5.74 6.13z"/>
  </svg>
);

export default function Footer() {
  const settings = useSettings();

  return (
    <footer className="bg-slate-900 text-white mt-auto border-t border-white/5">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">

        {/* Top Section */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 lg:gap-12">

          {/* Brand */}
          <div className="flex flex-col items-center lg:items-start">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="relative w-[40px] h-[37px] sm:w-[44px] sm:h-[40px]"
                style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
              >
                <Image src="/images/logo.jpg" alt="Real Duck Distro logo" title="Real Duck Distro" fill loading="lazy" className="object-cover" />
              </div>
              <span className="text-lg sm:text-xl font-bold tracking-wide">REAL DUCK DISTRO</span>
            </div>

            <p className="text-sm sm:text-base text-white/40 text-center lg:text-left max-w-xs">
              The world&apos;s leading premium cannabis lifestyle brand.
            </p>
            <div className="flex items-center gap-2 mt-2 text-xs sm:text-sm font-semibold text-white/30 tracking-wider">
              <span>HQ: LA, USA</span>
              <span className="text-white/15">|</span>
              <span>SYDNEY, AUS</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[10px] sm:text-xs font-semibold text-white/25 tracking-wider">
              <span>PRIORITY:</span>
              <span>KENTUCKY</span>
              <span className="text-white/10">·</span>
              <span>MICHIGAN</span>
              <span className="text-white/10">·</span>
              <span>FLORIDA</span>
              <span className="text-white/10">·</span>
              <span>MISSISSIPPI</span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs sm:text-sm font-semibold text-white/20 tracking-wider">
              <span>USA</span>
              <span className="text-white/10">|</span>
              <span>AUS</span>
              <span className="text-white/10">|</span>
              <span>WORLDWIDE SHIPPING</span>
            </div>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-center sm:text-left">
            <div>
              <h4 className="text-sm sm:text-base font-bold text-white mb-3">Explore</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-sm sm:text-base text-white/50 hover:text-white transition-colors">
                    Products
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="text-sm sm:text-base text-white/50 hover:text-white transition-colors flex items-center justify-center sm:justify-start gap-1.5">
                    <FileText className="w-4 h-4" /> Blog
                  </Link>
                </li>
                <li>
                  <Link href="/announcements" className="text-sm sm:text-base text-white/50 hover:text-white transition-colors flex items-center justify-center sm:justify-start gap-1.5">
                    <Megaphone className="w-4 h-4" /> Announcements
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-white mb-3">Connect</h4>
              <ul className="space-y-2">
                {settings.phoneNumber && (
                  <li>
                    <a href={`tel:${settings.phoneNumber.replace(/\s/g, "")}`}
                      className="text-sm sm:text-base text-white/50 hover:text-white transition-colors flex items-center justify-center sm:justify-start gap-1.5">
                      <Phone className="w-4 h-4" /> {settings.phoneNumber}
                    </a>
                  </li>
                )}
                {settings.telegramChannel && (
                  <li>
                    <a href={settings.telegramChannel} target="_blank" rel="noopener noreferrer"
                      className="text-sm sm:text-base text-white/50 hover:text-white transition-colors flex items-center justify-center sm:justify-start gap-1.5">
                      <TelegramIcon className="w-4 h-4" /> Telegram
                    </a>
                  </li>
                )}
                {settings.snapchatLink && (
                  <li>
                    <a href={settings.snapchatLink} target="_blank" rel="noopener noreferrer"
                      className="text-sm sm:text-base text-white/50 hover:text-white transition-colors flex items-center justify-center sm:justify-start gap-1.5">
                      <SnapchatIcon className="w-4 h-4" /> Snapchat
                    </a>
                  </li>
                )}
                {settings.signalLink && (
                  <li>
                    <a href={settings.signalLink} target="_blank" rel="noopener noreferrer"
                      className="text-sm sm:text-base text-white/50 hover:text-white transition-colors flex items-center justify-center sm:justify-start gap-1.5">
                      <MessageSquare className="w-4 h-4" /> Signal
                    </a>
                  </li>
                )}
                {settings.potatoChat && (
                  <li>
                    <a href={settings.potatoChat} target="_blank" rel="noopener noreferrer"
                      className="text-sm sm:text-base text-white/50 hover:text-white transition-colors flex items-center justify-center sm:justify-start gap-1.5">
                      <PotatoChatIcon className="w-4 h-4" /> Potato Chat
                    </a>
                  </li>
                )}
                {settings.companyEmail && (
                  <li>
                    <a href={`mailto:${settings.companyEmail}`}
                      className="text-sm sm:text-base text-white/50 hover:text-white transition-colors flex items-center justify-center sm:justify-start gap-1.5">
                      <Send className="w-4 h-4" /> Email
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/10 my-6 sm:my-8" />

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm sm:text-base text-white/50 text-center sm:text-left">
            &copy; {new Date().getFullYear()} Real Duck Distro. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {settings.phoneNumber && (
              <a href={`tel:${settings.phoneNumber.replace(/\s/g, "")}`} className="text-white/50 hover:text-white transition-colors">
                <Phone className="w-5 h-5 sm:w-6 sm:h-6" />
              </a>
            )}
            {settings.telegramChannel && (
              <a href={settings.telegramChannel} target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors">
                <TelegramIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </a>
            )}
            {settings.snapchatLink && (
              <a href={settings.snapchatLink} target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors">
                <SnapchatIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </a>
            )}
            {settings.signalLink && (
              <a href={settings.signalLink} target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors">
                <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
              </a>
            )}
            {settings.potatoChat && (
              <a href={settings.potatoChat} target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors">
                <PotatoChatIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </a>
            )}
          </div>
        </div>

      </div>
    </footer>
  );
}
