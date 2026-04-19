import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const DEFAULT_SETTINGS: Record<string, string> = {
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

// Sensitive keys that should never be exposed to the frontend
const SENSITIVE_KEYS = new Set([
  "telegramBotToken",
  "telegramChatId",
  "adminEmail",
  "smtpHost",
  "smtpPort",
  "smtpUser",
  "smtpPassword",
]);

export async function GET() {
  try {
    const rows = await prisma.siteSetting.findMany();
    const settings: Record<string, string> = { ...DEFAULT_SETTINGS };
    for (const row of rows) {
      if (!SENSITIVE_KEYS.has(row.key)) {
        settings[row.key] = row.value;
      }
    }
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json(DEFAULT_SETTINGS);
  }
}
