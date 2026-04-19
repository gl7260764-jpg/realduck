"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface SiteSettings {
  telegramOrder: string;
  telegramChannel: string;
  snapchatLink: string;
  signalLink: string;
  tiktokLink: string;
  companyEmail: string;
  phoneNumber: string;
  potatoChat: string;
}

const DEFAULTS: SiteSettings = {
  telegramOrder: "https://t.me/realduckdistrola",
  telegramChannel: "https://t.me/realduckdistrola",
  snapchatLink: "https://snapchat.com/t/QVHfSVoo",
  signalLink:
    "https://signal.me/#eu/3V1ZUTcFh583Lc-oIE3uc8ArK3u6a3HaRqLOhFDE4vHrP2NASupJW6dtV4wKfrPF",
  tiktokLink: "",
  companyEmail: "contact@realduckdistro.com",
  phoneNumber: "",
  potatoChat: "",
};

const SettingsContext = createContext<SiteSettings>(DEFAULTS);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULTS);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => setSettings({ ...DEFAULTS, ...data }))
      .catch(() => {});
  }, []);

  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
