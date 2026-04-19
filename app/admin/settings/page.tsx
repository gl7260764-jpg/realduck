"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, Send, MessageSquare, CheckCircle, AlertCircle, Loader2, ExternalLink, Bot, Mail, Server, Shield, Eye, EyeOff, Music, Phone, MessageCircle } from "lucide-react";

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  const socialFields: { key: keyof Settings; label: string; description: string; icon: React.ReactNode; placeholder: string; color: string; inputType?: string; isLink?: boolean }[] = [
    {
      key: "telegramOrder",
      label: "Telegram Order Link",
      description: "Shown on success pages as company contact link.",
      icon: <Send className="w-5 h-5 text-[#29B6F6]" />,
      placeholder: "https://t.me/YourUsername",
      color: "border-[#29B6F6]/30 focus:border-[#29B6F6]",
      isLink: true,
    },
    {
      key: "telegramChannel",
      label: "Telegram Channel / Group",
      description: "Shown in navbar, footer, contact links, and \"Join our Telegram\" button. Leave empty to hide.",
      icon: <TelegramIcon className="w-5 h-5 text-[#29B6F6]" />,
      placeholder: "https://t.me/YourChannel",
      color: "border-[#29B6F6]/30 focus:border-[#29B6F6]",
      isLink: true,
    },
    {
      key: "snapchatLink",
      label: "Snapchat Link",
      description: "Shown in navbar and sidebar \"Verify On Snapchat\" button. Leave empty to hide.",
      icon: <SnapchatIcon className="w-5 h-5 text-[#FFFC00]" />,
      placeholder: "https://snapchat.com/t/YourLink",
      color: "border-[#FFFC00]/30 focus:border-[#FFFC00]",
      isLink: true,
    },
    {
      key: "signalLink",
      label: "Signal Link",
      description: "Shown in navbar and footer. Leave empty to hide.",
      icon: <MessageSquare className="w-5 h-5 text-[#3A76F0]" />,
      placeholder: "https://signal.me/#eu/YourLink",
      color: "border-[#3A76F0]/30 focus:border-[#3A76F0]",
      isLink: true,
    },
    {
      key: "tiktokLink",
      label: "TikTok Link",
      description: "Shown in navbar and footer. Leave empty to hide.",
      icon: <Music className="w-5 h-5 text-white" />,
      placeholder: "https://tiktok.com/@YourUsername",
      color: "border-gray-300 focus:border-gray-900",
      isLink: true,
    },
    {
      key: "phoneNumber",
      label: "Phone Number",
      description: "Shown in navbar (call icon) and footer. Leave empty to hide.",
      icon: <Phone className="w-5 h-5 text-green-500" />,
      placeholder: "+1 (555) 123-4567",
      color: "border-green-300 focus:border-green-500",
      inputType: "tel",
      isLink: false,
    },
    {
      key: "potatoChat",
      label: "Potato Chat Link",
      description: "Shown in navbar and footer. Leave empty to hide.",
      icon: <MessageCircle className="w-5 h-5 text-orange-500" />,
      placeholder: "https://potato.chat/YourUsername",
      color: "border-orange-300 focus:border-orange-500",
      isLink: true,
    },
  ];

  const adminFields: { key: keyof Settings; label: string; description: string; icon: React.ReactNode; placeholder: string; type?: string; secret?: boolean }[] = [
    {
      key: "telegramBotToken",
      label: "Telegram Bot Token",
      description: "Token from @BotFather. Used to send order notifications.",
      icon: <Bot className="w-5 h-5 text-[#29B6F6]" />,
      placeholder: "123456789:AAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      secret: true,
    },
    {
      key: "telegramChatId",
      label: "Telegram Chat / Group ID",
      description: "Chat ID where order notifications are sent. Use negative number for groups.",
      icon: <Send className="w-5 h-5 text-[#29B6F6]" />,
      placeholder: "-1001234567890",
    },
    {
      key: "companyEmail",
      label: "Company Contact Email",
      description: "Shown to customers on success pages as a way to contact you.",
      icon: <Mail className="w-5 h-5 text-slate-600" />,
      placeholder: "contact@yourcompany.com",
    },
    {
      key: "adminEmail",
      label: "Admin Notification Email",
      description: "Order notifications are sent to this email address.",
      icon: <Mail className="w-5 h-5 text-red-500" />,
      placeholder: "admin@yourcompany.com",
    },
    {
      key: "smtpHost",
      label: "SMTP Host",
      description: "Email server hostname. Use smtp.gmail.com for Gmail.",
      icon: <Server className="w-5 h-5 text-gray-500" />,
      placeholder: "smtp.gmail.com",
    },
    {
      key: "smtpPort",
      label: "SMTP Port",
      description: "Usually 587 for TLS or 465 for SSL.",
      icon: <Server className="w-5 h-5 text-gray-500" />,
      placeholder: "587",
    },
    {
      key: "smtpUser",
      label: "SMTP Username / Email",
      description: "The email account used to send emails.",
      icon: <Shield className="w-5 h-5 text-gray-500" />,
      placeholder: "your-email@gmail.com",
    },
    {
      key: "smtpPassword",
      label: "SMTP Password / App Password",
      description: "For Gmail, use an App Password (Google Account → Security → App Passwords).",
      icon: <Shield className="w-5 h-5 text-red-500" />,
      placeholder: "your-app-password",
      secret: true,
    },
  ];

  const toggleSecret = (key: string) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderField = (field: typeof adminFields[0], colorClass?: string) => (
    <div
      key={field.key}
      className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
          {field.icon}
        </div>
        <div className="flex-1 min-w-0">
          <label className="block text-sm font-semibold text-gray-900">
            {field.label}
          </label>
          <p className="text-xs text-gray-500 mt-0.5">{field.description}</p>
        </div>
      </div>
      <div className="relative">
        <input
          type={field.secret && !showSecrets[field.key] ? "password" : "text"}
          value={settings[field.key]}
          onChange={(e) =>
            setSettings((prev) => ({ ...prev, [field.key]: e.target.value }))
          }
          placeholder={field.placeholder}
          className={`w-full px-4 py-2.5 text-sm border rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-opacity-50 transition-all ${colorClass || "border-gray-200 focus:border-slate-900"} ${field.secret ? "pr-10" : ""}`}
        />
        {field.secret && (
          <button
            type="button"
            onClick={() => toggleSecret(field.key)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showSecrets[field.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Site Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Update your social links and admin configuration. Changes take effect immediately.
        </p>
      </div>

      {/* Social Links */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Social Links</h2>
        <div className="space-y-5">
          {socialFields.map((field) => (
            <div
              key={field.key}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  {field.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-sm font-semibold text-gray-900">
                    {field.label}
                  </label>
                  <p className="text-xs text-gray-500 mt-0.5">{field.description}</p>
                </div>
                {field.isLink && settings[field.key] && (
                  <a
                    href={settings[field.key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                    title="Open link"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
              <input
                type={field.inputType || "url"}
                value={settings[field.key]}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, [field.key]: e.target.value }))
                }
                placeholder={field.placeholder}
                className={`w-full px-4 py-2.5 text-sm border rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-opacity-50 transition-all ${field.color}`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Admin Configuration */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-lg font-semibold text-gray-900">Admin Configuration</h2>
          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full uppercase">Sensitive</span>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Telegram bot and email settings for receiving orders. Update these if your bot or email gets changed.
        </p>

        <div className="space-y-5">
          {/* Telegram Bot Section */}
          <div className="border border-[#29B6F6]/20 rounded-2xl p-4 bg-[#29B6F6]/5">
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#29B6F6]" />
              Telegram Bot
            </h3>
            <div className="space-y-4">
              {adminFields.filter(f => f.key === "telegramBotToken" || f.key === "telegramChatId").map(f => renderField(f, "border-[#29B6F6]/30 focus:border-[#29B6F6]"))}
            </div>
          </div>

          {/* Email Section */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-600" />
              Email Configuration
            </h3>
            <div className="space-y-4">
              {adminFields.filter(f => !["telegramBotToken", "telegramChatId"].includes(f.key)).map(f => renderField(f))}
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mb-10 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? "Saving..." : "Save Changes"}
        </button>

        {status === "success" && (
          <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium animate-in fade-in">
            <CheckCircle className="w-4 h-4" />
            Settings saved successfully
          </div>
        )}
        {status === "error" && (
          <div className="flex items-center gap-1.5 text-red-500 text-sm font-medium animate-in fade-in">
            <AlertCircle className="w-4 h-4" />
            Failed to save. Try again.
          </div>
        )}
      </div>
    </div>
  );
}
