import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Always fetch fresh — admin edits must be reflected immediately without
// waiting for Vercel's default edge cache / ISR to expire.
export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    return NextResponse.json(settings, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch {
    return NextResponse.json(DEFAULT_SETTINGS, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  }
}
