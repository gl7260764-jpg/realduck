"use client";

import { useSettings } from "../context/SettingsContext";

export default function NotFoundContact() {
  const settings = useSettings();

  return (
    <a
      href={settings.telegramChannel}
      target="_blank"
      rel="noopener noreferrer"
      className="px-6 py-3 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
    >
      Contact Us
    </a>
  );
}
