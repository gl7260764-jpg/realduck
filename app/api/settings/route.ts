import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Every page load fetches this, so it must not hit the database per visitor.
// Served from the ISR cache for up to 5 minutes; an admin save calls
// revalidatePath("/api/settings") (see /api/admin/settings) so edits still show
// at once.
export const revalidate = 300;

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
