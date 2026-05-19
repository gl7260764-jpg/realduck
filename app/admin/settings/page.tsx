"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, Send, MessageSquare, CheckCircle, AlertCircle, Loader2, ExternalLink, Bot, Mail, Server, Shield, Eye, EyeOff, Music, Phone, MessageCircle, Settings as SettingsIcon, Link2 } from "lucide-react";

// Telegram Icon
const TelegramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

// Snapchat Icon
const SnapchatIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z"/>
  </svg>
);

interface Settings {
  telegramOrder: string;
  telegramChannel: string;
  snapchatLink: string;
  signalLink: string;
  tiktokLink: string;
  phoneNumber: string;
  potatoChat: string;
  telegramBotToken: string;
  telegramChatId: string;
  adminEmail: string;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPassword: string;
  companyEmail: string;
}

type SectionKey = "social" | "telegram" | "email";

const SECTIONS: Array<{ key: SectionKey; label: string; description: string; icon: typeof Link2 }> = [
  { key: "social", label: "Social & contact links", description: "Public-facing channels — shown in navbar, footer, and order success pages.", icon: Link2 },
  { key: "telegram", label: "Telegram bot", description: "Bot credentials for receiving live order notifications.", icon: Bot },
  { key: "email", label: "Email & SMTP", description: "Outbound email server config + admin notification address.", icon: Mail },
];

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings>({
    telegramOrder: "",
    telegramChannel: "",
    snapchatLink: "",
    signalLink: "",
    tiktokLink: "",
    phoneNumber: "",
    potatoChat: "",
    telegramBotToken: "",
    telegramChatId: "",
    adminEmail: "",
    smtpHost: "",
    smtpPort: "587",
    smtpUser: "",
    smtpPassword: "",
    companyEmail: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [activeSection, setActiveSection] = useState<SectionKey>("social");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => {
        if (r.status === 401) { router.push("/admin/login"); return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setSettings((prev) => {
          const updated = { ...prev };
          for (const key of Object.keys(prev) as (keyof Settings)[]) {
            if (typeof data[key] === "string") {
              updated[key] = data[key];
            }
          }
          return updated;
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    setStatus("idle");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (!res.ok) throw new Error();
      setStatus("success");
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    } finally {
      setSaving(false);
    }
  };

  const switchSection = (key: SectionKey) => {
    setActiveSection(key);
    // Scroll back to top so the user sees the freshly-rendered section
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleSecret = (key: string) =>
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));

  // ─── Field definitions ──────────────────────────────────────────────
  const socialFields: Array<{
    key: keyof Settings; label: string; description: string;
    icon: React.ReactNode; placeholder: string; color: string;
    inputType?: string; isLink?: boolean;
  }> = [
    {
      key: "telegramOrder",
      label: "Telegram Order Link",
      description: "Shown on success pages as company contact link.",
      icon: <Send className="w-4 h-4 text-[#29B6F6]" />,
      placeholder: "https://t.me/YourUsername",
      color: "border-[#29B6F6]/30 focus:border-[#29B6F6]",
      isLink: true,
    },
    {
      key: "telegramChannel",
      label: "Telegram Channel / Group",
      description: "Shown in navbar, footer, contact links, and \"Join our Telegram\" button.",
      icon: <TelegramIcon className="w-4 h-4 text-[#29B6F6]" />,
      placeholder: "https://t.me/YourChannel",
      color: "border-[#29B6F6]/30 focus:border-[#29B6F6]",
      isLink: true,
    },
    {
      key: "snapchatLink",
      label: "Snapchat Link",
      description: "Shown in navbar and sidebar \"Verify On Snapchat\" button.",
      icon: <SnapchatIcon className="w-4 h-4 text-[#FFFC00]" />,
      placeholder: "https://snapchat.com/t/YourLink",
      color: "border-[#FFFC00]/40 focus:border-[#FFFC00]",
      isLink: true,
    },
    {
      key: "signalLink",
      label: "Signal Link",
      description: "Shown in navbar and footer.",
      icon: <MessageSquare className="w-4 h-4 text-[#3A76F0]" />,
      placeholder: "https://signal.me/#eu/YourLink",
      color: "border-[#3A76F0]/30 focus:border-[#3A76F0]",
      isLink: true,
    },
    {
      key: "tiktokLink",
      label: "TikTok Link",
      description: "Shown in navbar and footer.",
      icon: <Music className="w-4 h-4 text-slate-700" />,
      placeholder: "https://tiktok.com/@YourUsername",
      color: "border-slate-300 focus:border-slate-900",
      isLink: true,
    },
    {
      key: "phoneNumber",
      label: "Phone Number",
      description: "Shown in navbar (call icon) and footer.",
      icon: <Phone className="w-4 h-4 text-emerald-500" />,
      placeholder: "+1 (555) 123-4567",
      color: "border-emerald-300 focus:border-emerald-500",
      inputType: "tel",
      isLink: false,
    },
    {
      key: "potatoChat",
      label: "Potato Chat Link",
      description: "Shown in navbar and footer.",
      icon: <MessageCircle className="w-4 h-4 text-orange-500" />,
      placeholder: "https://potato.chat/YourUsername",
      color: "border-orange-300 focus:border-orange-500",
      isLink: true,
    },
  ];

  const telegramFields: Array<{
    key: keyof Settings; label: string; description: string;
    icon: React.ReactNode; placeholder: string; secret?: boolean;
  }> = [
    {
      key: "telegramBotToken",
      label: "Bot Token",
      description: "Token from @BotFather. Used to send order notifications.",
      icon: <Bot className="w-4 h-4 text-[#29B6F6]" />,
      placeholder: "123456789:AAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      secret: true,
    },
    {
      key: "telegramChatId",
      label: "Chat / Group ID",
      description: "Where notifications are sent. Negative number for groups.",
      icon: <Send className="w-4 h-4 text-[#29B6F6]" />,
      placeholder: "-1001234567890",
    },
  ];

  const emailFields: Array<{
    key: keyof Settings; label: string; description: string;
    icon: React.ReactNode; placeholder: string; secret?: boolean;
  }> = [
    {
      key: "companyEmail",
      label: "Company Contact Email",
      description: "Shown to customers as a way to contact you.",
      icon: <Mail className="w-4 h-4 text-slate-600" />,
      placeholder: "contact@yourcompany.com",
    },
    {
      key: "adminEmail",
      label: "Admin Notification Email",
      description: "Order notifications get sent here.",
      icon: <Mail className="w-4 h-4 text-rose-500" />,
      placeholder: "admin@yourcompany.com",
    },
    {
      key: "smtpHost",
      label: "SMTP Host",
      description: "Email server hostname.",
      icon: <Server className="w-4 h-4 text-slate-500" />,
      placeholder: "smtp.gmail.com",
    },
    {
      key: "smtpPort",
      label: "SMTP Port",
      description: "587 for TLS · 465 for SSL.",
      icon: <Server className="w-4 h-4 text-slate-500" />,
      placeholder: "587",
    },
    {
      key: "smtpUser",
      label: "SMTP Username",
      description: "Email account used to send.",
      icon: <Shield className="w-4 h-4 text-slate-500" />,
      placeholder: "your-email@gmail.com",
    },
    {
      key: "smtpPassword",
      label: "SMTP Password",
      description: "Use App Password for Gmail.",
      icon: <Shield className="w-4 h-4 text-rose-500" />,
      placeholder: "your-app-password",
      secret: true,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
      </div>
    );
  }

  return (
    <div className="admin-page">
      {/* ─── Sticky save bar ──────────────────────────────────── */}
      <div className="sticky top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-10 2xl:-mx-14 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-14 py-3 backdrop-blur-xl bg-white/70 border-b border-slate-200/60">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.14em]">Configuration</p>
            <h1 className="text-[22px] sm:text-[24px] font-semibold text-slate-900 tracking-tight leading-tight">Settings</h1>
          </div>
          <div className="flex items-center gap-3">
            {status === "success" && (
              <div className="hidden sm:flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
                <CheckCircle className="w-4 h-4" /> Saved
              </div>
            )}
            {status === "error" && (
              <div className="hidden sm:flex items-center gap-1.5 text-rose-500 text-sm font-medium">
                <AlertCircle className="w-4 h-4" /> Failed — try again
              </div>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Body grid: nav + sections ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8">

        {/* Sidebar nav — sticky on lg+, horizontal scroller on mobile */}
        <aside className="lg:col-span-3 xl:col-span-3 2xl:col-span-2">
          <nav className="lg:sticky lg:top-[88px]">
            {/* Mobile: horizontal pill row */}
            <ul className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 lg:hidden">
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                const isActive = activeSection === s.key;
                return (
                  <li key={s.key} className="flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => switchSection(s.key)}
                      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                        isActive ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" /> {s.label.split(" ")[0]}
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Desktop: vertical nav */}
            <ul className="hidden lg:block space-y-1">
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                const isActive = activeSection === s.key;
                return (
                  <li key={s.key}>
                    <button
                      type="button"
                      onClick={() => switchSection(s.key)}
                      className={`group w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-lg transition-all border ${
                        isActive
                          ? "bg-white border-slate-200 shadow-sm"
                          : "border-transparent hover:bg-white/60 hover:border-slate-200"
                      }`}
                    >
                      <span className={`flex items-center justify-center w-7 h-7 rounded-md flex-shrink-0 mt-0.5 transition-colors ${
                        isActive ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                      }`}>
                        <Icon className="w-3.5 h-3.5" strokeWidth={2.4} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block text-[13px] font-semibold ${isActive ? "text-slate-900" : "text-slate-700"}`}>{s.label}</span>
                        <span className="block text-[11px] text-slate-500 mt-0.5 leading-snug">{s.description}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Save status badge — desktop sidebar */}
            <div className="hidden lg:block mt-6 p-3 rounded-lg bg-blue-50/60 border border-blue-100">
              <div className="flex items-start gap-2">
                <SettingsIcon className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[12px] font-semibold text-blue-900">Changes are live</p>
                  <p className="text-[11px] text-blue-700/80 mt-0.5">Settings take effect across the site within seconds of saving.</p>
                </div>
              </div>
            </div>
          </nav>
        </aside>

        {/* ─── Main content ──────────────────────────────────── */}
        <main className="lg:col-span-9 xl:col-span-9 2xl:col-span-10 space-y-6 xl:space-y-8">

          {/* SOCIAL */}
          {activeSection === "social" && (
          <section className="admin-fade-in">
            <SectionHeader
              title="Social & contact links"
              description="Public channels shown across your storefront. Empty fields are hidden from the site automatically."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-3 sm:gap-4">
              {socialFields.map((field) => (
                <FieldCard
                  key={field.key}
                  icon={field.icon}
                  label={field.label}
                  description={field.description}
                  trailingAction={field.isLink && settings[field.key] ? (
                    <a
                      href={settings[field.key]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-slate-700 p-1 transition-colors"
                      aria-label={`Open ${field.label}`}
                      title="Open link"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : null}
                >
                  <input
                    type={field.inputType || "url"}
                    value={settings[field.key]}
                    onChange={(e) => setSettings((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className={`w-full px-3 py-2 text-sm bg-slate-50 border rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all ${field.color}`}
                  />
                </FieldCard>
              ))}
            </div>
          </section>
          )}

          {/* TELEGRAM */}
          {activeSection === "telegram" && (
          <section className="admin-fade-in">
            <SectionHeader
              title="Telegram bot"
              description="Bot credentials for receiving order notifications in your Telegram chat."
              badge="Sensitive"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {telegramFields.map((field) => (
                <FieldCard
                  key={field.key}
                  icon={field.icon}
                  label={field.label}
                  description={field.description}
                >
                  <SecretInput
                    value={settings[field.key]}
                    placeholder={field.placeholder}
                    onChange={(v) => setSettings((prev) => ({ ...prev, [field.key]: v }))}
                    isSecret={!!field.secret}
                    show={!!showSecrets[field.key]}
                    onToggle={() => toggleSecret(field.key)}
                    accent="border-[#29B6F6]/30 focus:border-[#29B6F6]"
                  />
                </FieldCard>
              ))}
            </div>
          </section>
          )}

          {/* EMAIL */}
          {activeSection === "email" && (
          <section className="admin-fade-in">
            <SectionHeader
              title="Email & SMTP"
              description="Outbound email server config and admin notification address."
              badge="Sensitive"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              {emailFields.map((field) => (
                <FieldCard
                  key={field.key}
                  icon={field.icon}
                  label={field.label}
                  description={field.description}
                >
                  <SecretInput
                    value={settings[field.key]}
                    placeholder={field.placeholder}
                    onChange={(v) => setSettings((prev) => ({ ...prev, [field.key]: v }))}
                    isSecret={!!field.secret}
                    show={!!showSecrets[field.key]}
                    onToggle={() => toggleSecret(field.key)}
                  />
                </FieldCard>
              ))}
            </div>
          </section>
          )}

          {/* Mobile-only inline status (desktop has it in the sticky bar) */}
          {(status === "success" || status === "error") && (
            <div className="sm:hidden">
              {status === "success" && (
                <div className="flex items-center gap-1.5 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm font-medium">
                  <CheckCircle className="w-4 h-4" /> Settings saved successfully
                </div>
              )}
              {status === "error" && (
                <div className="flex items-center gap-1.5 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm font-medium">
                  <AlertCircle className="w-4 h-4" /> Failed to save. Try again.
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────

function SectionHeader({ title, description, badge }: {
  title: string; description: string; badge?: string;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-1">
        <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
        {badge && (
          <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700 rounded">{badge}</span>
        )}
      </div>
      <p className="text-[12px] text-slate-500 leading-relaxed">{description}</p>
    </div>
  );
}

function FieldCard({
  icon, label, description, trailingAction, children,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  trailingAction?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors">
      <div className="flex items-start gap-2.5 mb-2.5">
        <div className="w-8 h-8 bg-slate-50 rounded-md flex items-center justify-center flex-shrink-0 ring-1 ring-slate-100">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <label className="block text-[13px] font-semibold text-slate-900 leading-tight">{label}</label>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{description}</p>
        </div>
        {trailingAction && <div className="flex-shrink-0">{trailingAction}</div>}
      </div>
      {children}
    </div>
  );
}

function SecretInput({
  value, placeholder, onChange, isSecret, show, onToggle, accent,
}: {
  value: string; placeholder: string;
  onChange: (v: string) => void;
  isSecret: boolean; show: boolean;
  onToggle: () => void;
  accent?: string;
}) {
  return (
    <div className="relative">
      <input
        type={isSecret && !show ? "password" : "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 text-sm bg-slate-50 border rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all ${accent || "border-slate-200 focus:border-slate-400"} ${isSecret ? "pr-9" : ""}`}
      />
      {isSecret && (
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? "Hide secret" : "Show secret"}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1"
        >
          {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      )}
    </div>
  );
}
